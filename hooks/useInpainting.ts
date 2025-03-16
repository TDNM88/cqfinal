import { useState } from 'react'

// Cấu hình API TensorArt
const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1"
const WORKFLOW_TEMPLATE_ID = "837405094118019506"

// Hàm upload ảnh lên TensorArt
async function uploadImageToTensorArt(imageData: string) {
  const url = `${TENSOR_ART_API_URL}/resource/image`
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`
  }

  try {
    const resourceRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ expireSec: 7200 }),
    })
    const responseText = await resourceRes.text()
    if (!resourceRes.ok) {
      throw new Error(`POST failed: ${resourceRes.status} - ${responseText}`)
    }
    const resourceResponse = JSON.parse(responseText)
    const putUrl = resourceResponse.putUrl as string
    const resourceId = resourceResponse.resourceId as string
    const putHeaders = (resourceResponse.headers as Record<string, string>) || { 'Content-Type': 'image/png' }

    if (!putUrl || !resourceId) {
      throw new Error(`Invalid response: ${JSON.stringify(resourceResponse)}`)
    }

    const imageBlob = await fetch(imageData).then(res => res.blob())
    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: putHeaders,
      body: imageBlob,
    })

    if (![200, 203].includes(putResponse.status)) {
      throw new Error(`PUT failed: ${putResponse.status} - ${await putResponse.text()}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 10000))
    return resourceId
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Hàm tạo job xử lý ảnh
async function createInpaintingJob(productImageUrl: string, maskedImageUrl: string) {
  const url = `${TENSOR_ART_API_URL}/jobs/workflow/template`
  const controller = new AbortController()
  const timeout = 180000 // 3 phút

  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const workflowData = {
      request_id: Date.now().toString(),
      templateId: WORKFLOW_TEMPLATE_ID,
      fields: {
        fieldAttrs: [
          {
            nodeId: "731", // Node hình ảnh sản phẩm
            fieldName: "image",
            fieldValue: productImageUrl
          },
          {
            nodeId: "735", // Node hình ảnh đã gán mask
            fieldName: "image",
            fieldValue: maskedImageUrl
          }
        ]
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`
      },
      body: JSON.stringify(workflowData),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const responseData = await response.json()
    console.log("Response from TensorArt API:", responseData)

    if (!responseData.job?.id) {
      throw new Error("Invalid response from TensorArt API: Missing job ID")
    }

    return responseData
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Request timed out after 3 minutes")
    }
    throw error
  }
}

// Hàm theo dõi tiến trình job
async function pollJobStatus(jobId: string) {
  const maxAttempts = 30
  const delay = 5000 // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${TENSOR_ART_API_URL}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const { job } = await response.json()
      
      if (job.status === 'SUCCESS') {
        if (job.successInfo?.images?.[0]?.url) {
          return job.successInfo.images[0].url
        }
        throw new Error('Kết quả không chứa URL hợp lệ')
      }

      if (job.status === 'FAILED') {
        throw new Error(job.failedInfo?.reason || 'Job xử lý thất bại')
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    } catch (error) {
      console.error(`Lỗi khi kiểm tra trạng thái job (lần thử ${attempt + 1}):`, error)
      throw new Error(`Không thể lấy kết quả: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
    }
  }

  throw new Error('Quá thời gian chờ xử lý job')
}

// Custom hook để xử lý inpainting
export function useInpainting() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const processInpainting = async (imageId: string, maskId: string) => {
    setLoading(true)
    setError(null)
    setResultUrl(null)

    try {
      const jobResponse = await createInpaintingJob(imageId, maskId)
      
      if (!jobResponse.job?.id) {
        throw new Error('Không nhận được ID job từ API')
      }

      const resultUrl = await pollJobStatus(jobResponse.job.id)
      
      setResultUrl(resultUrl)
      return resultUrl
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Lỗi không xác định')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, resultUrl, processInpainting }
} 
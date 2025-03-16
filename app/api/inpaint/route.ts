import { NextResponse } from "next/server"

// Cấu hình API TensorArt
const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1"
const WORKFLOW_TEMPLATE_ID = "837405094118019506"

// Thêm interface cho lỗi
interface APIError {
  code: number
  message: string
}

// Hàm upload ảnh lên TensorArt
async function uploadImageToTensorArt(imageData: string) {
  const url = `${TENSOR_ART_API_URL}/resource/image`
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.TENSOR_ART_API_KEY}`
  }

  try {
    // Tạo resource mới
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

    // Thêm validation
    if (!putUrl || !resourceId) {
      throw new Error(`Invalid response: ${JSON.stringify(resourceResponse)}`)
    }

    // Upload ảnh thực tế
    const imageBlob = await fetch(imageData).then(res => res.blob())
    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: putHeaders,
      body: imageBlob,
    })

    if (![200, 203].includes(putResponse.status)) {
      throw new Error(`PUT failed: ${putResponse.status} - ${await putResponse.text()}`)
    }

    // Đợi 10 giây để đảm bảo ảnh được upload thành công
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
        'Authorization': `Bearer ${process.env.TENSOR_ART_API_KEY}`
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
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${TENSOR_ART_API_URL}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TENSOR_ART_API_KEY}`
      }
    })
    
    const { job } = await response.json()
    
    if (job.status === 'SUCCESS') {
      return job.successInfo.images[0].url
    }
    
    if (job.status === 'FAILED') {
      throw new Error(job.failedInfo?.reason || 'Job failed')
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw new Error('Job processing timed out')
}

// Handler cho POST request
export async function POST(request: Request) {
  try {
    // Thêm validation request
    if (!process.env.TENSOR_ART_API_KEY) {
      throw new Error("Missing API configuration")
    }
    
    const { imageData, maskData } = await request.json()

    // Upload cả ảnh và mask
    const [imageId, maskId] = await Promise.all([
      uploadImageToTensorArt(imageData),
      uploadImageToTensorArt(maskData)
    ])

    // Tạo job xử lý
    const jobResponse = await createInpaintingJob(imageId, maskId)
    const jobId = jobResponse.job.id

    // Theo dõi tiến trình
    const resultUrl = await pollJobStatus(jobId)

    const response = NextResponse.json({
      success: true,
      inpaintedImage: resultUrl
    })

    // Thêm CORS headers
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response

  } catch (error) {
    // Chuẩn hóa lỗi trả về
    const statusCode = error instanceof Error && 'code' in error ? 
      (error as unknown as APIError).code : 500
      
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: statusCode }
    )
  }
}

// Handler cho OPTIONS request
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}


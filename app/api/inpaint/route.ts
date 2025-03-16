import { NextResponse } from "next/server"

// Cấu hình API TensorArt
const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1"
const WORKFLOW_TEMPLATE_ID = "837405094118019506"

// Thêm interface cho lỗi
interface APIError {
  code: number
  message: string
}

async function uploadImageToTensorArt(imageData: string) {
  const url = `${TENSOR_ART_API_URL}/resource/image`
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${process.env.TENSOR_ART_API_KEY}`
  }

  // Tạo resource mới
  const resourceRes = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ expireSec: 7200 }),
  })
  const { putUrl, resourceId } = await resourceRes.json()

  // Thêm validation
  if (!putUrl || !resourceId) {
    const error: APIError = {
      code: 500,
      message: "Invalid response from TensorArt API"
    }
    throw error
  }

  // Upload ảnh thực tế
  const imageBlob = await fetch(imageData).then(res => res.blob())
  await fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: imageBlob,
  })

  return resourceId
}

async function createInpaintingJob(imageId: string, maskId: string) {
  const url = `${TENSOR_ART_API_URL}/jobs/workflow/template`
  
  const workflowData = {
    request_id: Date.now().toString(),
    templateId: WORKFLOW_TEMPLATE_ID,
    fields: {
      fieldAttrs: [
        {
          nodeId: "731", // Node input image
          fieldName: "image",
          fieldValue: imageId
        },
        {
          nodeId: "734", // Node mask
          fieldName: "image",
          fieldValue: maskId
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
    body: JSON.stringify(workflowData)
  })

  return response.json()
}

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

    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  throw new Error('Job processing timed out')
}

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

// Thêm handler OPTIONS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}


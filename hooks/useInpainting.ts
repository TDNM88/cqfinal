import { useState } from 'react';

const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1";
const WORKFLOW_TEMPLATE_ID = "837405094118019506";

async function uploadImageToTensorArt(imageData: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY;
  console.log("API Key for upload:", apiKey);
  if (!apiKey) throw new Error("NEXT_PUBLIC_TENSOR_ART_API_KEY is not defined");

  const response = await fetch(`${TENSOR_ART_API_URL}/resource/image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ expireSec: 7200 }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Upload error:", errorText);
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }
  const { putUrl, resourceId, headers } = await response.json();

  const imageBlob = await fetch(imageData).then((res) => res.blob());
  const putResponse = await fetch(putUrl, {
    method: "PUT",
    headers: headers || { "Content-Type": "image/png" },
    body: imageBlob,
  });

  if (!putResponse.ok) throw new Error(`PUT failed: ${putResponse.status}`);
  return resourceId;
}

async function createInpaintingJob(uploadedImageId: string, productImageId: string, maskImageId: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY;
  console.log("API Key for job creation:", apiKey);
  if (!apiKey) throw new Error("NEXT_PUBLIC_TENSOR_ART_API_KEY is not defined");

  const workflowData = {
    request_id: Date.now().toString(),
    templateId: WORKFLOW_TEMPLATE_ID,
    fields: {
      fieldAttrs: [
        { nodeId: "731", fieldName: "image", fieldValue: uploadedImageId },
        { nodeId: "735", fieldName: "image", fieldValue: productImageId },
        { nodeId: "745", fieldName: "image", fieldValue: maskImageId },
      ],
    },
  };

  console.log("Sending to TensorArt:", JSON.stringify(workflowData, null, 2));

  const response = await fetch(`${TENSOR_ART_API_URL}/jobs/workflow/template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(workflowData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Create job error:", errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.job?.id) throw new Error("Missing job ID");
  return data.job.id;
}

async function pollJobStatus(jobId: string, timeout: number = 300000): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_TENSOR_ART_API_KEY is not defined");

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const response = await fetch(`${TENSOR_ART_API_URL}/jobs/${jobId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!response.ok) throw new Error(`Poll failed: ${response.status}`);
    const data = await response.json();
    if (data.job.status === "SUCCESS") {
      const resultUrl = data.job.resultUrl || data.job.successInfo?.images?.[0]?.url || data.job.output?.[0]?.url;
      if (!resultUrl) throw new Error("No result URL found");
      return resultUrl;
    } else if (data.job.status === "FAILED" || data.job.status === "CANCELLED") {
      throw new Error(`Job ${data.job.status.toLowerCase()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("Timeout");
}

export function useInpainting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function processInpainting(uploadedImageData: string, productImageData: string, maskImageData: string) {
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const [uploadedImageId, productImageId, maskImageId] = await Promise.all([
        uploadImageToTensorArt(uploadedImageData),
        uploadImageToTensorArt(productImageData),
        uploadImageToTensorArt(maskImageData),
      ]);

      const jobId = await createInpaintingJob(uploadedImageId, productImageId, maskImageId);
      const result = await pollJobStatus(jobId);
      setResultUrl(result);
      return result;
    } catch (err) {
      console.error("Error in processInpainting:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, resultUrl, processInpainting };
}

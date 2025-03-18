// hooks/useInpainting.ts
import { useState } from 'react';

const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1";
const WORKFLOW_TEMPLATE_ID = "837405094118019506";

export function useInpainting() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function uploadImageToTensorArt(imageData: string): Promise<string> {
    try {
      const response = await fetch(`${TENSOR_ART_API_URL}/resource/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
        },
        body: JSON.stringify({ expireSec: 7200 }),
      });

      if (!response.ok) throw new Error(`POST failed: ${response.status}`);
      const resourceResponse: { putUrl: string; resourceId: string; headers: Record<string, string> } = await response.json();

      const imageBlob = await fetch(imageData).then((res) => res.blob());
      const putResponse = await fetch(resourceResponse.putUrl, {
        method: "PUT",
        headers: resourceResponse.headers || { "Content-Type": "image/png" },
        body: imageBlob,
      });

      if (!putResponse.ok) throw new Error(`PUT failed: ${putResponse.status}`);
      return resourceResponse.resourceId;
    } catch (error) {
      console.error("Upload error:", error);
      throw error instanceof Error ? error : new Error("Unknown upload error");
    }
  }

  async function createInpaintingJob(uploadedImageId: string, productImageId: string, maskImageId: string): Promise<string> {
    try {
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

      const response = await fetch(`${TENSOR_ART_API_URL}/jobs/workflow/template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: { job: { id: string } } = await response.json();
      if (!data.job?.id) throw new Error("Missing job ID");
      return data.job.id;
    } catch (error) {
      console.error("Job creation error:", error);
      throw error instanceof Error ? error : new Error("Unknown job creation error");
    }
  }

  async function pollJobStatus(jobId: string, timeout: number = 300000): Promise<string> {
    const startTime = Date.now();
    const url = `${TENSOR_ART_API_URL}/jobs/${jobId}`;

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: {
          job: {
            status: string;
            resultUrl?: string;
            successInfo?: { images?: { url: string }[] };
            output?: { url: string }[];
            failureInfo?: { reason?: string };
          };
        } = await response.json();
        console.log("Job status response:", data);

        const job = data.job;
        if (job.status === "SUCCESS") {
          const resultUrl = job.resultUrl || job.successInfo?.images?.[0]?.url || job.output?.[0]?.url;
          if (!resultUrl) throw new Error("No result URL found in SUCCESS response");
          return resultUrl;
        } else if (job.status === "FAILED") {
          throw new Error(`Job failed: ${job.failureInfo?.reason || "Unknown reason"}`);
        } else if (job.status === "CANCELLED") {
          throw new Error("Job was cancelled");
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error("Polling error:", error);
        throw error instanceof Error ? error : new Error("Unknown polling error");
      }
    }
    throw new Error(`Timeout after ${timeout / 1000} seconds`);
  }

  async function processInpainting(uploadedImageData: string, productImageData: string, maskImageData: string): Promise<string> {
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
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, resultUrl, processInpainting };
}

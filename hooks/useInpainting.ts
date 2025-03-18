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

    console.log("Sending workflow data:", workflowData);

    const response = await fetch(`${TENSOR_ART_API_URL}/jobs/workflow/template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
      },
      body: JSON.stringify(workflowData),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (!data.job?.id) throw new Error("Missing job ID");
    return data.job.id;
  } catch (error) {
    console.error("Job creation error:", error);
    throw error instanceof Error ? error : new Error("Unknown job creation error");
  }
}

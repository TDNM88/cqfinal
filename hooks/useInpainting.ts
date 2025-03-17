import { useState } from "react";

// Định nghĩa các hằng số API
const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1";
const WORKFLOW_TEMPLATE_ID = "837405094118019506";

// Định nghĩa kiểu dữ liệu cho phản hồi API (nếu cần mở rộng trong tương lai)
interface ResourceResponse {
  putUrl: string;
  resourceId: string;
  headers: Record<string, string>;
}

interface JobResponse {
  job: {
    id: string;
  };
}

interface JobStatusResponse {
  job: {
    status: string;
    resultUrl?: string;
    successInfo?: { images?: { url: string }[] };
    output?: { url: string }[];
    failureInfo?: { reason?: string };
  };
}

/**
 * Hook tùy chỉnh để xử lý inpainting với TensorArt API
 * @returns Đối tượng chứa trạng thái và hàm xử lý inpainting
 */
export function useInpainting() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  /**
   * Tải ảnh lên TensorArt và lấy ID tài nguyên
   * @param imageData Dữ liệu ảnh dạng base64 (data URL)
   * @returns Promise<string> ID tài nguyên từ TensorArt
   * @throws Lỗi nếu tải ảnh thất bại hoặc dữ liệu không hợp lệ
   */
  async function uploadImageToTensorArt(imageData: string): Promise<string> {
    // Kiểm tra đầu vào
    if (!imageData || typeof imageData !== "string" || !imageData.startsWith("data:image")) {
      throw new Error("Dữ liệu ảnh không hợp lệ, yêu cầu định dạng base64");
    }

    // Kiểm tra API Key
    if (!process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY) {
      throw new Error("Thiếu khóa API TensorArt trong biến môi trường");
    }

    try {
      // Gửi yêu cầu tạo URL tải lên
      const response = await fetch(`${TENSOR_ART_API_URL}/resource/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
        },
        body: JSON.stringify({ expireSec: 7200 }), // Thời gian hết hạn: 2 giờ
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tải ảnh lên thất bại: ${response.status} - ${errorText || response.statusText}`);
      }

      const resourceResponse: ResourceResponse = await response.json();
      if (!resourceResponse.putUrl || !resourceResponse.resourceId) {
        throw new Error("Phản hồi từ TensorArt không chứa putUrl hoặc resourceId");
      }

      // Chuyển đổi dữ liệu base64 thành blob
      const imageBlob = await fetch(imageData).then((res) => {
        if (!res.ok) throw new Error("Không thể chuyển đổi dữ liệu ảnh thành blob");
        return res.blob();
      });

      // Tải ảnh lên URL được cung cấp
      const putResponse = await fetch(resourceResponse.putUrl, {
        method: "PUT",
        headers: resourceResponse.headers || { "Content-Type": "image/png" },
        body: imageBlob,
      });

      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        throw new Error(`Lưu ảnh thất bại: ${putResponse.status} - ${errorText || putResponse.statusText}`);
      }

      return resourceResponse.resourceId;
    } catch (err) {
      console.error("Lỗi khi tải ảnh lên TensorArt:", err);
      throw err instanceof Error ? err : new Error("Lỗi không xác định khi tải ảnh lên TensorArt");
    }
  }

  /**
   * Tạo job inpainting trên TensorArt
   * @param uploadedImageId ID của ảnh gốc
   * @param productImageId ID của ảnh sản phẩm
   * @param maskImageId ID của ảnh mask
   * @returns Promise<string> ID của job đã tạo
   * @throws Lỗi nếu tạo job thất bại hoặc tham số không hợp lệ
   */
  async function createInpaintingJob(
    uploadedImageId: string,
    productImageId: string,
    maskImageId: string
  ): Promise<string> {
    // Kiểm tra đầu vào
    if (!uploadedImageId || !productImageId || !maskImageId) {
      throw new Error("Thiếu một hoặc nhiều ID ảnh cần thiết");
    }
    if (!process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY) {
      throw new Error("Thiếu khóa API TensorArt trong biến môi trường");
    }

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

    try {
      const response = await fetch(`${TENSOR_ART_API_URL}/jobs/workflow/template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tạo job thất bại: ${response.status} - ${errorText || response.statusText}`);
      }

      const data: JobResponse = await response.json();
      if (!data?.job?.id) {
        throw new Error("Phản hồi từ TensorArt không chứa ID job");
      }

      return data.job.id;
    } catch (err) {
      console.error("Lỗi khi tạo job inpainting:", err);
      throw err instanceof Error ? err : new Error("Lỗi không xác định khi tạo job inpainting");
    }
  }

  /**
   * Kiểm tra trạng thái job cho đến khi hoàn thành hoặc thất bại
   * @param jobId ID của job cần kiểm tra
   * @param timeout Thời gian tối đa chờ (ms), mặc định 300000ms (5 phút)
   * @returns Promise<string> URL kết quả của job
   * @throws Lỗi nếu job thất bại, bị hủy, hoặc hết thời gian chờ
   */
  async function pollJobStatus(jobId: string, timeout: number = 300000): Promise<string> {
    // Kiểm tra đầu vào
    if (!jobId || typeof jobId !== "string") {
      throw new Error("ID job không hợp lệ");
    }
    if (timeout <= 0) {
      throw new Error("Thời gian chờ phải lớn hơn 0");
    }
    if (!process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY) {
      throw new Error("Thiếu khóa API TensorArt trong biến môi trường");
    }

    const startTime = Date.now();
    const url = `${TENSOR_ART_API_URL}/jobs/${jobId}`;
    const pollingInterval = 5000; // 5 giây

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Kiểm tra trạng thái thất bại: ${response.status} - ${errorText || response.statusText}`);
        }

        const data: JobStatusResponse = await response.json();
        if (!data?.job) {
          throw new Error("Phản hồi trạng thái job không hợp lệ");
        }

        const job = data.job;
        switch (job.status) {
          case "SUCCESS":
            const resultUrl = job.resultUrl || job.successInfo?.images?.[0]?.url || job.output?.[0]?.url;
            if (!resultUrl) {
              throw new Error("Không tìm thấy URL kết quả trong phản hồi SUCCESS");
            }
            return resultUrl;

          case "FAILED":
            throw new Error(`Job thất bại: ${job.failureInfo?.reason || "Không có lý do cụ thể"}`);

          case "CANCELLED":
            throw new Error("Job đã bị hủy");

          default:
            // Tiếp tục chờ nếu trạng thái là "RUNNING" hoặc các trạng thái khác
            await new Promise((resolve) => setTimeout(resolve, pollingInterval));
            break;
        }
      } catch (err) {
        console.error(`Lỗi khi kiểm tra trạng thái job ${jobId}:`, err);
        throw err instanceof Error ? err : new Error("Lỗi không xác định khi kiểm tra trạng thái job");
      }
    }

    throw new Error(`Hết thời gian chờ sau ${timeout / 1000} giây`);
  }

  /**
   * Xử lý toàn bộ quy trình inpainting từ tải ảnh lên đến lấy kết quả
   * @param uploadedImageData Dữ liệu ảnh gốc (base64)
   * @param productImageData Dữ liệu ảnh sản phẩm (base64 hoặc URL)
   * @param maskImageData Dữ liệu ảnh mask (base64)
   * @returns Promise<string> URL của ảnh kết quả inpainting
   * @throws Lỗi nếu bất kỳ bước nào trong quy trình thất bại
   */
  async function processInpainting(
    uploadedImageData: string,
    productImageData: string,
    maskImageData: string
  ): Promise<string> {
    // Kiểm tra đầu vào
    if (!uploadedImageData || !productImageData || !maskImageData) {
      throw new Error("Thiếu một hoặc nhiều dữ liệu ảnh cần thiết");
    }
    if (!process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY) {
      throw new Error("Thiếu khóa API TensorArt trong biến môi trường");
    }

    // Cập nhật trạng thái
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      // Tải đồng thời các ảnh lên TensorArt
      const [uploadedImageId, productImageId, maskImageId] = await Promise.all([
        uploadImageToTensorArt(uploadedImageData),
        uploadImageToTensorArt(productImageData),
        uploadImageToTensorArt(maskImageData),
      ]);

      // Tạo job inpainting
      const jobId = await createInpaintingJob(uploadedImageId, productImageId, maskImageId);

      // Chờ và lấy kết quả
      const result = await pollJobStatus(jobId);

      // Cập nhật trạng thái với kết quả
      setResultUrl(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi không xác định trong quá trình inpainting";
      console.error("Lỗi trong quy trình inpainting:", err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    resultUrl,
    processInpainting,
  };
}

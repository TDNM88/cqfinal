import { useCallback } from "react";

/**
 * Hook để xử lý inpainting qua API Tensor Art
 * @returns {object} - Đối tượng chứa hàm processInpainting
 */
export const useInpainting = () => {
  /**
   * Hàm gửi yêu cầu inpainting tới API và trả về ảnh kết quả dưới dạng base64
   * @param imageBase64 - Dữ liệu ảnh gốc (base64)
   * @param productImageBase64 - Dữ liệu ảnh sản phẩm (base64)
   * @param maskBase64 - Dữ liệu mask (base64)
   * @returns Promise<string> - Chuỗi base64 của ảnh kết quả
   */
  const processInpainting = useCallback(
    async (
      imageBase64: string,
      productImageBase64: string,
      maskBase64: string
    ): Promise<string> => {
      // Kiểm tra dữ liệu đầu vào
      if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
        throw new Error("Dữ liệu ảnh gốc không hợp lệ, yêu cầu định dạng base64");
      }
      if (!productImageBase64 || !productImageBase64.startsWith("data:image/")) {
        throw new Error("Dữ liệu ảnh sản phẩm không hợp lệ, yêu cầu định dạng base64");
      }
      if (!maskBase64 || !maskBase64.startsWith("data:image/")) {
        throw new Error("Dữ liệu mask không hợp lệ, yêu cầu định dạng base64");
      }

      try {
        // Chuẩn bị FormData để gửi yêu cầu
        const formData = new FormData();
        formData.append("image", imageBase64);
        formData.append("mask", maskBase64);
        formData.append("product_image", productImageBase64);

        console.log("Sending request to API...");
        // Gửi yêu cầu POST tới API Tensor Art
        const response = await fetch("https://cqf-api-2.onrender.com/api/inpaint", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed! Status: ${response.status}, Message: ${errorText}`);
        }

        const data = await response.json();
        const imageUrl = data.imageUrl;
        console.log("Received imageUrl from API:", imageUrl);

        if (!imageUrl || typeof imageUrl !== "string") {
          throw new Error("API did not return a valid imageUrl");
        }

        // Tải ảnh từ imageUrl và chuyển thành base64 để tránh lỗi CORS
        console.log("Fetching image from URL:", imageUrl);
        const imageResponse = await fetch(imageUrl, {
          method: "GET",
          headers: {
            "Accept": "image/*",
          },
        });

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          throw new Error(`Failed to fetch image from URL: ${imageUrl}, Status: ${imageResponse.status}, Message: ${errorText}`);
        }

        const imageBlob = await imageResponse.blob();
        console.log("Image blob size:", imageBlob.size);

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            if (result && result.startsWith("data:image/")) {
              console.log("Converted to base64, length:", result.length);
              resolve(result);
            } else {
              reject(new Error("Invalid base64 data from image"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to convert image to base64"));
          reader.readAsDataURL(imageBlob);
        });

        return base64; // Trả về base64 của ảnh
      } catch (error) {
        console.error("Error in processInpainting:", error);
        throw error instanceof Error ? error : new Error("Unknown error occurred during inpainting");
      }
    },
    []
  );

  return { processInpainting };
};

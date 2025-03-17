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
      try {
        // Chuẩn bị FormData để gửi yêu cầu
        const formData = new FormData();
        formData.append("image", imageBase64);
        formData.append("mask", maskBase64);
        formData.append("product_image", productImageBase64);

        // Gửi yêu cầu POST tới API Tensor Art
        const response = await fetch("https://cqf-api-2.onrender.com/api/inpaint", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        }

        const data = await response.json();
        const imageUrl = data.imageUrl;
        console.log("URL ảnh từ API:", imageUrl);

        // Tải ảnh từ URL và chuyển thành base64 để tránh lỗi CORS
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error("Không thể tải ảnh từ URL");
        }
        const imageBlob = await imageResponse.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageBlob);
        });

        return base64; // Trả về base64 của ảnh
      } catch (error) {
        console.error("Lỗi trong processInpainting:", error);
        throw error;
      }
    },
    []
  );

  return { processInpainting };
};

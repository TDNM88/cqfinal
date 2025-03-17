/**
 * Hook để xử lý inpainting ảnh qua API
 * @returns {object} - Đối tượng chứa hàm processInpainting
 */
export const useInpainting = () => {
  /**
   * Hàm gửi yêu cầu inpainting tới API và trả về ảnh kết quả dưới dạng base64
   * @param imageData - Dữ liệu ảnh gốc (base64)
   * @param productImage - Dữ liệu ảnh sản phẩm (base64)
   * @param maskData - Dữ liệu mask (base64)
   * @returns Promise<string> - Chuỗi base64 của ảnh kết quả
   */
  const processInpainting = async (
    imageData: string,
    productImage: string,
    maskData: string
  ): Promise<string> => {
    // Kiểm tra dữ liệu đầu vào
    if (!imageData || !imageData.startsWith("data:image/")) {
      throw new Error("Dữ liệu ảnh gốc không hợp lệ, yêu cầu định dạng base64");
    }
    if (!productImage || !productImage.startsWith("data:image/")) {
      throw new Error("Dữ liệu ảnh sản phẩm không hợp lệ, yêu cầu định dạng base64");
    }
    if (!maskData || !maskData.startsWith("data:image/")) {
      throw new Error("Dữ liệu mask không hợp lệ, yêu cầu định dạng base64");
    }

    const formData = new FormData();
    formData.append("image", imageData);
    formData.append("product_image", productImage);
    formData.append("mask", maskData);

    try {
      // Gửi yêu cầu tới API
      const apiResponse = await fetch("https://cqf-api-2.onrender.com/api/inpaint", {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`HTTP error! Status: ${apiResponse.status}, Message: ${errorText}`);
      }

      const data = await apiResponse.json();
      const imageUrl = data.imageUrl; // URL ảnh từ API

      if (!imageUrl) {
        throw new Error("API không trả về imageUrl hợp lệ");
      }

      // Tải ảnh từ imageUrl để tránh lỗi CORS
      const imageResponse = await fetch(imageUrl, {
        method: "GET",
      });

      if (!imageResponse.ok) {
        throw new Error(`Không thể tải ảnh từ URL: ${imageUrl}, Status: ${imageResponse.status}`);
      }

      // Chuyển đổi ảnh thành base64
      const imageBlob = await imageResponse.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result && result.startsWith("data:image/")) {
            resolve(result);
          } else {
            reject(new Error("Dữ liệu ảnh tải về không phải định dạng base64 hợp lệ"));
          }
        };
        reader.onerror = () => reject(new Error("Không thể chuyển đổi ảnh thành base64"));
        reader.readAsDataURL(imageBlob);
      });

      return base64; // Trả về chuỗi base64 của ảnh kết quả
    } catch (error) {
      console.error("Lỗi trong quá trình inpainting:", error);
      throw error instanceof Error ? error : new Error("Đã xảy ra lỗi không xác định trong quá trình inpainting");
    }
  };

  return { processInpainting };
};

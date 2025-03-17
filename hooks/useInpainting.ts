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
      console.log("Bắt đầu gửi yêu cầu tới API inpainting...");
      // Gửi yêu cầu tới API
      const apiResponse = await fetch("https://cqf-api-2.onrender.com/api/inpaint", {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Gửi yêu cầu API thất bại! Status: ${apiResponse.status}, Message: ${errorText}`);
      }

      const data = await apiResponse.json();
      const imageUrl = data.imageUrl;
      console.log("API trả về imageUrl:", imageUrl);

      if (!imageUrl || typeof imageUrl !== "string") {
        throw new Error("API không trả về imageUrl hợp lệ");
      }

      // Tải ảnh từ imageUrl
      console.log("Bắt đầu tải ảnh từ imageUrl:", imageUrl);
      const imageResponse = await fetch(imageUrl, {
        method: "GET",
        headers: {
          "Accept": "image/*", // Đảm bảo yêu cầu trả về dữ liệu ảnh
        },
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        throw new Error(`Tải ảnh từ imageUrl thất bại: ${imageUrl}, Status: ${imageResponse.status}, Message: ${errorText}`);
      }

      // Chuyển đổi ảnh thành base64
      const imageBlob = await imageResponse.blob();
      console.log("Đã tải ảnh thành công, kích thước Blob:", imageBlob.size);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result && result.startsWith("data:image/")) {
            console.log("Chuyển đổi thành base64 thành công, độ dài:", result.length);
            resolve(result);
          } else {
            reject(new Error("Dữ liệu ảnh tải về không phải định dạng base64 hợp lệ"));
          }
        };
        reader.onerror = () => reject(new Error("Không thể chuyển đổi ảnh thành base64"));
        reader.readAsDataURL(imageBlob);
      });

      return base64;
    } catch (error) {
      console.error("Lỗi trong quá trình inpainting:", error);
      throw error instanceof Error ? error : new Error("Đã xảy ra lỗi không xác định trong quá trình inpainting");
    }
  };

  return { processInpainting };
};

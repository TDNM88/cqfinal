import { useCallback } from "react";

/**
 * Hook để xử lý inpainting qua API Tensor Art
 * @returns {object} - Đối tượng chứa hàm processInpainting
 */
export const useInpainting = () => {
  const processInpainting = useCallback(
    async (
      imageBase64: string,
      productImageBase64: string,
      maskBase64: string
    ): Promise<string> => {
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
        const formData = new FormData();
        formData.append("image", imageBase64);
        formData.append("mask", maskBase64);
        formData.append("product_image", productImageBase64);

        console.log("Sending request to Tensor Art API...");
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

        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
        console.log("Fetching image via proxy:", proxyUrl);
        const imageResponse = await fetch(proxyUrl, {
          method: "GET",
          headers: {
            "Accept": "image/*",
          },
        });

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          throw new Error(`Failed to fetch image via proxy: ${proxyUrl}, Status: ${imageResponse.status}, Message: ${errorText}`);
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

        return base64;
      } catch (error) {
        console.error("Error in processInpainting:", error);
        throw error instanceof Error ? error : new Error("Unknown error occurred during inpainting");
      }
    },
    []
  );

  return { processInpainting };
};

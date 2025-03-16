"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Download,
  Eraser,
  Paintbrush,
  Loader2,
  Info,
  Send,
  RefreshCw,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInpainting } from "../hooks/useInpainting";

// Product data
const products = {
  "C1012 Glacier White": "/product_images/C1012.jpg",
  "C1026 Polar": "/product_images/C1026.jpg",
  "C3269 Ash Grey": "/product_images/C3269.jpg",
  "C3168 Silver Wave": "/product_images/C3168.jpg",
  "C1005 Milky White": "/product_images/C1005.jpg",
  "C2103 Onyx Carrara": "/product_images/C2103.jpg",
  "C2104 Massa": "/product_images/C2104.jpg",
  "C3105 Casla Cloudy": "/product_images/C3105.jpg",
  "C3146 Casla Nova": "/product_images/C3146.jpg",
  "C2240 Marquin": "/product_images/C2240.jpg",
  "C2262 Concrete (Honed)": "/product_images/C2262.jpg",
  "C3311 Calacatta Sky": "/product_images/C3311.jpg",
  "C3346 Massimo": "/product_images/C3346.jpg",
  "C4143 Mario": "/product_images/C4143.jpg",
  "C4145 Marina": "/product_images/C4145.jpg",
  "C4202 Calacatta Gold": "/product_images/C4202.jpg",
  "C1205 Casla Everest": "/product_images/C1205.jpg",
  "C4211 Calacatta Supreme": "/product_images/C4211.jpg",
  "C4204 Calacatta Classic": "/product_images/C4204.jpg",
  "C1102 Super White": "/product_images/C1102.jpg",
  "C4246 Casla Mystery": "/product_images/C4246.jpg",
  "C4345 Oro": "/product_images/C4345.jpg",
  "C4346 Luxe": "/product_images/C4346.jpg",
  "C4342 Casla Eternal": "/product_images/C4342.jpg",
  "C4221 Athena": "/product_images/C4221.jpg",
  "C4255 Calacatta Extra": "/product_images/C4255.jpg",
};

const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1";
const WORKFLOW_TEMPLATE_ID = "837405094118019506";

export default function ImageInpaintingApp() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskOpacity] = useState(0.5); // Fixed opacity
  const [isProcessing, setIsProcessing] = useState(false);
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [imageData, setImageData] = useState("");
  const [maskData, setMaskData] = useState("");
  const { loading, resultUrl, processInpainting } = useInpainting();

  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvases when component mounts
  useEffect(() => {
    const initCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    initCanvas(inputCanvasRef.current);
    initCanvas(outputCanvasRef.current);

    // Create an offscreen canvas for the mask
    const maskCanvas = document.createElement("canvas");
    maskCanvasRef.current = maskCanvas;
  }, []);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setInpaintedImage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target?.result as string);
      const img = new window.Image();
      img.onload = () => {
        setImage(img);
        drawImageOnCanvas(img);
      };
      img.src = event.target?.result as string;
      img.crossOrigin = "anonymous";
    };
    reader.readAsDataURL(file);
  };

  // Handle product selection
  const handleProductSelect = async (productName: string) => {
    setSelectedProduct(productName); // Cập nhật sản phẩm đã chọn
    
    if (image) {
      try {
        // Tạo ảnh kết hợp (ảnh upload + mask trong suốt)
        const combinedImageData = await getCombinedImage();

        // Tải ảnh kết hợp và vẽ lên inputCanvas
        const combinedImg = new window.Image();
        combinedImg.onload = () => {
          const inputCanvas = inputCanvasRef.current;
          if (!inputCanvas) return;

          const inputCtx = inputCanvas.getContext("2d");
          if (!inputCtx) return;

          // Xóa canvas cũ
          inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);

          // Vẽ ảnh kết hợp lên canvas
          inputCtx.drawImage(combinedImg, 0, 0, inputCanvas.width, inputCanvas.height);
        };
        combinedImg.src = combinedImageData;
        combinedImg.crossOrigin = "anonymous";
      } catch (err) {
        console.error("Lỗi khi tạo ảnh kết hợp:", err);
      }
    }
  };

  // Save current canvas state
  const saveCanvasState = () => {
    if (!inputCanvasRef.current) return;

    const dataURL = inputCanvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "canvas-state.png";
    link.href = dataURL;
    link.click();
  };

  // Draw uploaded image on input canvas and prepare mask canvas
  const drawImageOnCanvas = (img: HTMLImageElement) => {
    const inputCanvas = inputCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!inputCanvas || !outputCanvas || !maskCanvas) return;

    // Resize canvases to match image aspect ratio
    const aspectRatio = img.width / img.height;
    const maxWidth = inputCanvas.parentElement?.clientWidth || 500;
    const maxHeight = inputCanvas.parentElement?.clientHeight || 500;

    let canvasWidth, canvasHeight;

    if (aspectRatio > 1) {
      canvasWidth = Math.min(maxWidth, img.width);
      canvasHeight = canvasWidth / aspectRatio;
    } else {
      canvasHeight = Math.min(maxHeight, img.height);
      canvasWidth = canvasHeight * aspectRatio;
    }

    // Set canvas dimensions
    inputCanvas.width = canvasWidth;
    inputCanvas.height = canvasHeight;
    outputCanvas.width = canvasWidth;
    outputCanvas.height = canvasHeight;
    maskCanvas.width = canvasWidth;
    maskCanvas.height = canvasHeight;

    // Draw image on input canvas
    const inputCtx = inputCanvas.getContext("2d");
    if (inputCtx) {
      inputCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    }

    // Clear the mask canvas
    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw information on output canvas
    drawInformationOnOutputCanvas();
  };

  // Draw information on the output canvas
  const drawInformationOnOutputCanvas = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw information text
    ctx.fillStyle = "#1f2937";
    ctx.font = '16px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(
      "Vẽ mặt nạ trên canvas bên trái",
      canvas.width / 2,
      canvas.height / 2 - 40
    );
    ctx.fillText(
      "để chỉ định vùng cần xử lý.",
      canvas.width / 2,
      canvas.height / 2 - 15
    );
    ctx.fillText(
      'Sau đó nhấn "Xử lý ảnh" để',
      canvas.width / 2,
      canvas.height / 2 + 15
    );
    ctx.fillText("tạo kết quả.", canvas.width / 2, canvas.height / 2 + 40);
  };

  // Handle drawing on the canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    updateMaskPreview();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = inputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Draw on the visible canvas (for preview)
    ctx.save();
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser
      ? "rgba(0,0,0,1)"
      : `rgba(255,0,0,${maskOpacity})`;
    ctx.fill();
    ctx.restore();

    // Draw on the mask canvas (for processing)
    maskCtx.save();
    maskCtx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fillStyle = isEraser ? "rgba(0,0,0,0)" : "rgba(255,255,255,1)"; // White for mask
    maskCtx.fill();
    maskCtx.restore();

    updateMaskPreview();
    handleMaskUpdate();
  };

  // Update the input canvas to show the image with mask overlay
  const updateMaskPreview = () => {
    const inputCanvas = inputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!inputCanvas || !maskCanvas || !image) return;

    const inputCtx = inputCanvas.getContext("2d");
    if (!inputCtx) return;

    // Redraw original image
    inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    inputCtx.drawImage(image, 0, 0, inputCanvas.width, inputCanvas.height);

    // Overlay mask with red color for preview
    inputCtx.save();
    inputCtx.globalAlpha = maskOpacity;
    inputCtx.globalCompositeOperation = "source-over";
    inputCtx.fillStyle = "rgba(255,0,0,1)";

    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = maskCanvas.width;
    tempCanvas.height = maskCanvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.putImageData(maskData, 0, 0);
    inputCtx.drawImage(tempCanvas, 0, 0);

    inputCtx.restore();
  };

  // Draw result on output canvas
  const drawResultOnCanvas = (img: HTMLImageElement) => {
    const outputCanvas = outputCanvasRef.current;
    if (!outputCanvas) return;

    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    // Calculate new size based on aspect ratio
    const aspectRatio = img.width / img.height;
    const maxWidth = outputCanvas.parentElement?.clientWidth || 500;
    const maxHeight = outputCanvas.parentElement?.clientHeight || 500;

    let canvasWidth, canvasHeight;

    if (aspectRatio > 1) {
      canvasWidth = Math.min(maxWidth, img.width);
      canvasHeight = canvasWidth / aspectRatio;
    } else {
      canvasHeight = Math.min(maxHeight, img.height);
      canvasWidth = canvasHeight * aspectRatio;
    }

    // Update canvas size
    outputCanvas.width = canvasWidth;
    outputCanvas.height = canvasHeight;

    // Draw result image
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setError(null);

      // Tạo ảnh kết hợp từ ảnh upload và mask
      const combinedImage = await getCombinedImage();

      // Kiểm tra xem đã chọn sản phẩm chưa
      if (!selectedProduct) {
        throw new Error("Vui lòng chọn một sản phẩm trước khi xử lý");
      }

      // Lấy ảnh sản phẩm (chỉ dùng để gửi API)
      const productImage = products[selectedProduct as keyof typeof products];

      console.log("Ảnh kết hợp (node 735):", combinedImage);
      console.log("Ảnh sản phẩm (node 731):", productImage);

      // Upload ảnh
      const [productImageId, combinedImageId] = await Promise.all([
        uploadImageToTensorArt(productImage), // Gửi ảnh sản phẩm cho node 731
        uploadImageToTensorArt(combinedImage), // Gửi ảnh kết hợp cho node 735
      ]);

      // Gửi đến workflow và lấy kết quả thứ 2
      const resultUrl = await processInpainting(productImageId, combinedImageId);

      // Cập nhật và hiển thị kết quả
      setInpaintedImage(resultUrl);
      const img = new Image();
      img.onload = () => drawResultOnCanvas(img);
      img.src = resultUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset the mask
  const resetMask = () => {
    if (!image) return;

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    // Clear the mask
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Redraw the original image on the input canvas
    const inputCanvas = inputCanvasRef.current;
    if (!inputCanvas) return;

    const inputCtx = inputCanvas.getContext("2d");
    if (!inputCtx) return;

    inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    inputCtx.drawImage(image, 0, 0, inputCanvas.width, inputCanvas.height);
  };

  // Download the output image
  const downloadImage = () => {
    if (!inpaintedImage) return;

    const link = document.createElement("a");
    link.download = "ket-qua-xu-ly.png";
    link.href = inpaintedImage;
    link.click();
  };

  const uploadImageToTensorArt = async (imageData: string) => {
    const response = await fetch(`${TENSOR_ART_API_URL}/resource/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
      },
      body: JSON.stringify({ expireSec: 7200 }),
    });

    const data = await response.json();
    const imageBlob = await fetch(imageData).then((res) => res.blob());

    await fetch(data.putUrl, {
      method: "PUT",
      headers: data.headers,
      body: imageBlob,
    });

    return data.resourceId;
  };

  const createInpaintingJob = async (imageId: string, maskId: string) => {
    const response = await fetch(`${TENSOR_ART_API_URL}/jobs/workflow/template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
      },
      body: JSON.stringify({
        request_id: Date.now().toString(),
        templateId: WORKFLOW_TEMPLATE_ID,
        fields: {
          fieldAttrs: [
            { nodeId: "731", fieldName: "image", fieldValue: imageId },
            { nodeId: "735", fieldName: "image", fieldValue: maskId },
          ],
        },
      }),
    });

    return response.json();
  };

  async function pollJobStatus(jobId: string) {
    const maxAttempts = 30;
    const delay = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${TENSOR_ART_API_URL}/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { job } = await response.json();

        if (job.status === "SUCCESS") {
          if (job.successInfo?.images && job.successInfo.images.length >= 2) {
            console.log("All result URLs:", job.successInfo.images.map((img) => img.url));
            return job.successInfo.images[1].url; // Lấy kết quả thứ 2
          } else {
            throw new Error("Kết quả không chứa đủ 2 URL hợp lệ");
          }
        }

        if (job.status === "FAILED") {
          throw new Error(job.failedInfo?.reason || "Job xử lý thất bại");
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Lỗi khi kiểm tra trạng thái job (lần thử ${attempt + 1}):`, error);
        throw new Error(
          `Không thể lấy kết quả: ${error instanceof Error ? error.message : "Lỗi không xác định"}`
        );
      }
    }

    throw new Error("Quá thời gian chờ xử lý job");
  }

  const handleMaskUpdate = () => {
    if (maskCanvasRef.current) {
      setMaskData(maskCanvasRef.current.toDataURL());
    }
  };

  const getCombinedImage = async (): Promise<string> => {
    const inputCanvas = inputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!inputCanvas || !maskCanvas || !image) {
      throw new Error("Không tìm thấy canvas hoặc ảnh");
    }

    // Tạo canvas tạm thời với cùng kích thước
    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = inputCanvas.width;
    combinedCanvas.height = inputCanvas.height;
    const ctx = combinedCanvas.getContext("2d");

    if (!ctx) {
      throw new Error("Không thể tạo context cho canvas");
    }

    // Vẽ ảnh gốc lên canvas
    ctx.drawImage(image, 0, 0, inputCanvas.width, inputCanvas.height);

    // Lấy dữ liệu ảnh từ maskCanvas
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) {
      throw new Error("Không thể lấy context của mask");
    }
    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const maskData = maskImageData.data;

    // Lấy dữ liệu ảnh gốc từ combinedCanvas
    const inputImageData = ctx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
    const inputData = inputImageData.data;

    // Kiểm tra và áp dụng mask vào kênh alpha
    for (let i = 0; i < maskData.length; i += 4) {
      const maskValue = maskData[i]; // Giá trị grayscale từ mask (0-255)
      if (maskValue > 0) {
        // Vùng trắng (mask): làm trong suốt hoàn toàn
        inputData[i + 3] = 0; // Alpha = 0
      } else {
        // Vùng đen (không mask): giữ nguyên
        inputData[i + 3] = 255; // Alpha = 255
      }
    }

    // Đưa dữ liệu đã chỉnh sửa trở lại canvas
    ctx.putImageData(inputImageData, 0, 0);

    // Xuất ảnh và log để kiểm tra
    const result = combinedCanvas.toDataURL("image/png");
    console.log("Kiểm tra ảnh kết hợp:", result); // Mở URL này trong trình duyệt
    return result;
  };

  return (
    <div
      className="container mx-auto py-8 px-4 font-sans"
      style={{
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <h1 className="text-3xl font-light text-center mb-8 text-blue-800">
        CaslaQuartz AI
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input Canvas Section */}
        <div className="flex flex-col space-y-4">
          <Card className="p-4 h-full flex flex-col shadow-md">
            <h2 className="text-xl font-light mb-4 text-blue-800">
              Tải Ảnh & Chọn vật thể
            </h2>
            <div className="relative bg-muted rounded-md overflow-hidden flex items-center justify-center flex-grow">
              <canvas
                ref={inputCanvasRef}
                className="max-w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              {!image && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Upload className="h-12 w-12 text-blue-800/50 mb-2" />
                  <p className="text-blue-800/70">Tải ảnh lên để bắt đầu</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-blue-800 hover:bg-blue-900"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh lên
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={saveCanvasState}
                  className="flex items-center gap-2 w-full bg-blue-800 hover:bg-blue-900"
                  size="sm"
                  disabled={!image}
                >
                  <Save className="h-4 w-4" />
                  Lưu ảnh
                </Button>

                <Button
                  onClick={resetMask}
                  variant="outline"
                  disabled={!image}
                  className="flex items-center gap-2 w-full text-blue-800 border-blue-800"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Xóa mặt nạ
                </Button>
              </div>

              <Tabs defaultValue="brush" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2 bg-blue-50">
                  <TabsTrigger
                    value="brush"
                    onClick={() => setIsEraser(false)}
                    className="data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                  >
                    <Paintbrush className="h-4 w-4 mr-1" />
                    Bút vẽ
                  </TabsTrigger>
                  <TabsTrigger
                    value="eraser"
                    onClick={() => setIsEraser(true)}
                    className="data-[state=active]:bg-blue-800 data-[state=active]:text-white"
                  >
                    <Eraser className="h-4 w-4 mr-1" />
                    Tẩy
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="brush" className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs font-medium">Kích thước: {brushSize}px</label>
                    <Slider
                      value={[brushSize]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(value) => setBrushSize(value[0])}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="eraser" className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs font-medium">Kích thước: {brushSize}px</label>
                    <Slider
                      value={[brushSize]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(value) => setBrushSize(value[0])}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleSubmit}
                disabled={!image || isProcessing}
                className="flex items-center gap-2 mt-2 bg-blue-800 hover:bg-blue-900"
                size="sm"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isProcessing ? "Đang xử lý..." : "Xử lý ảnh"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Product Selection Section */}
        <div className="flex flex-col space-y-4">
          <Card className="p-4 h-full flex flex-col shadow-md">
            <h2 className="text-xl font-light mb-4 text-blue-800">Chọn Sản Phẩm</h2>
            <div className="text-sm text-blue-800/70 mb-2">Chọn một sản phẩm để tải ảnh:</div>

            <ScrollArea className="flex-grow border rounded-md p-2 border-blue-100">
              <div className="grid grid-cols-2 gap-1">
                {Object.keys(products).map((productName) => (
                  <Button
                    key={productName}
                    variant={selectedProduct === productName ? "default" : "outline"}
                    className={`justify-start text-left h-auto py-2 px-3 text-xs font-normal ${
                      selectedProduct === productName
                        ? "bg-blue-800 hover:bg-blue-900 text-white"
                        : "text-blue-800 border-blue-200 hover:bg-blue-50"
                    }`}
                    onClick={() => handleProductSelect(productName)}
                  >
                    {productName}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {selectedProduct && (
              <div className="mt-4 p-2 bg-blue-50 rounded-md text-xs text-blue-800">
                <p className="font-medium">Đã chọn: {selectedProduct}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Output Canvas Section */}
        <div className="flex flex-col space-y-4">
          <Card className="p-4 h-full flex flex-col shadow-md">
            <h2 className="text-xl font-light mb-4 text-blue-800">Kết Quả Xử Lý</h2>
            <div className="relative bg-muted rounded-md overflow-hidden flex items-center justify-center flex-grow">
              <canvas ref={outputCanvasRef} className="max-w-full" />
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                  <Loader2 className="h-12 w-12 text-blue-800 animate-spin mb-4" />
                  <p className="text-blue-800/70">Đang xử lý ảnh...</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                onClick={downloadImage}
                disabled={!inpaintedImage}
                className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Tải kết quả
              </Button>

              {error && (
                <Alert variant="destructive" className="mt-2 p-2">
                  <AlertTitle className="text-sm">Lỗi</AlertTitle>
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="mt-2">
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-blue-800/70" />
                  <h3 className="text-xs font-medium text-blue-800">Hướng dẫn sử dụng</h3>
                </div>
                <div className="bg-blue-50 p-2 rounded-md text-xs mt-1 text-blue-800">
                  <p>1. Chọn sản phẩm hoặc tải ảnh lên</p>
                  <p>2. Vẽ mặt nạ lên vùng cần xử lý</p>
                  <p>3. Nhấn "Xử lý ảnh" để tạo kết quả</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

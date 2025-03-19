"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Download, Paintbrush, Loader2, Info, Send, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useInpainting } from "@/hooks/useInpainting";

type Path = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

// Danh sách sản phẩm và câu quote
const productGroups = {
  "NHÓM TIÊU CHUẨN (STANDARD)": [
    { name: "C1012 - Glacier White", quote: "Glacier với nền trắng kết hợp với những hạt thạch anh kích thước nhỏ, tạo chiều sâu cho bề mặt, bền đẹp, phù hợp với các công trình thương mại." },
    { name: "C1026 - Polar", quote: "Polar với nền trắng và hạt thạch anh lớn, kết hợp ánh sáng tạo chiều sâu, độ cứng cao, phù hợp cho công trình thương mại." },
    { name: "C1005 - Milky White", quote: "Milky White với màu trắng tinh khiết, nhẹ nhàng, phù hợp với phong cách tối giản." },
    { name: "C3168 - Silver Wave", quote: "Silver Wave với nền trắng và ánh bạc như sóng biển dưới nắng nhiệt đới, đầy cuốn hút." },
    { name: "C3269 - Ash Grey", quote: "Ash Grey với tông xám trầm như làn khói, tạo sự trang nhã và cuốn hút." },
  ],
  "NHÓM TRUNG CẤP (DELUXE)": [
    { name: "C2103 - Onyx Carrara", quote: "Onyx Carrara lấy cảm hứng từ đá cẩm thạch Ý, với vân tinh tế trên nền trắng, tạo không gian ấm cúng." },
    { name: "C2104 - Massa", quote: "Massa với vân nhẹ nhàng trên nền đá trắng Carrara, mang đến không gian sang trọng." },
    { name: "C3105 - Casla Cloudy", quote: "Casla Cloudy với tông xanh như bầu trời mây, tạo không gian khoáng đạt." },
    { name: "C3146 - Casla Nova", quote: "Casla Nova với tông nâu vàng trên nền trắng, vừa sang trọng vừa ấm cúng." },
    { name: "C2240 - Marquin", quote: "Marquin với nền đen và bond trắng, tạo sự trừu tượng đầy cuốn hút." },
  ],
  "NHÓM CAO CẤP (LUXURY)": [
    { name: "C1102 - Super White", quote: "Super White với màu trắng sáng từ vật liệu cao cấp, đơn giản nhưng sang trọng." },
    { name: "C1205 - Casla Everest", quote: "Casla Everest lấy cảm hứng từ núi Everest, với vân như đỉnh núi trên nền trắng sang trọng." },
    { name: "C4246 - Casla Mystery", quote: "Casla Mystery với vân mỏng manh, mang lại không gian ấm cúng, bình yên." },
    { name: "C4254 - Mystery Gold", quote: "Mystery Gold với vân mảnh hòa quyện giữa lạnh và ấm, tạo không gian yên bình." },
    { name: "C4326 - Statuario", quote: "Statuario Silver tái hiện dòng sông trên nền tuyết trắng, tinh tế và sang trọng." },
  ],
  "NHÓM SIÊU CAO CẤP (SUPER LUXURY)": [
    { name: "C4147 - Mont", quote: "Mont với vân dày mềm mại, kết hợp vàng và xám, mang vẻ đẹp vượt thời gian." },
    { name: "C4149 - River", quote: "River với dải xám trên nền trắng, tạo chiều sâu và vẻ đẹp tự nhiên." },
    { name: "C4255 - Calacatta Extra", quote: "Calacatta Extra với vân xám tối uyển chuyển trên nền trắng, sang trọng." },
    { name: "C5366 - Skiron", quote: "Skiron tái hiện sóng biển với vân xanh trên nền đá, hiện đại và tinh tế." },
  ],
};

const products = Object.fromEntries(
  Object.values(productGroups).flat().map((item) => [
    item.name,
    `/product_images/${item.name.split(" - ")[0]}.jpg`,
  ])
);

export const dynamic = "force-dynamic";

export default function ImageInpaintingApp() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [resizedImageData, setResizedImageData] = useState<string>("");
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState<"black" | "white">("black");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [maskOpacity] = useState(0.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [activeCanvas, setActiveCanvas] = useState<"canvas1" | "canvas2" | null>(null);

  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { processInpainting } = useInpainting();

  useEffect(() => {
    const initCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#F3F4F6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    initCanvas(inputCanvasRef.current);
    initCanvas(outputCanvasRef.current);
    maskCanvasRef.current = document.createElement("canvas");
    return () => maskCanvasRef.current?.remove();
  }, []);

  const resizeImage = (img: HTMLImageElement, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const aspectRatio = img.width / img.height;
      const canvasWidth = Math.min(img.width, maxWidth);
      const canvasHeight = canvasWidth / aspectRatio;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;
      const ctx = tempCanvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      const result = tempCanvas.toDataURL("image/png");
      tempCanvas.remove();
      resolve(result);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetCanvas();
    setActiveCanvas("canvas1");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const maxWidth = inputCanvasRef.current?.parentElement?.clientWidth || 500;
        const resizedData = await resizeImage(img, maxWidth);
        setResizedImageData(resizedData);
        setImage(img);
        drawImageOnCanvas(img, resizedData);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetCanvas = () => {
    setImage(null);
    setResizedImageData("");
    setPaths([]);
    setInpaintedImage(null);
    setError(null);
    setSelectedProduct(null);
    setOpenGroup(null);
    setActiveCanvas(null);
    [inputCanvasRef, outputCanvasRef].forEach((ref) => {
      const ctx = ref.current?.getContext("2d");
      if (ctx && ref.current) {
        ctx.fillStyle = "#F3F4F6";
        ctx.fillRect(0, 0, ref.current.width, ref.current.height);
      }
    });
  };

  const drawImageOnCanvas = (img: HTMLImageElement, resizedData: string) => {
    const inputCanvas = inputCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!inputCanvas || !outputCanvas || !maskCanvas) return;

    const maxWidth = inputCanvas.parentElement?.clientWidth || 500;
    const aspectRatio = img.width / img.height;
    const canvasWidth = Math.min(img.width, maxWidth);
    const canvasHeight = canvasWidth / aspectRatio;

    [inputCanvas, outputCanvas, maskCanvas].forEach((canvas) => {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    });

    const inputCtx = inputCanvas.getContext("2d");
    if (inputCtx) {
      const resizedImg = new Image();
      resizedImg.onload = () => inputCtx.drawImage(resizedImg, 0, 0, canvasWidth, canvasHeight);
      resizedImg.src = resizedData;
    }

    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!inputCanvasRef.current) return;
    const rect = inputCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 0) {
      setIsDrawing(true);
      setIsErasing(false);
      setPaths((prev) => [...prev, { points: [{ x, y }], color: brushColor, width: brushSize }]);
    } else if (e.button === 2) {
      setIsErasing(true);
      setIsDrawing(false);
      setPaths((prev) => [...prev, { points: [{ x, y }], color: "transparent", width: brushSize }]);
    }
    setActiveCanvas("canvas1");
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!inputCanvasRef.current || (!isDrawing && !isErasing)) return;
    const rect = inputCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPaths((prev) => {
      const newPaths = [...prev];
      newPaths[newPaths.length - 1].points.push({ x, y });
      return newPaths;
    });
    redrawCanvas();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setIsErasing(false);
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const inputCanvas = inputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!inputCanvas || !maskCanvas || !image) return;

    const inputCtx = inputCanvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!inputCtx || !maskCtx) return;

    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    paths.forEach((path) => {
      maskCtx.beginPath();
      maskCtx.strokeStyle = path.color;
      maskCtx.lineWidth = path.width;
      maskCtx.lineCap = "round";
      maskCtx.lineJoin = "round";
      path.points.forEach((point, index) =>
        index === 0 ? maskCtx.moveTo(point.x, point.y) : maskCtx.lineTo(point.x, point.y)
      );
      if (path.color === "transparent") {
        maskCtx.globalCompositeOperation = "destination-out";
        maskCtx.stroke();
        maskCtx.globalCompositeOperation = "source-over";
      } else {
        maskCtx.stroke();
      }
    });

    updateMaskPreview();
  };

  const updateMaskPreview = () => {
    const inputCanvas = inputCanvasRef.current;
    if (!inputCanvas || !image) return;
    const inputCtx = inputCanvas.getContext("2d");
    if (!inputCtx) return;

    const resizedImg = new Image();
    resizedImg.onload = () => {
      inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
      inputCtx.drawImage(resizedImg, 0, 0, inputCanvas.width, inputCanvas.height);
      inputCtx.globalAlpha = maskOpacity;
      inputCtx.drawImage(maskCanvasRef.current!, 0, 0, inputCanvas.width, inputCanvas.height);
      inputCtx.globalAlpha = 1.0;
    };
    resizedImg.src = resizedImageData;
  };

  const convertImageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/png");
        canvas.remove();
        resolve(base64);
      };
      img.src = url;
    });
  };

  const addWatermark = async (imageData: string): Promise<string> => {
    const img = new Image();
    img.src = imageData;
    await img.decode();

    const logo = new Image();
    logo.src = "/logo.png";
    await logo.decode();

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const logoSize = img.width * 0.2;
    ctx.drawImage(logo, img.width - logoSize - 10, img.height - logoSize - 10, logoSize, logoSize);
    return canvas.toDataURL("image/png");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !selectedProduct || paths.length === 0) {
      setError("Vui lòng tải ảnh, chọn sản phẩm và vẽ mask trước khi xử lý");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setActiveCanvas("canvas2");

    try {
      const maskImage = await getCombinedImage();
      const productImageBase64 = await convertImageToBase64(products[selectedProduct as keyof typeof products]);
      const resultUrl = await processInpainting(resizedImageData, productImageBase64, maskImage);
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      const watermarkedImageUrl = await addWatermark(proxiedUrl);
      setInpaintedImage(watermarkedImageUrl);

      const img = new Image();
      img.onload = () => drawResultOnCanvas(img);
      img.src = watermarkedImageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsProcessing(false);
    }
  };

  const drawResultOnCanvas = (img: HTMLImageElement) => {
    const outputCanvas = outputCanvasRef.current;
    if (!outputCanvas) return;
    const ctx = outputCanvas.getContext("2d")!;
    const maxWidth = outputCanvas.parentElement?.clientWidth || 500;
    const aspectRatio = img.width / img.height;
    const canvasWidth = Math.min(img.width, maxWidth);
    const canvasHeight = canvasWidth / aspectRatio;

    outputCanvas.width = canvasWidth;
    outputCanvas.height = canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  };

  const getCombinedImage = async (): Promise<string> => {
    const maskCanvas = maskCanvasRef.current!;
    const maskCtx = maskCanvas.getContext("2d")!;
    const maskCanvasBW = document.createElement("canvas");
    maskCanvasBW.width = maskCanvas.width;
    maskCanvasBW.height = maskCanvas.height;
    const maskCtxBW = maskCanvasBW.getContext("2d")!;
    maskCtxBW.fillStyle = "black"; // Nền đen
    maskCtxBW.fillRect(0, 0, maskCanvasBW.width, maskCanvasBW.height);
    maskCtxBW.drawImage(maskCanvas, 0, 0);
    const maskImageData = maskCtxBW.getImageData(0, 0, maskCanvasBW.width, maskCanvasBW.height);
    const maskData = maskImageData.data;
  
    for (let i = 0; i < maskData.length; i += 4) {
      const r = maskData[i];
      const g = maskData[i + 1];
      const b = maskData[i + 2];
      if (r !== 0 || g !== 0 || b !== 0) { // Nếu không phải đen (vùng đã vẽ)
        maskData[i] = 255;     // Đặt đỏ thành trắng
        maskData[i + 1] = 255; // Đặt xanh lá thành trắng
        maskData[i + 2] = 255; // Đặt xanh dương thành trắng
        maskData[i + 3] = 255; // Độ trong suốt
      }
    }
    maskCtxBW.putImageData(maskImageData, 0, 0);
    const result = maskCanvasBW.toDataURL("image/png");
    maskCanvasBW.remove();
    return result;
  };
  const downloadImage = () => {
    if (!inpaintedImage) return;
    const link = document.createElement("a");
    link.download = "ket-qua-xu-ly.png";
    link.href = inpaintedImage;
    link.click();
    link.remove();
  };

  const getProductQuote = () => {
    if (!selectedProduct) return "Vui lòng chọn sản phẩm.";
    const product = Object.values(productGroups).flat().find((p) => p.name === selectedProduct);
    return product?.quote || "Không tìm thấy thông tin.";
  };

  return (
    <div className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col bg-gray-50">
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-900 animate-fade-in">CaslaQuartz AI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        {/* Cột 1: Tải ảnh & Vẽ */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 bg-white rounded-xl shadow-lg transition-transform hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Tải Ảnh & Vẽ</h2>
            <div className="relative bg-gray-100 rounded-lg border border-gray-200 h-[400px] overflow-hidden">
              <canvas
                ref={inputCanvasRef}
                className="max-w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onContextMenu={(e) => e.preventDefault()}
              />
              {!image && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Upload className="h-10 w-10 text-blue-600 mb-2" />
                  <p className="text-blue-700">Tải ảnh để bắt đầu</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh
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

            {image && (
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={resetCanvas}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                  <Button
                    onClick={() => setBrushColor("black")}
                    className={`flex-1 ${brushColor === "black" ? "bg-black text-white" : "bg-gray-200 text-black hover:bg-gray-300"}`}
                  >
                    Đen
                  </Button>
                  <Button
                    onClick={() => setBrushColor("white")}
                    className={`flex-1 ${brushColor === "white" ? "bg-white text-black border border-gray-300" : "bg-gray-200 text-black hover:bg-gray-300"}`}
                  >
                    Trắng
                  </Button>
                </div>

                <Tabs defaultValue="brush" className="w-full">
                  <TabsList className="grid grid-cols-2 bg-blue-100 rounded-lg">
                    <TabsTrigger value="brush" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <Paintbrush className="h-4 w-4 mr-1" />
                      Bút vẽ
                    </TabsTrigger>
                    <TabsTrigger value="info" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      <Info className="h-4 w-4 mr-1" />
                      Hướng dẫn
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="brush" className="mt-2">
                    <label className="text-sm text-blue-900">Kích thước bút: {brushSize}px</label>
                    <Slider
                      value={[brushSize]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(value) => setBrushSize(value[0])}
                      className="mt-1"
                    />
                  </TabsContent>
                  <TabsContent value="info" className="mt-2 text-sm text-blue-800">
                    <p>1. Tải ảnh lên.</p>
                    <p>2. Chọn sản phẩm từ cột bên.</p>
                    <p>3. Vẽ (chuột trái) hoặc xóa (chuột phải).</p>
                    <p>4. Nhấn "Xử lý ảnh".</p>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleSubmit}
                  disabled={!image || isProcessing || !selectedProduct}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Xử lý ảnh
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Cột 2: Chọn sản phẩm */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 bg-white rounded-xl shadow-lg h-full transition-transform hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Chọn Sản Phẩm</h2>
            <div className="space-y-2">
              {Object.keys(productGroups).map((group) => (
                <div key={group}>
                  <Button
                    onClick={() => setOpenGroup(openGroup === group ? null : group)}
                    className="w-full text-left bg-blue-100 hover:bg-blue-200 text-blue-900"
                  >
                    {group}
                  </Button>
                  {openGroup === group && (
                    <div className="mt-2 space-y-1">
                      {productGroups[group as keyof typeof productGroups].map((product) => (
                        <Button
                          key={product.name}
                          onClick={() => setSelectedProduct(product.name)}
                          className={`w-full text-left justify-start ${
                            selectedProduct === product.name ? "bg-blue-600 text-white" : "bg-gray-100 text-blue-900 hover:bg-gray-200"
                          }`}
                        >
                          {product.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Alert className="mt-4 bg-black text-white rounded-lg">
              <AlertTitle className="text-sm">Thông tin</AlertTitle>
              <AlertDescription className="text-xs">{getProductQuote()}</AlertDescription>
            </Alert>
          </Card>
        </div>

        {/* Cột 3: Kết quả */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 bg-white rounded-xl shadow-lg transition-transform hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Kết Quả</h2>
            <div className="relative bg-gray-100 rounded-lg border border-gray-200 h-[400px] overflow-hidden">
              <canvas ref={outputCanvasRef} className={activeCanvas === "canvas2" ? "block" : "hidden"} />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200/70">
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
            <Button
              onClick={downloadImage}
              disabled={!inpaintedImage}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Tải kết quả
            </Button>
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </Card>
        </div>
      </div>

      <footer className="mt-8 text-center text-sm text-blue-700">
        © 2025 CaslaQuartz. All rights reserved.
      </footer>
    </div>
  );
}


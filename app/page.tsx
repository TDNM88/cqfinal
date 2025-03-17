// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Save, Trash2, Download, Loader2, Send, Info } from "lucide-react";
import { useInpainting } from "@/hooks/useInpainting";

// Định nghĩa kiểu dữ liệu
interface Product {
  [key: string]: string;
}

interface Point {
  x: number;
  y: number;
}

// Danh sách sản phẩm
const productGroups: { [key: string]: string[] } = {
  "NHÓM TIÊU CHUẨN (STANDARD)": [
    "C1012 - Glacier White",
    "C1026 - Polar",
    "C1005 - Milky White",
    "C3168 - Silver Wave",
    "C3269 - Ash Grey",
  ],
  "NHÓM TRUNG CẤP (DELUXE)": [
    "C2103 - Onyx Carrara",
    "C2104 - Massa",
    "C3105 - Casla Cloudy",
    "C3146 - Casla Nova",
    "C2240 - Marquin",
  ],
  "NHÓM CAO CẤP (LUXURY)": [
    "C1102 - Super White",
    "C1205 - Casla Everest",
    "C4246 - Casla Mystery",
    "C4254 - Mystery Gold",
    "C4326 - Statuario",
  ],
  "NHÓM SIÊU CAO CẤP (SUPER LUXURY)": [
    "C4147 - Mont",
    "C4149 - River",
    "C4255 - Calacatta Extra",
    "C5366 - Skiron",
  ],
};

const products: Product = Object.fromEntries(
  Object.values(productGroups).flat().map((name) => [
    name,
    `/product_images/${name.split(" - ")[0]}.jpg`,
  ])
);

export default function ImageInpaintingApp() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCanvas, setActiveCanvas] = useState<"canvas1" | "canvas2" | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#ffffff"); // Màu trắng mặc định
  const [brushSize, setBrushSize] = useState(5);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { processInpainting } = useInpainting();

  // Tải ảnh lên canvas đầu vào
  useEffect(() => {
    if (imageSrc && inputCanvasRef.current) {
      const canvas = inputCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const maxWidth = 500;
        const aspectRatio = img.width / img.height;
        const canvasWidth = Math.min(img.width, maxWidth);
        const canvasHeight = canvasWidth / aspectRatio;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      };
    }
  }, [imageSrc]);

  // Xử lý tải ảnh
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setInpaintedImage(null);
        setError(null);
        setActiveCanvas("canvas1");
      };
      reader.readAsDataURL(file);
    }
  };

  // Lấy tọa độ từ sự kiện chuột hoặc cảm ứng
  const getCoordinates = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ): Point | null => {
    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ("touches" in event) {
      const touch = event.touches[0];
      if (!touch) return null;
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    return { x, y };
  };

  // Bắt đầu vẽ
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!inputCanvasRef.current) return;
    setIsDrawing(true);
    const point = getCoordinates(event, inputCanvasRef.current);
    if (point) {
      setLastPoint(point);
      drawOnCanvas(event);
    }
  };

  // Vẽ trên canvas
  const drawOnCanvas = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!inputCanvasRef.current || !isDrawing) return;
    const canvas = inputCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getCoordinates(event, canvas);
    if (!currentPoint) return;

    ctx.beginPath();
    if (lastPoint) {
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
    } else {
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y); // Vẽ điểm đơn nếu không có điểm trước
    }
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round"; // Đầu bút tròn để mượt mà
    ctx.lineJoin = "round"; // Nối các đoạn mượt mà
    ctx.stroke();

    setLastPoint(currentPoint);
  };

  // Dừng vẽ
  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null); // Reset điểm cuối để không nối tiếp khi vẽ lại
  };

  // Xóa mask (khôi phục ảnh gốc)
  const clearMask = () => {
    if (!inputCanvasRef.current || !imageSrc) return;
    const canvas = inputCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  // Thêm watermark
  const addWatermark = async (imageUrl: string): Promise<string> => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Không thể tạo context");

    ctx.drawImage(img, 0, 0);

    const logo = new Image();
    logo.src = "/logo.png";
    logo.crossOrigin = "anonymous";

    await logo.decode();

    const logoWidth = logo.width / 2;
    const logoHeight = logo.height / 2;
    const logoX = img.width - logoWidth;
    const logoY = 0;

    ctx.globalAlpha = 0.5;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0;

    return canvas.toDataURL("image/png");
  };

  // Xử lý ảnh
  const handleSubmit = async () => {
    if (!imageSrc || !selectedProduct || !inputCanvasRef.current) {
      setError("Vui lòng tải ảnh và chọn sản phẩm trước khi xử lý");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setActiveCanvas("canvas2");

      const maskImage = inputCanvasRef.current.toDataURL("image/png");
      const productImage = products[selectedProduct as keyof typeof products];
      const resultUrl = await processInpainting(imageSrc, productImage, maskImage);
      const watermarkedImageUrl = await addWatermark(resultUrl);

      setInpaintedImage(watermarkedImageUrl);
      drawResultOnCanvas(watermarkedImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setIsProcessing(false);
    }
  };

  // Vẽ kết quả lên canvas
  const drawResultOnCanvas = (imageUrl: string) => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxWidth = 500;
      const aspectRatio = img.width / img.height;
      const canvasWidth = Math.min(img.width, maxWidth);
      const canvasHeight = canvasWidth / aspectRatio;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    };
    img.src = imageUrl;
  };

  // Tải kết quả
  const downloadImage = () => {
    if (!inpaintedImage) return;
    const link = document.createElement("a");
    link.download = "ket-qua-xu-ly.png";
    link.href = inpaintedImage;
    link.click();
  };

  // Lưu canvas đầu vào
  const saveCanvas = () => {
    if (!inputCanvasRef.current) return;
    const dataURL = inputCanvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "canvas.png";
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col animate-fade-in">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800 transition-all duration-300 hover:text-blue-900">
        CaslaQuartz AI
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
        {/* Canvas Đầu Vào */}
        <div
          className={`flex flex-col space-y-4 transition-all duration-300 ${
            activeCanvas === "canvas1"
              ? "transform scale-110 z-10"
              : activeCanvas === "canvas2"
              ? "transform scale-90 opacity-75"
              : ""
          }`}
        >
          <Card className="p-4 flex flex-col gap-4 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-light text-blue-800">Tải Ảnh & Vẽ Mask</h2>
            <div
              className={`relative bg-muted rounded-md overflow-auto flex items-center justify-center border ${
                imageSrc ? "border-blue-300" : "border-gray-200"
              } transition-all duration-300`}
            >
              <canvas
                ref={inputCanvasRef}
                className="max-w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={drawOnCanvas}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={drawOnCanvas}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
              />
              {!imageSrc && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Upload className="h-12 w-12 text-blue-800/50 mb-2" />
                  <p className="text-blue-800/70">Tải ảnh lên để bắt đầu</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-blue-800 hover:bg-blue-900 text-white hover:scale-105 transition-all duration-200"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh
                  </Button>
                </div>
              )}
            </div>
            {imageSrc && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 w-full bg-blue-800 hover:bg-blue-900 text-white hover:scale-105 transition-all duration-200"
                    size="sm"
                  >
                    <Upload className="h-4 w-4" />
                    Tải ảnh mới
                  </Button>
                  <Button
                    onClick={saveCanvas}
                    className="flex items-center gap-2 w-full bg-blue-800 hover:bg-blue-900 text-white hover:scale-105 transition-all duration-200"
                    size="sm"
                  >
                    <Save className="h-4 w-4" />
                    Lưu ảnh
                  </Button>
                  <Button
                    onClick={clearMask}
                    className="flex items-center gap-2 w-full bg-blue-800 hover:bg-blue-900 text-white hover:scale-105 transition-all duration-200"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa Mask
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="brush-color" className="text-xs font-medium text-blue-800">
                    Màu:
                  </Label>
                  <input
                    id="brush-color"
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-10 h-10"
                  />
                  <Label htmlFor="brush-size" className="text-xs font-medium text-blue-800">
                    Kích thước:
                  </Label>
                  <input
                    id="brush-size"
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!imageSrc || isProcessing}
                  className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white hover:scale-105 transition-all duration-200"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isProcessing ? "Đang xử lý..." : "Xử lý ảnh"}
                </Button>
              </div>
            )}
          </Card>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Danh sách sản phẩm */}
        <div
          className={`flex flex-col space-y-4 transition-all duration-300 ${
            activeCanvas === "canvas1" || activeCanvas === "canvas2"
              ? "transform scale-110 z-10"
              : "transform scale-90 opacity-75"
          }`}
        >
          <Card className="p-4 h-full flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-light mb-4 text-blue-800">CaslaQuartz Menu</h2>
            <div className="text-sm text-blue-800/70 mb-2">Chọn một sản phẩm để tải ảnh:</div>
            <ScrollArea className="flex-grow border rounded-md p-2 border-blue-100">
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(productGroups).map(([groupName, productList]) => (
                  <AccordionItem key={groupName} value={groupName}>
                    <AccordionTrigger className="text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-all duration-200 hover:scale-105">
                      {groupName}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {productList.map((productName) => (
                          <Button
                            key={productName}
                            variant={selectedProduct === productName ? "default" : "outline"}
                            className={`justify-start text-left h-auto py-2 px-3 text-xs font-normal transition-all duration-200 hover:scale-105 ${
                              selectedProduct === productName
                                ? "bg-blue-800 hover:bg-blue-900 text-white"
                                : "text-blue-800 border-blue-200 hover:bg-blue-50"
                            }`}
                            onClick={() => setSelectedProduct(productName)}
                          >
                            {productName}
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
            {selectedProduct && (
              <div className="mt-4 p-2 bg-blue-50 rounded-md text-xs text-blue-800">
                <p className="font-medium">Đã chọn: {selectedProduct}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Canvas Kết Quả */}
        <div
          className={`flex flex-col space-y-4 transition-all duration-300 ${
            activeCanvas === "canvas2"
              ? "transform scale-110 z-10"
              : activeCanvas === "canvas1"
              ? "transform scale-90 opacity-75"
              : ""
          }`}
        >
          <Card className="p-4 h-full flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-light mb-4 text-blue-800">Kết Quả Xử Lý</h2>
            <div
              className={`relative bg-muted rounded-md overflow-auto flex items-center justify-center flex-grow border ${
                inpaintedImage ? "border-blue-300" : "border-gray-200"
              } transition-all duration-300`}
            >
              <canvas ref={outputCanvasRef} className="max-w-full" />
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                  <Loader2 className="h-12 w-12 text-blue-800 animate-spin mb-4" />
                  <p className="text-blue-800/70">Đang xử lý ảnh...</p>
                </div>
              )}
              {!inpaintedImage && !isProcessing && (
                <p className="text-blue-800/70">Kết quả sẽ hiển thị ở đây</p>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                onClick={downloadImage}
                disabled={!inpaintedImage}
                className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white hover:scale-105 transition-all duration-200"
              >
                <Download className="h-4 w-4" />
                Tải kết quả
              </Button>
              {error && (
                <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md text-xs">
                  <p className="font-medium">Lỗi: {error}</p>
                </div>
              )}
              <div className="mt-2 flex items-center gap-1">
                <Info className="h-3 w-3 text-blue-800/70" />
                <p className="text-xs text-blue-800">Nhấn "Xử lý ảnh" sau khi vẽ và chọn sản phẩm</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-xs text-blue-800/70 border-t border-blue-100 animate-fade-in">
        <p>Liên hệ: support@caslaquartz.com | Hotline: 1234-567-890</p>
        <p>© 2025 CaslaQuartz. All rights reserved.</p>
      </footer>
    </div>
  );
}

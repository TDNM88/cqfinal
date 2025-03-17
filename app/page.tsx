// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Save, Trash2, Download, Loader2, Send, Info, Eraser } from "lucide-react";
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
    "C2262 - Concrete (Honed)",
    "C3311 - Calacatta Sky",
    "C3346 - Massimo",
    "C4143 - Mario",
    "C4145 - Marina",
    "C5225 - Amber",
    "C5240 - Spring",
  ],
  "NHÓM CAO CẤP (LUXURY)": [
    "C1102 - Super White",
    "C1205 - Casla Everest",
    "C4246 - Casla Mystery",
    "C4254 - Mystery Gold",
    "C4326 - Statuario",
    "C4348 - Montana",
    "C5231 - Andes",
    "C5242 - Rosa",
    "C5250 - Autumn",
    "C4111 - Aurora",
    "C4202 - Calacatta Gold",
    "C4204 - Calacatta Classic",
    "C4211 - Calacatta Supreme",
    "C4221 - Athena",
    "C4222 - Lagoon",
    "C4238 - Channel",
    "C4250 - Elio",
    "C4342 - Casla Eternal",
    "C4345 - Oro",
    "C4346 - Luxe",
    "C5340 - Sonata",
    "C5445 - Muse",
  ],
  "NHÓM SIÊU CAO CẤP (SUPER LUXURY)": [
    "C4147 - Mont",
    "C4149 - River",
    "C4255 - Calacatta Extra",
    "C5366 - Skiron",
  ],
};

const products = Object.fromEntries(
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
  const [brushSize, setBrushSize] = useState(20); // Kích thước mặc định 20px giống hình
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [isErasing, setIsErasing] = useState(false); // Chế độ xóa
  const [showGuide, setShowGuide] = useState(false); // Hiển thị hướng dẫn

  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const { processInpainting } = useInpainting();

  // Tải ảnh lên canvas đầu vào và lưu ảnh gốc
  useEffect(() => {
    if (imageSrc && inputCanvasRef.current) {
      const canvas = inputCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const maxWidth = 600;
        const aspectRatio = img.width / img.height;
        const canvasWidth = Math.min(img.width, maxWidth);
        const canvasHeight = canvasWidth / aspectRatio;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        originalImageRef.current = img;
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

  // Vẽ hoặc xóa trên canvas
  const drawOnCanvas = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!inputCanvasRef.current || !isDrawing || !imageSrc) return;
    const canvas = inputCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getCoordinates(event, canvas);
    if (!currentPoint) return;

    if (isErasing && originalImageRef.current) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, brushSize / 2, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.beginPath();
      if (lastPoint) {
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
      } else {
        ctx.moveTo(currentPoint.x, currentPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
      }
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    setLastPoint(currentPoint);
  };

  // Dừng vẽ
  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  // Xóa toàn bộ mask
  const clearMask = () => {
    if (!inputCanvasRef.current || !originalImageRef.current) return;
    const canvas = inputCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);
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
      const maxWidth = 600;
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

  // Chuyển đổi chế độ vẽ/xóa
  const toggleEraseMode = () => {
    setIsErasing(!isErasing);
  };

  // Hiển thị/ẩn hướng dẫn
  const toggleGuide = () => {
    setShowGuide(!showGuide);
  };

  return (
    <div className="container mx-auto py-10 px-6 font-sans min-h-screen flex flex-col bg-gray-50">
      <h1 className="text-4xl font-bold text-center mb-12 text-blue-900">
        CaslaQuartz AI
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        {/* Canvas Đầu Vào */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-blue-900">Tải Ảnh & Chọn Vật Thể</h2>
            <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[400px]">
              <canvas
                ref={inputCanvasRef}
                className="max-w-full cursor-crosshair relative z-20"
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
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <Upload className="h-12 w-12 text-blue-900/50 mb-4" />
                  <p className="text-blue-900/70 text-lg">Tải ảnh lên để bắt đầu</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-blue-900 hover:bg-blue-800 text-white pointer-events-auto z-20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh lên
                  </Button>
                </div>
              )}
            </div>
            {imageSrc && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-blue-900 hover:bg-blue-800 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh mới
                  </Button>
                  <Button
                    onClick={saveCanvas}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Lưu ảnh
                  </Button>
                  <Button
                    onClick={clearMask}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Tải ảnh mới
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleEraseMode}
                    className={`flex items-center gap-2 ${
                      isErasing
                        ? "bg-blue-900 hover:bg-blue-800 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-blue-900"
                    }`}
                  >
                    <Eraser className="h-4 w-4" />
                    Bút vẽ
                  </Button>
                  <Label htmlFor="brush-size" className="text-sm font-medium text-blue-900">
                    Kích thước: {brushSize}px
                  </Label>
                  <input
                    id="brush-size"
                    type="range"
                    min="1"
                    max="30"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-32"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!imageSrc || isProcessing}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Xử lý ảnh
                </Button>
                <Button
                  onClick={toggleGuide}
                  className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Hướng dẫn
                </Button>
                {showGuide && (
                  <div className="mt-2 p-4 bg-blue-50 rounded-md text-sm text-blue-900">
                    <p className="font-medium">Hướng dẫn sử dụng:</p>
                    <ol className="list-decimal list-inside mt-2">
                      <li>Chọn sản phẩm hoặc họa tiết bạn muốn thêm vào ảnh.</li>
                      <li>Vẽ màu lên vùng cần xử lý (chọn phái để tay).</li>
                      <li>Nhấn "Xử lý ảnh" để tạo kết quả.</li>
                    </ol>
                  </div>
                )}
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
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-md h-full">
            <h2 className="text-xl font-medium text-blue-900">CaslaQuartz Menu</h2>
            <p className="text-sm text-blue-900/70">Chọn một sản phẩm để tải ảnh:</p>
            <ScrollArea className="flex-grow border rounded-md p-2 border-blue-100 h-[400px]">
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(productGroups).map(([groupName, productList]) => (
                  <AccordionItem key={groupName} value={groupName}>
                    <AccordionTrigger className="text-blue-900 hover:bg-blue-50 px-2 py-1 rounded">
                      {groupName}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-1 mt-1">
                        {productList.map((productName) => (
                          <Button
                            key={productName}
                            variant={selectedProduct === productName ? "default" : "outline"}
                            className={`justify-start text-left h-auto py-2 px-3 text-sm font-normal ${
                              selectedProduct === productName
                                ? "bg-blue-900 hover:bg-blue-800 text-white"
                                : "text-blue-900 border-blue-200 hover:bg-blue-50"
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
          </Card>
        </div>

        {/* Canvas Kết Quả */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md h-full">
            <h2 className="text-xl font-medium text-blue-900">Kết Quả Xử Lý</h2>
            <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[400px]">
              <canvas ref={outputCanvasRef} className="max-w-full" />
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                  <Loader2 className="h-12 w-12 text-blue-900 animate-spin mb-4" />
                  <p className="text-blue-900/70 text-lg">Đang xử lý ảnh...</p>
                </div>
              )}
              {!inpaintedImage && !isProcessing && (
                <p className="text-blue-900/70 text-lg">Kết quả sẽ hiển thị ở đây</p>
              )}
            </div>
            <Button
              onClick={downloadImage}
              disabled={!inpaintedImage}
              className="bg-gray-200 hover:bg-gray-300 text-blue-900"
            >
              <Download className="h-4 w-4 mr-2" />
              Tải kết quả
            </Button>
            {error && (
              <div className="mt-2 p-4 bg-red-50 rounded-md text-sm text-red-900">
                <p className="font-medium">Lỗi: {error}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-4 text-center text-sm text-blue-900/70">
        <p>Liên hệ: support@caslaquartz.com | Hotline: 1234-567-890</p>
        <p>© 2025 CaslaQuartz. All rights reserved.</p>
      </footer>
    </div>
  );
}

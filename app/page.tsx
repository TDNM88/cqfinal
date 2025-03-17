"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Upload, Download, Paintbrush, Loader2, Info, Send, RefreshCw, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInpainting } from "@/hooks/useInpainting";

// Định nghĩa kiểu Path cho các đường vẽ
type Path = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

// Danh sách sản phẩm
const productGroups = {
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
  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [resizedImageData, setResizedImageData] = useState<string>("");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [maskOpacity] = useState(0.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [activeCanvas, setActiveCanvas] = useState<"canvas1" | "canvas2" | null>(null);

  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { processInpainting } = useInpainting();

  // Khởi tạo canvas
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
    maskCanvasRef.current = document.createElement("canvas");
  }, []);

  // Resize ảnh
  const resizeImage = (img: HTMLImageElement, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const aspectRatio = img.width / img.height;
      const canvasWidth = maxWidth;
      const canvasHeight = canvasWidth / aspectRatio;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        resolve(tempCanvas.toDataURL("image/png"));
      } else {
        resolve("");
      }
    });
  };

  // Tải ảnh
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaths([]);
    setInpaintedImage(null);
    setError(null);
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
      img.crossOrigin = "anonymous";
    };
    reader.readAsDataURL(file);
  };

  // Vẽ ảnh lên canvas
  const drawImageOnCanvas = (img: HTMLImageElement, resizedData: string) => {
    const inputCanvas = inputCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!inputCanvas || !outputCanvas || !maskCanvas) return;

    const maxWidth = inputCanvas.parentElement?.clientWidth || 500;
    const aspectRatio = img.width / img.height;
    const canvasWidth = maxWidth;
    const canvasHeight = canvasWidth / aspectRatio;

    inputCanvas.width = canvasWidth;
    inputCanvas.height = canvasHeight;
    outputCanvas.width = canvasWidth;
    outputCanvas.height = canvasHeight;
    maskCanvas.width = canvasWidth;
    maskCanvas.height = canvasHeight;

    const inputCtx = inputCanvas.getContext("2d");
    if (inputCtx) {
      const resizedImg = new Image();
      resizedImg.onload = () => {
        inputCtx.drawImage(resizedImg, 0, 0, canvasWidth, canvasHeight);
      };
      resizedImg.src = resizedData;
    }

    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    drawInformationOnOutputCanvas();
  };

  // Hiển thị thông tin hướng dẫn trên canvas kết quả
  const drawInformationOnOutputCanvas = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1f2937";
    ctx.font = '16px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Vẽ mặt nạ trên canvas bên trái", canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText("để chỉ định vùng cần xử lý.", canvas.width / 2, canvas.height / 2 - 15);
    ctx.fillText('Sau đó nhấn "Xử lý ảnh" để', canvas.width / 2, canvas.height / 2 + 15);
    ctx.fillText("tạo kết quả.", canvas.width / 2, canvas.height / 2 + 40);
  };

  // Bắt đầu vẽ (chuột)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsErasing(e.button === 2);
    setActiveCanvas("canvas1");
    const rect = inputCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPaths((prev) => [
      ...prev,
      { points: [{ x, y }], color: isErasing ? "black" : "white", width: brushSize },
    ]);
  };

  // Vẽ (chuột)
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = inputCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPaths((prev) => {
      const newPaths = [...prev];
      const currentPath = newPaths[newPaths.length - 1];
      currentPath.points.push({ x, y });
      return newPaths;
    });
    redrawCanvas();
  };

  // Dừng vẽ (chuột)
  const stopDrawing = () => {
    setIsDrawing(false);
    setIsErasing(false);
    redrawCanvas();
  };

  // Bắt đầu vẽ (cảm ứng)
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setActiveCanvas("canvas1");
    const rect = inputCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setPaths((prev) => [
      ...prev,
      { points: [{ x, y }], color: "white", width: brushSize },
    ]);
  };

  // Vẽ (cảm ứng)
  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = inputCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setPaths((prev) => {
      const newPaths = [...prev];
      const currentPath = newPaths[newPaths.length - 1];
      currentPath.points.push({ x, y });
      return newPaths;
    });
    redrawCanvas();
  };

  // Dừng vẽ (cảm ứng)
  const stopDrawingTouch = () => {
    setIsDrawing(false);
    redrawCanvas();
  };

  // Vẽ lại canvas từ danh sách đường vẽ
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
      path.points.forEach((point, index) => {
        if (index === 0) {
          maskCtx.moveTo(point.x, point.y);
        } else {
          maskCtx.lineTo(point.x, point.y);
        }
      });
      maskCtx.stroke();
    });

    updateMaskPreview();
  };

  // Cập nhật preview mask
  const updateMaskPreview = () => {
    const inputCanvas = inputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!inputCanvas || !maskCanvas || !image) return;

    const inputCtx = inputCanvas.getContext("2d");
    if (!inputCtx) return;

    const resizedImg = new Image();
    resizedImg.onload = () => {
      inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
      inputCtx.drawImage(resizedImg, 0, 0, inputCanvas.width, inputCanvas.height);
      inputCtx.globalAlpha = maskOpacity;
      inputCtx.drawImage(maskCanvas, 0, 0);
      inputCtx.globalAlpha = 1.0;
    };
    resizedImg.src = resizedImageData;
  };

  // Xóa đường vẽ bất kỳ
  const deletePathAtPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const rect = maskCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let closestPathIndex = -1;
    let minDistance = Infinity;

    paths.forEach((path, index) => {
      path.points.forEach((point) => {
        const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
        if (distance < minDistance) {
          minDistance = distance;
          closestPathIndex = index;
        }
      });
    });

    if (closestPathIndex !== -1 && minDistance < 10) {
      setPaths((prev) => prev.filter((_, i) => i !== closestPathIndex));
      redrawCanvas();
    }
  };

  // Chọn sản phẩm
  const handleProductSelect = (productName: string) => {
    setSelectedProduct(productName);
  };

  // Lưu trạng thái canvas
  const saveCanvasState = () => {
    if (!inputCanvasRef.current) return;
    const canvas = inputCanvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "canvas-state.png";
    link.href = dataURL;
    link.click();
  };

  // Tải ảnh mới
  const handleReloadImage = () => {
    setImage(null);
    setPaths([]);
    setInpaintedImage(null);
    setError(null);
    setResizedImageData("");
    fileInputRef.current?.click();
  };

  // Thêm watermark vào ảnh kết quả
  const addWatermark = async (imageUrl: string): Promise<string> => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    try {
      await img.decode();
    } catch (error) {
      throw new Error("Không thể tải ảnh kết quả");
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Không thể tạo context cho canvas");

    ctx.drawImage(img, 0, 0);

    const logo = new Image();
    logo.src = "/logo.png";
    logo.crossOrigin = "anonymous";

    try {
      await logo.decode();
    } catch (error) {
      throw new Error("Không thể tải logo");
    }

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setError(null);
      setActiveCanvas("canvas2");

      const maskImage = await getCombinedImage();

      if (!selectedProduct) {
        throw new Error("Vui lòng chọn một sản phẩm trước khi xử lý");
      }

      const productImage = products[selectedProduct as keyof typeof products];
      const resultUrl = await processInpainting(resizedImageData, productImage, maskImage);
      const watermarkedImageUrl = await addWatermark(resultUrl);

      setInpaintedImage(watermarkedImageUrl);
      const img = new Image();
      img.onload = () => drawResultOnCanvas(img);
      img.src = watermarkedImageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setIsProcessing(false);
    }
  };

  // Vẽ kết quả lên canvas
  const drawResultOnCanvas = (img: HTMLImageElement) => {
    const outputCanvas = outputCanvasRef.current;
    if (!outputCanvas) return;

    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;

    const maxWidth = outputCanvas.parentElement?.clientWidth || 500;
    const aspectRatio = img.width / img.height;
    const canvasWidth = maxWidth;
    const canvasHeight = canvasWidth / aspectRatio;

    outputCanvas.width = canvasWidth;
    outputCanvas.height = canvasHeight;

    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  };

  // Lấy ảnh mask kết hợp
  const getCombinedImage = async (): Promise<string> => {
    const inputCanvas = inputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!inputCanvas || !maskCanvas || !image) {
      throw new Error("Không tìm thấy canvas hoặc ảnh");
    }

    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) throw new Error("Không thể lấy context của mask");

    const maskCanvasBW = document.createElement("canvas");
    maskCanvasBW.width = inputCanvas.width;
    maskCanvasBW.height = inputCanvas.height;
    const maskCtxBW = maskCanvasBW.getContext("2d");
    if (!maskCtxBW) throw new Error("Không thể tạo context cho mask BW");

    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const maskData = maskImageData.data;

    for (let i = 0; i < maskData.length; i += 4) {
      const maskValue = maskData[i];
      maskCtxBW.fillStyle = maskValue > 0 ? "white" : "black";
      maskCtxBW.fillRect((i / 4) % inputCanvas.width, Math.floor((i / 4) / inputCanvas.width), 1, 1);
    }

    return maskCanvasBW.toDataURL("image/png");
  };

  // Tải kết quả
  const downloadImage = () => {
    if (!inpaintedImage) return;
    const link = document.createElement("a");
    link.download = "ket-qua-xu-ly.png";
    link.href = inpaintedImage;
    link.click();
  };

  return (
    <div
      className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col animate-fade-in"
      style={{ fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800 transition-all duration-300 hover:text-blue-900">
        CaslaQuartz AI
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
        {/* Input Canvas Section */}
        <div
          className={`flex flex-col space-y-4 transition-all duration-300 ${
            activeCanvas === "canvas1"
              ? "transform scale-110 z-10"
              : activeCanvas === "canvas2"
              ? "transform scale-90 opacity-75"
              : ""
          }`}
        >
          <Card className="p-4 h-full flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-light mb-4 text-blue-800">Tải Ảnh & Chọn vật thể</h2>
            <div
              className={`relative bg-muted rounded-md overflow-auto flex items-center justify-center flex-grow border ${
                image ? "border-blue-300" : "border-gray-200"
              } transition-all duration-300`}
            >
              <canvas
                ref={inputCanvasRef}
                className="max-w-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onContextMenu={(e) => e.preventDefault()}
                onTouchStart={startDrawingTouch}
                onTouchMove={drawTouch}
                onTouchEnd={stopDrawingTouch}
                onClick={deletePathAtPosition}
              />
              {!image && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Upload className="h-12 w-12 text-blue-800/50 mb-2" />
                  <p className="text-blue-800/70">Tải ảnh lên để bắt đầu</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-blue-800 hover:bg-blue-900 active:bg-blue-950 hover:scale-105 transition-all duration-200"
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
                  className="flex items-center gap-2 w-full bg-blue-800 hover:bg-blue-900 active:bg-blue-950 text-white hover:scale-105 transition-all duration-200"
                  size="sm"
                  disabled={!image}
                >
                  <Save className="h-4 w-4" />
                  Lưu ảnh
                </Button>

                <Button
                  onClick={handleReloadImage}
                  variant="outline"
                  className="flex items-center gap-2 w-full text-blue-800 border-blue-800 hover:bg-blue-100 active:bg-blue-200 hover:scale-105 transition-all duration-200"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tải ảnh mới
                </Button>
              </div>

              <Tabs defaultValue="brush" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2 bg-blue-50 rounded-md">
                  <TabsTrigger
                    value="brush"
                    className="data-[state=active]:bg-blue-800 data-[state=active]:text-white hover:bg-blue-100 transition-all duration-200"
                  >
                    <Paintbrush className="h-4 w-4 mr-1" />
                    Bút vẽ
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="data-[state=active]:bg-blue-800 data-[state=active]:text-white hover:bg-blue-100 transition-all duration-200"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Hướng dẫn
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="brush" className="space-y-2 mt-2">
                  <div>
                    <label className="text-xs font-medium text-blue-800">Kích thước: {brushSize}px</label>
                    <Slider
                      value={[brushSize]}
                      min={1}
                      max={50}
                      step={1}
                      onValueChange={(value) => setBrushSize(value[0])}
                      className="mt-1"
                    />
                  </div>
                  <p className="text-xs text-blue-800">Chuột phải để tẩy</p>
                </TabsContent>
                <TabsContent value="info" className="space-y-2 mt-2">
                  <p className="text-xs text-blue-800">Nhấp vào đường vẽ để xóa</p>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleSubmit}
                disabled={!image || isProcessing}
                className="flex items-center gap-2 mt-2 bg-blue-800 hover:bg-blue-900 active:bg-blue-950 text-white hover:scale-105 transition-all duration-200"
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
                                ? "bg-blue-800 hover:bg-blue-900 active:bg-blue-950 text-white"
                                : "text-blue-800 border-blue-200 hover:bg-blue-50 active:bg-blue-100"
                            }`}
                            onClick={() => handleProductSelect(productName)}
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
              <div className="mt-4 p-2 bg-blue-50 rounded-md text-xs text-blue-800 transition-all duration-300">
                <p className="font-medium">Đã chọn: {selectedProduct}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Output Canvas Section */}
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
              <canvas ref={outputCanvasRef} className="max-w-none" />
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
                className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 active:bg-blue-950 text-white hover:scale-105 transition-all duration-200"
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
                <div className="bg-blue-50 p-2 rounded-md text-xs mt-1 text-blue-800 transition-all duration-300">
                  <p>1. Chọn sản phẩm hoặc tải ảnh lên</p>
                  <p>2. Vẽ mặt nạ lên vùng cần xử lý (chuột phải để tẩy)</p>
                  <p>3. Nhấn "Xử lý ảnh" để tạo kết quả</p>
                </div>
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

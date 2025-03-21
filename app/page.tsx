"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Loader2, Send, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInpainting } from "@/hooks/useInpainting";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Path = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

const productGroups = {
  STANDARD: [
    { name: "C1012 - Glacier White", quote: "Glacier với nền trắng..." },
    // Các sản phẩm khác
  ],
  // Các nhóm khác giữ nguyên như mã gốc
};

const products = Object.fromEntries(
  Object.values(productGroups)
    .flat()
    .map((item) => [item.name, `/product_images/${item.name.split(" - ")[0]}.jpg`])
);

export default function ImageInpaintingApp() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [originalImageData, setOriginalImageData] = useState<string>("");
  const [resizedImageData, setResizedImageData] = useState<string>("");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [maskOpacity] = useState(0.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [isMaskModalOpen, setIsMaskModalOpen] = useState(false);

  const mainCanvasRef = useRef<HTMLCanvasElement>(null); // Chỉ dùng 1 canvas chính
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null); // Canvas tạm để vẽ mask
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { processInpainting } = useInpainting();

  // Hiển thị placeholder khi khởi động
  useEffect(() => {
    drawPlaceholder(mainCanvasRef.current);
  }, []);

  const drawPlaceholder = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const placeholder = new Image();
    placeholder.src = "/logo2048.jpg";
    placeholder.onload = () => {
      canvas.width = placeholder.width;
      canvas.height = placeholder.height;
      ctx.drawImage(placeholder, 0, 0);
    };
    placeholder.onerror = () => {
      ctx.fillStyle = "#F3F4F6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
  };

  const resizeImage = (img: HTMLImageElement, targetWidth = 1152): Promise<string> => {
    return new Promise((resolve, reject) => {
      const minSize = 300;
      if (img.width < minSize || img.height < minSize) {
        reject(new Error("Ảnh quá nhỏ, vui lòng tải ảnh có kích thước tối thiểu 300px"));
        return;
      }
      const aspectRatio = img.width / img.height;
      let newWidth = img.width;
      let newHeight = img.height;
      if (newWidth > targetWidth) {
        newWidth = targetWidth;
        newHeight = newWidth / aspectRatio;
      }
      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const dataUrl = canvas.toDataURL("image/png");
      canvas.remove();
      resolve(dataUrl);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaths([]);
    setInpaintedImage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new window.Image();
      img.onload = async () => {
        try {
          setImage(img);
          setOriginalImageData(event.target?.result as string);
          const resizedData = await resizeImage(img);
          setResizedImageData(resizedData);
          setIsMaskModalOpen(true); // Mở modal để vẽ mask
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không thể xử lý ảnh");
          drawPlaceholder(mainCanvasRef.current);
        }
      };
      img.onerror = () => setError("Không thể tải ảnh");
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const drawImageWithMask = () => {
    const canvas = mainCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !resizedImageData) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = maskOpacity;
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.globalAlpha = 1.0;
    };
    img.onerror = () => setError("Không thể vẽ ảnh");
    img.src = resizedImageData;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!mainCanvasRef.current || !maskCanvasRef.current) return;
    setIsDrawing(true);
    const isErasingNow = e.button === 2 || eraseMode;
    setIsErasing(isErasingNow);

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (mainCanvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (mainCanvasRef.current.height / rect.height);

    const maskCtx = maskCanvasRef.current.getContext("2d")!;
    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";

    if (isErasingNow) {
      eraseMaskAtPosition(x, y);
    } else {
      maskCtx.strokeStyle = "white";
      maskCtx.lineWidth = brushSize;
      maskCtx.beginPath();
      maskCtx.moveTo(x, y);
      setPaths((prev) => [...prev, { points: [{ x, y }], color: "white", width: brushSize }]);
    }
    redrawCanvas();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !mainCanvasRef.current || !maskCanvasRef.current) return;

    const rect = mainCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (mainCanvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (mainCanvasRef.current.height / rect.height);

    const maskCtx = maskCanvasRef.current.getContext("2d")!;

    if (isErasing) {
      eraseMaskAtPosition(x, y);
    } else {
      const currentPath = paths[paths.length - 1];
      const lastPoint = currentPath.points[currentPath.points.length - 1];
      maskCtx.strokeStyle = "white";
      maskCtx.lineWidth = brushSize;
      maskCtx.quadraticCurveTo(lastPoint.x, lastPoint.y, (x + lastPoint.x) / 2, (y + lastPoint.y) / 2);
      maskCtx.stroke();
      maskCtx.beginPath();
      maskCtx.moveTo((x + lastPoint.x) / 2, (y + lastPoint.y) / 2);
      setPaths((prev) => {
        const newPaths = [...prev];
        newPaths[newPaths.length - 1].points.push({ x, y });
        return newPaths;
      });
    }
    redrawCanvas();
  };

  const stopDrawing = () => {
    if (!maskCanvasRef.current) return;
    setIsDrawing(false);
    setIsErasing(false);
    const maskCtx = maskCanvasRef.current.getContext("2d")!;
    if (!isErasing) maskCtx.closePath();
    drawImageWithMask();
  };

  const eraseMaskAtPosition = (x: number, y: number) => {
    const eraseRadius = brushSize / 2;
    setPaths((prevPaths) =>
      prevPaths
        .map((path) => {
          if (path.color !== "white") return path;
          const filteredPoints = path.points.filter((point) => {
            const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            return distance > eraseRadius;
          });
          return { ...path, points: filteredPoints };
        })
        .filter((path) => path.points.length > 0)
    );
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";

    paths.forEach((path) => {
      if (path.points.length === 0) return;
      maskCtx.beginPath();
      maskCtx.strokeStyle = path.color;
      maskCtx.lineWidth = path.width;

      if (path.points.length === 1) {
        const point = path.points[0];
        maskCtx.arc(point.x, point.y, path.width / 2, 0, Math.PI * 2);
        maskCtx.fillStyle = path.color;
        maskCtx.fill();
      } else {
        maskCtx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 0; i < path.points.length - 1; i++) {
          const xc = (path.points[i].x + path.points[i + 1].x) / 2;
          const yc = (path.points[i].y + path.points[i + 1].y) / 2;
          maskCtx.quadraticCurveTo(path.points[i].x, path.points[i].y, xc, yc);
        }
        maskCtx.stroke();
      }
    });
  };

  const getCombinedImage = async (): Promise<string> => {
    if (!image || !maskCanvasRef.current) throw new Error("Không tìm thấy ảnh hoặc mask");

    const maskCanvasBW = document.createElement("canvas");
    maskCanvasBW.width = image.width;
    maskCanvasBW.height = image.height;
    const maskCtxBW = maskCanvasBW.getContext("2d")!;

    maskCtxBW.fillStyle = "black";
    maskCtxBW.fillRect(0, 0, maskCanvasBW.width, maskCanvasBW.height);
    maskCtxBW.drawImage(maskCanvasRef.current, 0, 0);

    const result = maskCanvasBW.toDataURL("image/png");
    maskCanvasBW.remove();
    return result;
  };

  const convertImageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
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
      img.onerror = () => reject(new Error("Không thể tải ảnh sản phẩm"));
      img.src = url;
    });
  };

  const addWatermark = async (imageData: string): Promise<string> => {
    const img = new Image();
    img.src = imageData;
    await new Promise((resolve) => (img.onload = resolve));
    const logo = new Image();
    logo.src = "/logo.png";
    await new Promise((resolve) => (logo.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const logoSize = img.width * 0.2;
    ctx.drawImage(logo, img.width - logoSize - 10, img.height - logoSize - 10, logoSize, logoSize);
    const result = canvas.toDataURL("image/png");
    canvas.remove();
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !selectedProduct || paths.length === 0) {
      setError("Vui lòng tải ảnh, chọn sản phẩm và vẽ mask trước khi xử lý");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const canvas = mainCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "gray";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";
      ctx.fillText("Đang xử lý...", canvas.width / 2 - 100, canvas.height / 2);
    }

    try {
      const maskImage = await getCombinedImage();
      let finalImageData = resizedImageData;
      let finalMaskData = maskImage;

      const productImagePath = products[selectedProduct as keyof typeof products];
      const productImageBase64 = await convertImageToBase64(productImagePath);

      const resultUrl = await processInpainting(finalImageData, productImageBase64, finalMaskData);
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      const watermarkedImageUrl = await addWatermark(proxiedUrl);
      setInpaintedImage(watermarkedImageUrl);

      const img = new Image();
      img.onload = () => {
        if (mainCanvasRef.current) {
          mainCanvasRef.current.width = img.width;
          mainCanvasRef.current.height = img.height;
          mainCanvasRef.current.getContext("2d")!.drawImage(img, 0, 0);
        }
      };
      img.src = watermarkedImageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setOriginalImageData("");
    setResizedImageData("");
    setPaths([]);
    setInpaintedImage(null);
    setError(null);
    setSelectedProduct(null);
    drawPlaceholder(mainCanvasRef.current);
  };

  return (
    <div className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">CaslaQuartz AI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8 flex-grow">
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
            <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px] w-full overflow-hidden">
              <canvas ref={mainCanvasRef} className="max-w-full max-h-full object-contain" />
              {!image && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Upload className="h-12 w-12 text-blue-900/50 mb-4" />
                  <p className="text-blue-900/70 text-lg">Tải ảnh lên để bắt đầu</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 bg-blue-900 hover:bg-blue-800 text-white"
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

            {image && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh mới
                  </Button>
                  <Button
                    onClick={() => setPaths([]) && drawImageWithMask()}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Xóa mask
                  </Button>
                  <Dialog open={isMaskModalOpen} onOpenChange={setIsMaskModalOpen}>
                    <DialogContent className="max-w-[100vw] max-h-[100vh] overflow-auto p-6 bg-white rounded-lg">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-blue-900">
                          Vẽ Mask
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                          Dùng chuột trái để vẽ mask, chuột phải để xóa mask.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-6">
                        <div className="canvas-container relative bg-gray-100 rounded-md border border-gray-300 overflow-auto">
                          {resizedImageData && (
                            <img
                              src={resizedImageData}
                              alt="Uploaded"
                              className="max-w-full max-h-[90vh]"
                            />
                          )}
                          <canvas
                            ref={mainCanvasRef}
                            className="absolute top-0 left-0 max-w-full max-h-[90vh] cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        </div>
                        <div className="flex justify-between items-center flex-col md:flex-row gap-3">
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-blue-900">
                              Kích thước: {brushSize}px
                            </label>
                            <Slider
                              value={[brushSize]}
                              min={1}
                              max={50}
                              step={1}
                              onValueChange={(value) => setBrushSize(value[0])}
                              className="w-32"
                            />
                            <Button
                              onClick={() => setEraseMode(!eraseMode)}
                              className={`${
                                eraseMode
                                  ? "bg-red-500 hover:bg-red-600"
                                  : "bg-blue-900 hover:bg-blue-800"
                              } text-white`}
                            >
                              {eraseMode ? "Chế độ Xóa" : "Chế độ Vẽ"}
                            </Button>
                          </div>
                          <Button
                            onClick={() => {
                              setIsMaskModalOpen(false);
                              drawImageWithMask();
                            }}
                            className="bg-blue-900 hover:bg-blue-800 text-white"
                          >
                            Xác nhận
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={handleReset}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm lại từ đầu
                  </Button>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!image || isProcessing || !selectedProduct}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
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

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </Card>

          <div className="lg:hidden">
            <Card className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-medium text-blue-900">CaslaQuartz Menu</h2>
              <ScrollArea className="h-[300px] w-full rounded-md border border-gray-200 bg-gray-50 p-4">
                {Object.entries(productGroups).map(([groupName, products]) => (
                  <div key={groupName} className="flex flex-col gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-blue-900 uppercase">{groupName}</h3>
                    {products.map((product) => (
                      <Button
                        key={product.name}
                        onClick={() => setSelectedProduct(product.name)}
                        className={`w-full text-left justify-start py-2 px-4 text-sm ${
                          selectedProduct === product.name
                            ? "bg-blue-900 text-white hover:bg-blue-800"
                            : "bg-white text-blue-900 hover:bg-gray-100"
                        }`}
                      >
                        {product.name}
                      </Button>
                    ))}
                  </div>
                ))}
              </ScrollArea>
              {image && (
                <Button
                  onClick={handleSubmit}
                  disabled={!image || isProcessing || !selectedProduct}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Xử lý ảnh
                </Button>
              )}
            </Card>
          </div>
        </div>

        <div className="hidden lg:flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-md h-full">
            <h2 className="text-xl font-medium text-blue-900">CaslaQuartz Menu</h2>
            <ScrollArea className="h-[600px] w-full rounded-md border border-gray-200 bg-gray-50 p-4">
              {Object.entries(productGroups).map(([groupName, products]) => (
                <div key={groupName} className="flex flex-col gap-2 mb-4">
                  <h3 className="text-sm font-semibold text-blue-900 uppercase">{groupName}</h3>
                  {products.map((product) => (
                    <Button
                      key={product.name}
                      onClick={() => setSelectedProduct(product.name)}
                      className={`w-full text-left justify-start py-2 px-4 text-sm ${
                        selectedProduct === product.name
                          ? "bg-blue-900 text-white hover:bg-blue-800"
                          : "bg-white text-blue-900 hover:bg-gray-100"
                      }`}
                    >
                      {product.name}
                    </Button>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}

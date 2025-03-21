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
import { fabric } from "fabric";

const productGroups = {
  STANDARD: [
    { name: "C1012 - Glacier White", quote: "Glacier với nền trắng..." },
    // Các sản phẩm khác
  ],
  // Các nhóm khác
};

const products = Object.fromEntries(
  Object.values(productGroups)
    .flat()
    .map((item) => [item.name, `/product_images/${item.name.split(" - ")[0]}.jpg`])
);

export default function ImageInpaintingApp() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [originalImageData, setOriginalImageData] = useState<string>("");
  const [brushSize, setBrushSize] = useState(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isMaskModalOpen, setIsMaskModalOpen] = useState(false);

  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { processInpainting } = useInpainting();

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
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new window.Image();
      img.onload = async () => {
        try {
          setImage(img);
          setOriginalImageData(event.target?.result as string);
          setIsMaskModalOpen(true); // Mở modal ngay sau khi có ảnh gốc
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

  const initializeFabricCanvas = () => {
    if (!modalCanvasRef.current || !originalImageData) return;

    // Tạo Fabric Canvas
    const canvas = new fabric.Canvas(modalCanvasRef.current, {
      isDrawingMode: true,
    });
    fabricCanvasRef.current = canvas;

    // Tải ảnh gốc vào canvas
    const img = new Image();
    img.src = originalImageData;
    img.onload = () => {
      // Điều chỉnh kích thước canvas dựa trên ảnh và màn hình
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.6;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        width = maxWidth;
        height = (img.height / img.width) * width;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = (img.width / img.height) * height;
      }

      canvas.setWidth(width);
      canvas.setHeight(height);

      fabric.Image.fromURL(originalImageData, (fabricImg) => {
        fabricImg.scaleToWidth(width);
        fabricImg.scaleToHeight(height);
        canvas.setBackgroundImage(fabricImg, canvas.renderAll.bind(canvas));
      }, { crossOrigin: "anonymous" });

      // Cài đặt brush
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = "white";
    };
    img.onerror = () => {
      setError("Không thể tải ảnh vào canvas trong modal");
    };
  };

  useEffect(() => {
    if (isMaskModalOpen && modalCanvasRef.current && originalImageData) {
      initializeFabricCanvas();
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [isMaskModalOpen, originalImageData, brushSize]);

  const drawImageWithMask = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas || !fabricCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const maskData = fabricCanvasRef.current!.toDataURL({
        format: "png",
        multiplier: 1,
      });
      const maskImg = new Image();
      maskImg.onload = () => {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(maskImg, 0, 0);
        ctx.globalAlpha = 1.0;
      };
      maskImg.src = maskData;
    };
    img.src = originalImageData;
  };

  const getMaskImage = () => {
    if (!fabricCanvasRef.current) return null;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = fabricCanvasRef.current.width;
    maskCanvas.height = fabricCanvasRef.current.height;
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const maskData = fabricCanvasRef.current.toDataURL({ format: "png" });
    const maskImg = new Image();
    maskImg.onload = () => {
      maskCtx.drawImage(maskImg, 0, 0);
      const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const isWhite =
          imageData.data[i] > 0 || imageData.data[i + 1] > 0 || imageData.data[i + 2] > 0;
        imageData.data[i] = isWhite ? 255 : 0;
        imageData.data[i + 1] = isWhite ? 255 : 0;
        imageData.data[i + 2] = isWhite ? 255 : 0;
        imageData.data[i + 3] = 255;
      }
      maskCtx.putImageData(imageData, 0, 0);
    };
    maskImg.src = maskData;
    const maskUrl = maskCanvas.toDataURL("image/png");
    maskCanvas.remove();
    return maskUrl;
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
    if (!image || !selectedProduct || !fabricCanvasRef.current) {
      setError("Vui lòng tải ảnh, chọn sản phẩm và vẽ mask trước khi xử lý");
      return;
    }

    setIsProcessing(true);
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
      const maskImage = getMaskImage();
      const productImageBase64 = await convertImageToBase64(products[selectedProduct]);
      const resultUrl = await processInpainting(originalImageData, productImageBase64, maskImage!);
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      const watermarkedImageUrl = await addWatermark(proxiedUrl);

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
    setError(null);
    setSelectedProduct(null);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }
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
                    onClick={() => {
                      if (fabricCanvasRef.current) {
                        fabricCanvasRef.current.clear();
                        const img = new Image();
                        img.src = originalImageData;
                        img.onload = () => {
                          const maxWidth = window.innerWidth * 0.8;
                          const maxHeight = window.innerHeight * 0.6;
                          let width = img.width;
                          let height = img.height;

                          if (width > maxWidth) {
                            width = maxWidth;
                            height = (img.height / img.width) * width;
                          }
                          if (height > maxHeight) {
                            height = maxHeight;
                            width = (img.width / img.height) * height;
                          }

                          fabricCanvasRef.current!.setWidth(width);
                          fabricCanvasRef.current!.setHeight(height);

                          fabric.Image.fromURL(originalImageData, (fabricImg) => {
                            fabricImg.scaleToWidth(width);
                            fabricImg.scaleToHeight(height);
                            fabricCanvasRef.current!.setBackgroundImage(
                              fabricImg,
                              fabricCanvasRef.current!.renderAll.bind(fabricCanvasRef.current)
                            );
                          }, { crossOrigin: "anonymous" });
                        };
                        drawImageWithMask();
                      }
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Xóa mask
                  </Button>
                  <Button
                    onClick={() => setIsMaskModalOpen(true)}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Vẽ Mask
                  </Button>
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

            <Dialog open={isMaskModalOpen} onOpenChange={setIsMaskModalOpen}>
              <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto p-6 bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-blue-800">Vẽ Mask</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Dùng chuột để vẽ mask (màu trắng) lên ảnh.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-6">
                  <div className="canvas-container relative bg-gray-100 rounded-md border border-gray-300 overflow-auto">
                    <canvas ref={modalCanvasRef} className="w-full h-auto" />
                  </div>
                  <div className="flex justify-between items-center flex-col md:flex-row gap-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-blue-900">
                        Kích thước bút: {brushSize}px
                      </label>
                      <Slider
                        value={[brushSize]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(value) => {
                          setBrushSize(value[0]);
                          if (fabricCanvasRef.current) {
                            fabricCanvasRef.current.freeDrawingBrush.width = value[0];
                          }
                        }}
                        className="w-32"
                      />
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

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Download, Paintbrush, Loader2, Info, Send, RefreshCw, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInpainting } from "@/hooks/useInpainting";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Định nghĩa kiểu Path cho các đường vẽ
type Path = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

// Danh sách sản phẩm và câu quote (giữ nguyên như mã gốc)
const productGroups = {
  "STANDARD": [
    { name: "C1012 - Glacier White", quote: "Glacier với nền trắng kết hợp với những hạt thạch anh kích thước nhỏ..." },
    { name: "C1026 - Polar", quote: "Polar với nền trắng kết hợp với những hạt thạch anh kích thước lớn..." },
    { name: "C1005 - Milky White", quote: "Milky White với màu trắng tinh khiết, nhẹ nhàng..." },
    { name: "C3168 - Silver Wave", quote: "Silver Wave chủ đạo với nền trắng, hòa cùng đó là những ánh bạc..." },
    { name: "C3269 - Ash Grey", quote: "Ash Grey với màu nền tông xám, kết hợp với bond trầm..." },
  ],
  "DELUXE": [
    { name: "C2103 - Onyx Carrara", quote: "Onyx Carrara lấy cảm hứng từ dòng đá cẩm thạch Carrara..." },
    { name: "C2104 - Massa", quote: "Massa được lấy cảm hứng từ dòng đá cẩm thạch Carrara..." },
    { name: "C3105 - Casla Cloudy", quote: "Casla Cloudy với tông xanh nhẹ nhàng..." },
    { name: "C3146 - Casla Nova", quote: "Casla Nova với tông nâu vàng của những áng mây..." },
    { name: "C2240 - Marquin", quote: "Marquin nổi bật với nền đen điểm cùng bond màu trắng..." },
    { name: "C2262 - Concrete (Honed)", quote: "Concrete được lấy cảm hứng từ bề mặt giả xi măng..." },
    { name: "C3311 - Calacatta Sky", quote: "Calacatta Sky với những đường vân mảnh đậm nhạt xen lẫn..." },
    { name: "C3346 - Massimo", quote: "Massimo lấy vẻ ngoài của bê tông làm chủ đạo..." },
    { name: "C4143 - Mario", quote: "Mario mang tông màu ấm nâu vàng..." },
    { name: "C4145 - Marina", quote: "Marina mang tông màu xám lạnh..." },
    { name: "C5225 - Amber", quote: "Amber khác lạ với các đường vân màu nâu đậm..." },
    { name: "C5240 - Spring", quote: "Spring lấy cảm hứng từ các yếu tố tương phản sáng tối..." },
  ],
  "LUXURY": [
    { name: "C1102 - Super White", quote: "Super White mang tông màu trắng sáng đặc biệt..." },
    { name: "C1205 - Casla Everest", quote: "Casla Everest được lấy cảm hứng từ ngọn núi Everest..." },
    { name: "C4246 - Casla Mystery", quote: "Casla Mystery trừu tượng trong khối kết cụ thể..." },
    { name: "C4254 - Mystery Gold", quote: "Mystery Gold, với những đường vân mảnh mai..." },
    { name: "C4326 - Statuario", quote: "Statuario Silver tái hiện hình ảnh những dòng sông..." },
    { name: "C4348 - Montana", quote: "Montana để lại dấu ấn đậm nét với những mảng vân mây..." },
    { name: "C5231 - Andes", quote: "Andes với những đường vân uyển chuyển, lấp lánh..." },
    { name: "C5242 - Rosa", quote: "Rosa được lấy cảm hứng từ những hạt mưa hiền hòa..." },
    { name: "C5250 - Autumn", quote: "Autumn với những đường vân xám tinh tế..." },
    { name: "C4111 - Aurora", quote: "Aurora là một thiết kế độc đáo lấy cảm hứng từ vẻ đẹp hùng vĩ..." },
    { name: "C4202 - Calacatta Gold", quote: "Calacatta Gold được lấy cảm hứng từ dòng đá cẩm thạch..." },
    { name: "C4204 - Calacatta Classic", quote: "Calacatta Classic được lấy cảm hứng từ dòng đá cẩm thạch..." },
    { name: "C4211 - Calacatta Supreme", quote: "Calacatta Supreme nổi bật với những đường vân xám tối..." },
    { name: "C4221 - Athena", quote: "Athena lấy cảm hứng từ dòng đá cẩm thạch Calacatta..." },
    { name: "C4222 - Lagoon", quote: "Lagoon nổi bật trên nền trắng tinh khiết giống đá cẩm thạch..." },
    { name: "C4238 - Channel", quote: "Channel lấy cảm hứng từ vẻ đẹp nguyên bản của đá thạch anh..." },
    { name: "C4250 - Elio", quote: "Elio nổi bật với những đường vân mạnh mẽ..." },
    { name: "C4342 - Casla Eternal", quote: "Eternal mô phỏng dòng đá cẩm thạch kinh điển..." },
    { name: "C4345 - Oro", quote: "Oro mô phỏng dòng đá cẩm thạch đẳng cấp..." },
    { name: "C4346 - Luxe", quote: "Luxe mô phỏng dòng cẩm thạch nổi tiếng..." },
    { name: "C5340 - Sonata", quote: "Sonata với những đường vân xám mềm mại..." },
    { name: "C5445 - Muse", quote: "Muse tạo nên sự hòa quyện hài hòa..." },
  ],
  "SUPER LUXURY": [
    { name: "C4147 - Mont", quote: "Mont với những đường vân dày mềm mại..." },
    { name: "C4149 - River", quote: "River nổi bật với các dải màu xám trên nền trắng..." },
    { name: "C4255 - Calacatta Extra", quote: "Calacatta Extra nổi bật với những đường vân xám tối..." },
    { name: "C5366 - Skiron", quote: "Skiron tái hiện hình ảnh những con sóng biển..." },
  ],
};

const products = Object.fromEntries(
  Object.values(productGroups).flat().map((item) => [
    item.name,
    `/product_images/${item.name.split(" - ")[0]}.jpg`,
  ])
);

// Vô hiệu hóa prerendering tĩnh
export const dynamic = "force-dynamic";

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
  const [isBrushSizeOpen, setIsBrushSizeOpen] = useState(false);

  // Refs
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { processInpainting } = useInpainting();

  // useEffect khởi tạo canvas
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
    return () => {
      if (maskCanvasRef.current) maskCanvasRef.current.remove();
    };
  }, []);

  const resizeImage = (img: HTMLImageElement, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!img || maxWidth <= 0) {
        reject(new Error("Ảnh hoặc maxWidth không hợp lệ"));
        return;
      }
      const aspectRatio = img.width / img.height;
      const canvasWidth = Math.min(img.width, maxWidth);
      const canvasHeight = canvasWidth / aspectRatio;
      if (canvasHeight <= 0) {
        reject(new Error("Tỷ lệ ảnh không hợp lệ"));
        return;
      }

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;
      const ctx = tempCanvas.getContext("2d");

      if (!ctx) {
        tempCanvas.remove();
        reject(new Error("Không thể tạo context cho canvas tạm"));
        return;
      }

      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      const result = tempCanvas.toDataURL("image/png");
      tempCanvas.remove();
      resolve(result);
    });
  };

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
        try {
          const maxWidth = inputCanvasRef.current?.parentElement?.clientWidth || 500;
          const resizedData = await resizeImage(img, maxWidth);
          setResizedImageData(resizedData);
          setImage(img);
          drawImageOnCanvas(img, resizedData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không thể xử lý ảnh");
        }
      };
      img.onerror = () => setError("Không thể tải ảnh");
      img.src = event.target?.result as string;
      img.crossOrigin = "anonymous";
    };
    reader.readAsDataURL(file);
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
    if (canvasWidth <= 0 || canvasHeight <= 0) return;

    inputCanvas.width = canvasWidth;
    inputCanvas.height = canvasHeight;
    outputCanvas.width = canvasWidth;
    outputCanvas.height = canvasHeight;
    maskCanvas.width = canvasWidth;
    maskCanvas.height = canvasHeight;

    const inputCtx = inputCanvas.getContext("2d");
    if (inputCtx) {
      const resizedImg = new Image();
      resizedImg.onload = () => inputCtx.drawImage(resizedImg, 0, 0, canvasWidth, canvasHeight);
      resizedImg.onerror = () => setError("Không thể vẽ ảnh đã resize");
      resizedImg.src = resizedData;
    }

    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawInformationOnOutputCanvas();
  };

  const drawInformationOnOutputCanvas = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1E3A8A";
    ctx.font = '16px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = "center";
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!inputCanvasRef.current || !maskCanvasRef.current) return;
    setIsDrawing(true);
    setIsErasing(e.button === 2);
    setActiveCanvas("canvas1");

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!maskCtx) return;

    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";
    maskCtx.strokeStyle = isErasing ? "black" : "white";
    maskCtx.lineWidth = brushSize;

    maskCtx.beginPath();
    maskCtx.moveTo(x, y);

    setPaths((prev) => [
      ...prev,
      { points: [{ x, y }], color: isErasing ? "black" : "white", width: brushSize },
    ]);

    updateMaskPreview();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !inputCanvasRef.current || !maskCanvasRef.current) return;

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!maskCtx) return;

    const currentPath = paths[paths.length - 1];
    const lastPoint = currentPath.points[currentPath.points.length - 1];

    maskCtx.quadraticCurveTo(lastPoint.x, lastPoint.y, (x + lastPoint.x) / 2, (y + lastPoint.y) / 2);
    maskCtx.stroke();
    maskCtx.beginPath();
    maskCtx.moveTo((x + lastPoint.x) / 2, (y + lastPoint.y) / 2);

    setPaths((prev) => {
      const newPaths = [...prev];
      const currentPath = newPaths[newPaths.length - 1];
      currentPath.points.push({ x, y });
      return newPaths;
    });

    updateMaskPreview();
  };

  const stopDrawing = () => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!maskCtx) return;

    setIsDrawing(false);
    setIsErasing(false);

    maskCtx.closePath();
    updateMaskPreview();
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!inputCanvasRef.current || !maskCanvasRef.current) return;
    setIsDrawing(true);
    setActiveCanvas("canvas1");

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!maskCtx) return;

    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";
    maskCtx.strokeStyle = "white";
    maskCtx.lineWidth = brushSize;

    maskCtx.beginPath();
    maskCtx.moveTo(x, y);

    setPaths((prev) => [
      ...prev,
      { points: [{ x, y }], color: "white", width: brushSize },
    ]);

    updateMaskPreview();
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !inputCanvasRef.current || !maskCanvasRef.current) return;

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!maskCtx) return;

    const currentPath = paths[paths.length - 1];
    const lastPoint = currentPath.points[currentPath.points.length - 1];

    maskCtx.quadraticCurveTo(lastPoint.x, lastPoint.y, (x + lastPoint.x) / 2, (y + lastPoint.y) / 2);
    maskCtx.stroke();
    maskCtx.beginPath();
    maskCtx.moveTo((x + lastPoint.x) / 2, (y + lastPoint.y) / 2);

    setPaths((prev) => {
      const newPaths = [...prev];
      const currentPath = newPaths[newPaths.length - 1];
      currentPath.points.push({ x, y });
      return newPaths;
    });

    updateMaskPreview();
  };

  const stopDrawingTouch = () => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!maskCtx) return;

    setIsDrawing(false);
    maskCtx.closePath();
    updateMaskPreview();
  };

  const redrawCanvas = () => {
    const inputCanvas = inputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!inputCanvas || !maskCanvas || !image) return;

    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

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

    updateMaskPreview();
  };

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
      inputCtx.drawImage(maskCanvas, 0, 0, inputCanvas.width, inputCanvas.height);
      inputCtx.globalAlpha = 1.0;
    };
    resizedImg.onerror = () => setError("Không thể cập nhật preview mask");
    resizedImg.src = resizedImageData;
  };

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

  const handleProductSelect = (productName: string) => {
    if (!products[productName as keyof typeof products]) {
      setError("Sản phẩm không hợp lệ");
      return;
    }
    setSelectedProduct(productName);
    setError(null);
  };

  const saveCanvasState = () => {
    const canvas = inputCanvasRef.current;
    if (!canvas) {
      setError("Không thể lưu canvas vì canvas không tồn tại");
      return;
    }
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "canvas-state.png";
    link.href = dataURL;
    link.click();
    link.remove();
  };

  const handleReloadImage = () => {
    setImage(null);
    setPaths([]);
    setInpaintedImage(null);
    setError(null);
    setResizedImageData("");
    setActiveCanvas("canvas1");
    fileInputRef.current?.click();
  };

  const convertImageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không thể tạo context cho canvas"));
          return;
        }
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
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageData;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Không thể tải ảnh từ ${imageData}`));
      });

      console.log("Đã tải ảnh để đóng dấu:", img.width, img.height);

      const logo = new Image();
      logo.src = "/logo.png";
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = () => reject(new Error("Không thể tải logo watermark từ /logo.png"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Không thể tạo context cho canvas");

      ctx.drawImage(img, 0, 0);
      const logoSize = img.width * 0.2;
      const logoX = img.width - logoSize - 10;
      const logoY = img.height - logoSize - 10;
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

      const result = canvas.toDataURL("image/png");
      canvas.remove();
      return result;
    } catch (error) {
      console.error("Error in addWatermark:", error);
      throw error instanceof Error ? error : new Error("Unknown error in addWatermark");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image || !selectedProduct || paths.length === 0) {
      setError("Vui lòng tải ảnh, chọn sản phẩm và vẽ mask trước khi xử lý");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setActiveCanvas("canvas2");

      const maskImage = await getCombinedImage();
      const productImagePath = products[selectedProduct as keyof typeof products];
      const productImageBase64 = await convertImageToBase64(productImagePath);
      const resultUrl = await processInpainting(resizedImageData, productImageBase64, maskImage);
      console.log("Result URL from TensorArt:", resultUrl);

      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      console.log("Proxied URL:", proxiedUrl);

      const watermarkedImageUrl = await addWatermark(proxiedUrl);
      setInpaintedImage(watermarkedImageUrl);

      const img = new Image();
      img.onload = () => {
        console.log("Image loaded successfully:", img.width, img.height);
        drawResultOnCanvas(img);
      };
      img.onerror = () => {
        console.error("Failed to load watermarked image:", watermarkedImageUrl);
        setError("Không thể tải ảnh kết quả sau khi thêm watermark");
      };
      img.src = watermarkedImageUrl;
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định");
    } finally {
      setIsProcessing(false);
    }
  };

  const drawResultOnCanvas = (img: HTMLImageElement) => {
    const outputCanvas = outputCanvasRef.current;
    const inputCanvas = inputCanvasRef.current;
    if (!outputCanvas || !inputCanvas) {
      console.error("Canvas refs are null");
      setError("Canvas không khả dụng");
      return;
    }
    const ctx = outputCanvas.getContext("2d");
    const inputCtx = inputCanvas.getContext("2d");
    if (!ctx || !inputCtx) {
      console.error("Canvas context is null");
      setError("Không thể lấy context của canvas");
      return;
    }

    if (img.width === 0 || img.height === 0) {
      console.error("Image has invalid dimensions:", img.width, img.height);
      setError("Kích thước ảnh không hợp lệ");
      return;
    }

    const maxWidth = outputCanvas.parentElement?.clientWidth || 500;
    const aspectRatio = img.width / img.height;
    const canvasWidth = Math.min(img.width, maxWidth);
    const canvasHeight = canvasWidth / aspectRatio;

    outputCanvas.width = canvasWidth;
    outputCanvas.height = canvasHeight;
    inputCanvas.width = canvasWidth;
    inputCanvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    inputCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    inputCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    console.log("Image drawn on canvas with size:", canvasWidth, canvasHeight);
  };

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
    if (!maskCtxBW) {
      maskCanvasBW.remove();
      throw new Error("Không thể tạo context cho mask BW");
    }

    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const maskData = maskImageData.data;

    for (let i = 0; i < maskData.length; i += 4) {
      const maskValue = maskData[i];
      maskCtxBW.fillStyle = maskValue > 0 ? "white" : "black";
      maskCtxBW.fillRect((i / 4) % inputCanvas.width, Math.floor((i / 4) / inputCanvas.width), 1, 1);
    }

    const result = maskCanvasBW.toDataURL("image/png");
    maskCanvasBW.remove();
    return result;
  };

  const downloadImage = () => {
    if (!inpaintedImage) {
      setError("Không có ảnh kết quả để tải");
      return;
    }
    const link = document.createElement("a");
    link.download = "ket-qua-xu-ly.png";
    link.href = inpaintedImage;
    link.click();
    link.remove();
  };

  const getProductQuote = () => {
    if (!selectedProduct) return "Vui lòng chọn một sản phẩm để xem thông tin.";
    const allProducts = Object.values(productGroups).flat();
    const product = allProducts.find((p) => p.name === selectedProduct);
    return product ? product.quote : "Không tìm thấy thông tin sản phẩm.";
  };

  return (
    <div className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col animate-fade-in">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800 transition-all duration-300 hover:text-blue-900">
        CaslaQuartz AI
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[5fr_3fr] gap-8 flex-grow">
        {/* Cột 1: Tải ảnh & Kết quả xử lý */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
            {/* Màn hình nhỏ: Chỉ hiển thị 1 canvas */}
            <div className="lg:hidden">
              <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px]">
                <canvas
                  ref={inputCanvasRef}
                  className="max-w-full cursor-crosshair"
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
                    <Upload className="h-12 w-12 text-blue-900/50 mb-4" />
                    <p className="text-blue-900/70 text-lg">Tải ảnh lên để bắt đầu</p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 bg-blue-900 hover:bg-blue-800 text-white pointer-events-auto"
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
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <Loader2 className="h-12 w-12 text-blue-900 animate-spin mb-4" />
                    <p className="text-blue-900/70 text-lg">Đang xử lý ảnh...</p>
                    <div className="mt-4 text-center">
                      <p className="text-blue-900 font-medium">Ý nghĩa sản phẩm</p>
                      <p className="text-sm text-gray-700">{getProductQuote()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút xử lý phần vẽ mask (dạng icon) */}
              {image && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={handleReloadImage}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() => setIsBrushSizeOpen(true)}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Paintbrush className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={saveCanvasState}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Save className="h-5 w-5" />
                  </Button>
                  {isBrushSizeOpen && (
                    <div className="absolute z-10 bg-white p-4 rounded-md shadow-md">
                      <label className="text-sm font-medium text-blue-900">
                        Kích thước: {brushSize}px
                      </label>
                      <Slider
                        value={[brushSize]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(value) => setBrushSize(value[0])}
                        className="mt-1"
                      />
                      <Button
                        onClick={() => setIsBrushSizeOpen(false)}
                        className="mt-2"
                      >
                        Đóng
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Màn hình lớn: Hiển thị 2 canvas cạnh nhau */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Canvas */}
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-medium text-blue-900">Tải Ảnh & Chọn Vật Thể</h2>
                <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px]">
                  <canvas
                    ref={inputCanvasRef}
                    className="max-w-full cursor-crosshair"
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
                      <Upload className="h-12 w-12 text-blue-900/50 mb-4" />
                      <p className="text-blue-900/70 text-lg">Tải ảnh lên để bắt đầu</p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 bg-blue-900 hover:bg-blue-800 text-white pointer-events-auto"
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
              </div>

              {/* Output Canvas */}
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-medium text-blue-900">Kết Quả Xử Lý</h2>
                <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px]">
                  <canvas ref={outputCanvasRef} style={{ display: activeCanvas === "canvas2" ? "block" : "none" }} />
                  {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                      <Loader2 className="h-12 w-12 text-blue-900 animate-spin mb-4" />
                      <p className="text-blue-900/70 text-lg">Đang xử lý ảnh...</p>
                    </div>
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
              </div>
            </div>

            {/* Các nút điều khiển (màn hình lớn) */}
            <div className="hidden lg:block">
              {image && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-gray-200 hover:bg-gray-300 text-blue-900">...</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Tải ảnh mới
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleReloadImage}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Xóa mask
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={saveCanvasState}>
                          <Save className="h-4 w-4 mr-2" />
                          Lưu ảnh
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Tabs defaultValue="brush" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-blue-50 rounded-md">
                      <TabsTrigger
                        value="brush"
                        className="data-[state=active]:bg-blue-900 data-[state=active]:text-white hover:bg-blue-100 transition-all duration-200"
                      >
                        <Paintbrush className="h-4 w-4 mr-1" />
                        Bút vẽ
                      </TabsTrigger>
                      <TabsTrigger
                        value="info"
                        className="data-[state=active]:bg-blue-900 data-[state=active]:text-white hover:bg-blue-100 transition-all duration-200"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Hướng dẫn
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="brush" className="space-y-2 mt-2">
                      <Button onClick={() => setIsBrushSizeOpen(true)}>Kích thước</Button>
                      {isBrushSizeOpen && (
                        <div className="absolute z-10 bg-white p-4 rounded-md shadow-md">
                          <label className="text-sm font-medium text-blue-900">
                            Kích thước: {brushSize}px
                          </label>
                          <Slider
                            value={[brushSize]}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(value) => setBrushSize(value[0])}
                            className="mt-1"
                          />
                          <Button
                            onClick={() => setIsBrushSizeOpen(false)}
                            className="mt-2"
                          >
                            Đóng
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="info" className="space-y-2 mt-2">
                      <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-900">
                        <p>1. Chọn nhóm sản phẩm và sản phẩm từ cột bên phải.</p>
                        <p>2. Vẽ mặt nạ lên vùng cần xử lý (chuột trái để vẽ, chuột phải để tẩy, nhấp để xóa).</p>
                        <p>3. Nhấn "Xử lý ảnh" để tạo kết quả.</p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={!image || isProcessing || !selectedProduct}
                      className="flex-1 bg-blue-900 hover:bg-blue-800 text-white"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Xử lý ảnh
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-2 p-4">
                <AlertTitle className="text-sm font-medium">Lỗi</AlertTitle>
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </Card>

          {/* CaslaQuartz Menu (màn hình nhỏ) */}
          <div className="lg:hidden">
            <Card className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-medium text-blue-900">CaslaQuartz Menu</h2>
              <ScrollArea className="h-[300px] w-full rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-6">
                  {Object.entries(productGroups).map(([groupName, products]) => (
                    <div key={groupName} className="flex flex-col gap-2">
                      <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide border-b border-gray-300 pb-1">
                        {groupName}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {products.map((product) => (
                          <Button
                            key={product.name}
                            onClick={() => handleProductSelect(product.name)}
                            className={`w-full text-left justify-start py-2 px-4 text-sm transition-all ${
                              selectedProduct === product.name
                                ? "bg-blue-900 text-white hover:bg-blue-800"
                                : "bg-white text-blue-900 hover:bg-gray-100"
                            }`}
                            title={product.name}
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {product.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-auto">
                <Alert className={`transition-all duration-500 ${isProcessing ? "animate-pulse bg-blue-50" : "bg-white"}`}>
                  <AlertTitle className="text-blue-900 font-medium">Ý nghĩa sản phẩm</AlertTitle>
                  <AlertDescription className="text-sm text-gray-700">
                    {getProductQuote()}
                  </AlertDescription>
                </Alert>
              </div>
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
              {inpaintedImage && (
                <Button
                  onClick={downloadImage}
                  className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Tải kết quả
                </Button>
              )}
            </Card>
          </div>
        </div>

        {/* Cột 2: CaslaQuartz Menu (màn hình lớn) */}
        <div className="hidden lg:flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-md h-full">
            <h2 className="text-xl font-medium text-blue-900">CaslaQuartz Menu</h2>
            <ScrollArea className="h-[600px] w-full rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-6">
                {Object.entries(productGroups).map(([groupName, products]) => (
                  <div key={groupName} className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide border-b border-gray-300 pb-1">
                      {groupName}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {products.map((product) => (
                        <Button
                          key={product.name}
                          onClick={() => handleProductSelect(product.name)}
                          className={`w-full text-left justify-start py-2 px-4 text-sm transition-all ${
                            selectedProduct === product.name
                              ? "bg-blue-900 text-white hover:bg-blue-800"
                              : "bg-white text-blue-900 hover:bg-gray-100"
                          }`}
                          title={product.name}
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {product.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-auto">
              <Alert className={`transition-all duration-500 ${isProcessing ? "animate-pulse bg-blue-50" : "bg-white"}`}>
                <AlertTitle className="text-blue-900 font-medium">Ý nghĩa sản phẩm</AlertTitle>
                <AlertDescription className="text-sm text-gray-700">
                  {getProductQuote()}
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </div>
      </div>

      <footer className="mt-12 py-4 text-center text-sm text-blue-900/70">
        <p>Liên hệ: support@caslaquartz.com | Hotline: 1234-567-890</p>
        <p>© 2025 CaslaQuartz. All rights reserved.</p>
      </footer>
    </div>
  );
}

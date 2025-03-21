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
    { name: "C1012 - Glacier White", quote: "Glacier với nền trắng kết hợp với những hạt thạch anh kích thước nhỏ, kết hợp với ánh sáng tạo ra chiều sâu cho bề mặt, độ cứng cao, bền đẹp, phù hợp với các công trình thương mại" },
    { name: "C1026 - Polar", quote: "Polar với nền trắng kết hợp với những hạt thạch anh kích thước lớn, kết hợp với ánh sáng tạo ra chiều sâu cho bề mặt, độ cứng cao, bền đẹp, phù hợp với các công trình thương mại" },
    { name: "C1005 - Milky White", quote: "Milky White với màu trắng tinh khiết, nhẹ nhàng, dễ dàng kết hợp với các đồ nội thất khác, phù hợp với phong cách tối giản" },
    { name: "C3168 - Silver Wave", quote: "Silver Wave chủ đạo với nền trắng, hòa cùng đó là những ánh bạc ngẫu hứng như những con sóng xô bờ dưới cái nắng chói chang của miền biển nhiệt đới" },
    { name: "C3269 - Ash Grey", quote: "Ash Grey với màu nền tông xám, kết hợp với bond trầm tựa như làn khói ẩn hiện trong không gian, tạo nên sự trang nhã đầy cuốn hút" },
  ],
  DELUXE: [
    { name: "C2103 - Onyx Carrara", quote: "Onyx Carrara lấy cảm hứng từ dòng đá cẩm thạch Carrara nổi tiếng của nước Ý; được thiết kế với những vân ẩn tinh tế, nhẹ nhàng trên nền đá trắng pha chút gam tối tạo không gian ấm cúng, bình yên." },
    { name: "C2104 - Massa", quote: "Massa được lấy cảm hứng từ dòng đá cẩm thạch Carrara nổi tiếng của Italy với những vân ẩn tinh tế và nhẹ nhàng tạo không gian sang trọng trên nền đá cẩm thạch trắng Carrara." },
    { name: "C3105 - Casla Cloudy", quote: "Casla Cloudy với tông xanh nhẹ nhàng, giống như tên gọi Cloudy, là bầu trời xanh với vân mây tinh tế xuất hiện ở mật độ vừa phải, tiếp nối vô tận trong một không gian khoáng đạt." },
    { name: "C3146 - Casla Nova", quote: "Casla Nova với tông nâu vàng của những áng mây nhẹ nhàng được thiết kế tự do chấm phá trên nền đá cẩm thạch trắng, tạo không gian vừa sang trọng lại ấm cúng." },
    { name: "C2240 - Marquin", quote: "Marquin nổi bật với nền đen điểm cùng bond màu trắng, hai màu sắc đối lập của bảng màu ẩn hiện đan xen nhau tạo nên sự trừu tượng trong khối kết cấu cụ thể" },
    { name: "C2262 - Concrete (Honed)", quote: "Concrete được lấy cảm hứng từ bề mặt giả xi măng, với sự pha trộn hoàn hảo giữa các gam màu xám sáng ấm áp, chuyển động vân tinh tế, là sự lựa chọn thông minh cho không gian hiện đại." },
    { name: "C3311 - Calacatta Sky", quote: "Calacatta Sky với những đường vân mảnh đậm nhạt xen lẫn nhau, nhẹ nhàng lướt trên toàn bộ bề mặt tạo sự thu hút như vào một không gian vô tận. Màu nâu xám của vân hòa cùng nền đá trắng tạo nên sự hài hòa vừa cổ điển vừa hiện đại." },
    { name: "C3346 - Massimo", quote: "Massimo lấy vẻ ngoài của bê tông làm chủ đạo, họa tiết vân đá là sự mô phỏng các trường từ vô hình trên Mặt Trời, tạo nên hiệu ứng thị giác độc đáo, thô mộc nhưng mạnh mẽ và đầy táo bạo." },
    { name: "C4143 - Mario", quote: "Mario mang tông màu ấm nâu vàng, được lấy cảm hứng từ mùa thu vàng của Levitan, tạo nét thơ mộng cho không gian bằng việc gợi liên tưởng đến cảnh sắc của hàng cây mùa đổ lá bên cạnh dòng sông đang uốn lượn." },
    { name: "C4145 - Marina", quote: "Marina mang tông màu xám lạnh, được lấy cảm hứng từ những dòng sông miền cực bắc quanh năm phủ tuyết trắng, nơi màu xanh của nước tinh khiết hòa quyện với màu trắng của tuyết tạo nên một cảnh tượng kỳ vĩ tráng lệ." },
    { name: "C5225 - Amber", quote: "Amber khác lạ với các đường vân màu nâu đậm tinh tế, kéo dài theo chiều dài tấm đá. Màu sắc ấm áp và sang trọng mang lại vẻ đẹp tự nhiên, tạo điểm nhấn như một dòng sông đang uốn lượn." },
    { name: "C5240 - Spring", quote: "Spring lấy cảm hứng từ các yếu tố tương phản sáng tối, cùng với đường vân sắc nét uyển chuyển nhấp nhô khắp bề mặt, mang lại sự cân bằng hoàn hảo, làm nổi bật vẻ hiện đại và sang trọng." },
  ],
  LUXURY: [
    { name: "C1102 - Super White", quote: "Super White mang tông màu trắng sáng đặc biệt nhờ được tạo nên từ vật liệu cao cấp, tuy đơn giản nhưng không kém phần sang trọng" },
    { name: "C1205 - Casla Everest", quote: "Casla Everest được lấy cảm hứng từ ngọn núi Everest quanh năm tuyết phủ, độc đáo với đường vân chỉ mấp mô như những đỉnh núi, điểm xuyết thêm vân rối như những đám mây hài hòa trên bề mặt màu trắng cẩm thạch sang trọng." },
    { name: "C4246 - Casla Mystery", quote: "Casla Mystery trừu tượng trong khối kết cụ thể, các đường vân mỏng manh cùng thiết kế không quá cầu kỳ, đem lại cho không gian ấm cúng, bình yên đến lạ." },
    { name: "C4254 - Mystery Gold", quote: "Mystery Gold, với những đường vân mảnh mai, hòa quyện giữa sự lạnh lẽo và ấm áp, mang đến không gian ấm cúng và yên bình." },
    { name: "C4326 - Statuario", quote: "Statuario Silver tái hiện hình ảnh những dòng sông uốn lượn trên nền tuyết trắng tinh khôi, mang đến một thiết kế tinh tế và sang trọng." },
    { name: "C4348 - Montana", quote: "Montana để lại dấu ấn đậm nét với những mảng vân mây xám màu tựa bầu trời dữ dội báo bão, mang đến cảm giác mạnh mẽ, cá tính." },
    { name: "C5231 - Andes", quote: "Andes với những đường vân uyển chuyển, lấp lánh chạy xuyên qua bề mặt, phản chiếu ánh sáng và tạo thành những hình khối mạnh mẽ đầy tao nhã." },
    { name: "C5242 - Rosa", quote: "Rosa được lấy cảm hứng từ những hạt mưa hiền hòa nghiêng rơi trong gió, mang tông màu sáng tạo sự mát mẻ cho công trình nội thất" },
    { name: "C5250 - Autumn", quote: "Autumn với những đường vân xám tinh tế chạy qua tấm đá theo hình thức tự nhiên và dứt khoát, đan xen cùng vân vàng như tia nắng rực rỡ, vừa độc đáo thanh lịch vừa mang lại cảm giác an tâm." },
    { name: "C4111 - Aurora", quote: "Aurora là một thiết kế độc đáo lấy cảm hứng từ vẻ đẹp hùng vĩ của dãy núi Andes, với họa tiết sắc xám tinh tế, mang đến ấn tượng mạnh." },
    { name: "C4202 - Calacatta Gold", quote: "Calacatta Gold được lấy cảm hứng từ dòng đá cẩm thạch tự nhiên nổi tiếng nhất từ nước Ý với các đường vân trong tông vàng ấn tượng nổi bật trên nền trắng làm bừng sáng không gian." },
    { name: "C4204 - Calacatta Classic", quote: "Calacatta Classic được lấy cảm hứng từ dòng đá cẩm thạch tự nhiên nổi tiếng nhất từ nước Ý với các đường vân trong tông vàng ấn tượng nổi bật trên nền trắng làm bừng sáng không gian." },
    { name: "C4211 - Calacatta Supreme", quote: "Calacatta Supreme nổi bật với những đường vân xám tối đan xen, uyển chuyển như những nhánh cây vươn ra trên nền trắng cẩm thạch, tạo điểm nhấn sang trọng." },
    { name: "C4221 - Athena", quote: "Athena lấy cảm hứng từ dòng đá cẩm thạch Calacatta, tái hiện dòng dung nham chảy sâu trong từng vết xẻ của các tầng địa chất, toát lên sự sang trọng và hoàn hảo." },
    { name: "C4222 - Lagoon", quote: "Lagoon nổi bật trên nền trắng tinh khiết giống đá cẩm thạch, kết hợp các tông màu tự nhiên theo xu hướng thiết kế nội thất chú trọng sự hài hòa với thiên nhiên." },
    { name: "C4238 - Channel", quote: "Channel lấy cảm hứng từ vẻ đẹp nguyên bản của đá thạch anh tự nhiên, gây ấn tượng với các đường vân màu xám đậm, ấm áp, hài hòa tinh tế cùng sắc thái tự nhiên." },
    { name: "C4250 - Elio", quote: "Elio nổi bật với những đường vân mạnh mẽ, có kết cấu tông màu ấm và sự chuyển đổi màu sắc nhẹ nhàng trên bề mặt màu trắng cẩm thạch sang trọng." },
    { name: "C4342 - Casla Eternal", quote: "Eternal mô phỏng dòng đá cẩm thạch kinh điển của nước Ý với sự kết hợp mềm mại giữa nền trắng và các đường vân tông xám to nhỏ đan xen, tạo sự nhẹ nhàng cho không gian." },
    { name: "C4345 - Oro", quote: "Oro mô phỏng dòng đá cẩm thạch đẳng cấp của nước Ý với sự kết hợp thanh lịch giữa nền trắng với các đường vân trong tông vàng tạo nên hình khối rõ nét." },
    { name: "C4346 - Luxe", quote: "Luxe mô phỏng dòng cẩm thạch nổi tiếng nước Ý với sự kết hợp giữa nền trắng và các đường vân xám tông xanh thanh thoát đầy ngẫu hứng, nổi bật trong không gian sang trọng." },
    { name: "C5340 - Sonata", quote: "Sonata với những đường vân xám mềm mại xếp thành từng lớp, tạo nên độ tương phản tinh tế và chiều sâu ấn tượng." },
    { name: "C5445 - Muse", quote: "Muse tạo nên sự hòa quyện hài hòa giữa các đường vân mảnh màu vàng và xám nhẹ, phân bố tinh tế trên toàn bộ tấm đá, mang đến không gian ấm áp và an yên." },
  ],
  "SUPER LUXURY": [
    { name: "C4147 - Mont", quote: "Mont với những đường vân dày mềm mại xếp thành từng lớp, kết hợp màu vàng và xám tạo nên độ tương phản tinh tế và chiều sâu, mang đến vẻ đẹp vượt thời gian." },
    { name: "C4149 - River", quote: "River nổi bật với các dải màu xám trên nền trắng tạo chiều sâu và cân bằng, mang lại vẻ đẹp tự nhiên và đẳng cấp." },
    { name: "C4255 - Calacatta Extra", quote: "Calacatta Extra nổi bật với những đường vân xám tối đan xen, uyển chuyển như những nhánh cây vươn ra trên nền cẩm thạch trắng tinh khiết, tạo điểm nhấn sang trọng." },
    { name: "C5366 - Skiron", quote: "Skiron tái hiện hình ảnh những con sóng biển trên nền đá, với các đường vân xanh xếp lớp cùng những mảng trắng và xám, phù hợp cho không gian nội thất hiện đại." },
  ],
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

  const resizeImage = (img: HTMLImageElement, targetWidth = 1152): Promise<string> => {
    return new Promise((resolve, reject) => {
      const minSize = 300;
      if (img.width < minSize || img.height < minSize) {
        reject(new Error("Ảnh quá nhỏ, tối thiểu 300px mỗi chiều"));
        return;
      }
      const aspectRatio = img.width / img.height;
      let newWidth = Math.min(img.width, targetWidth);
      let newHeight = newWidth / aspectRatio;
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

  const initializeFabricCanvas = () => {
    if (!modalCanvasRef.current || !resizedImageData) return;

    const canvas = new fabric.Canvas(modalCanvasRef.current, {
      isDrawingMode: true,
    });
    fabricCanvasRef.current = canvas;

    fabric.Image.fromURL(resizedImageData, (img) => {
      canvas.setWidth(img.width);
      canvas.setHeight(img.height);
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = "white";
  };

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
    img.src = resizedImageData;
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
      const resultUrl = await processInpainting(resizedImageData, productImageBase64, maskImage!);
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
    setResizedImageData("");
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
                        fabric.Image.fromURL(resizedImageData, (img) => {
                          fabricCanvasRef.current!.setBackgroundImage(
                            img,
                            fabricCanvasRef.current!.renderAll.bind(fabricCanvasRef.current)
                          );
                        });
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
              <DialogContent className="max-w-[100vw] max-h-[100vh] overflow-auto p-6 bg-white rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-blue-900">Vẽ Mask</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Dùng chuột để vẽ mask (màu trắng).
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-6">
                  <div className="canvas-container relative bg-gray-100 rounded-md border border-gray-300 overflow-auto">
                    <canvas ref={modalCanvasRef} className="max-w-full max-h-[90vh]" />
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

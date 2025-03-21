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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Path = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

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
  Object.values(productGroups).flat().map((item) => [
    item.name,
    `/product_images/${item.name.split(" - ")[0]}.jpg`,
  ])
);

export const dynamic = "force-dynamic";

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
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    phone: "",
    email: "",
    field: "",
  });
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskModalCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (isMaskModalOpen && maskModalCanvasRef.current && resizedImageData) {
      const canvas = maskModalCanvasRef.current;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let width = img.width;
        let height = img.height;

        if (width < 1024) {
          width = 1024;
          height = width / aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        redrawCanvas();
      };
      img.onerror = () => setError("Không thể tải ảnh trong modal");
      img.src = resizedImageData;
    }

    return () => {
      if (maskCanvasRef.current) maskCanvasRef.current.remove();
    };
  }, [isMaskModalOpen, resizedImageData]);

  const resizeImage = (img: HTMLImageElement, minWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const aspectRatio = img.width / img.height;
      let canvasWidth = img.width;
      let canvasHeight = img.height;

      if (canvasWidth < minWidth) {
        canvasWidth = minWidth;
        canvasHeight = canvasWidth / aspectRatio;
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
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
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const ctx = tempCanvas.getContext("2d");
          if (!ctx) throw new Error("Không thể tạo context");
          ctx.drawImage(img, 0, 0);
          setOriginalImageData(tempCanvas.toDataURL("image/png"));
          tempCanvas.remove();

          const minWidth = 1024;
          const resizedData = await resizeImage(img, minWidth);
          setResizedImageData(resizedData);
          setImage(img);

          drawImageOnCanvas(resizedData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không thể xử lý ảnh");
        }
      };
      img.onerror = () => setError("Không thể tải ảnh");
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const drawImageOnCanvas = (resizedData: string) => {
    const inputCanvas = inputCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!inputCanvas || !maskCanvas) return;

    const img = new Image();
    img.onload = () => {
      inputCanvas.width = img.width;
      inputCanvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      if (outputCanvas) {
        outputCanvas.width = img.width;
        outputCanvas.height = img.height;
      }

      const inputCtx = inputCanvas.getContext("2d")!;
      inputCtx.drawImage(img, 0, 0);
    };
    img.src = resizedData;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!maskModalCanvasRef.current || !maskCanvasRef.current) return;
    setIsDrawing(true);
    const isErasingNow = e.button === 2 || eraseMode;
    setIsErasing(isErasingNow);

    const rect = maskModalCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

      setPaths((prev) => [
        ...prev,
        { points: [{ x, y }], color: "white", width: brushSize },
      ]);
    }

    updateMaskPreview();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskModalCanvasRef.current || !maskCanvasRef.current) return;

    const rect = maskModalCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    updateMaskPreview();
  };

  const stopDrawing = () => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext("2d")!;
    setIsDrawing(false);
    setIsErasing(false);
    if (!isErasing) maskCtx.closePath();
    updateMaskPreview();
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!maskModalCanvasRef.current || !maskCanvasRef.current) return;
    setIsDrawing(true);
    setIsErasing(eraseMode);

    const rect = maskModalCanvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const maskCtx = maskCanvasRef.current.getContext("2d")!;
    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";

    if (eraseMode) {
      eraseMaskAtPosition(x, y);
    } else {
      maskCtx.strokeStyle = "white";
      maskCtx.lineWidth = brushSize;
      maskCtx.beginPath();
      maskCtx.moveTo(x, y);

      setPaths((prev) => [
        ...prev,
        { points: [{ x, y }], color: "white", width: brushSize },
      ]);
    }

    updateMaskPreview();
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskModalCanvasRef.current || !maskCanvasRef.current) return;

    const rect = maskModalCanvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const maskCtx = maskCanvasRef.current.getContext("2d")!;

    if (eraseMode) {
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

    updateMaskPreview();
  };

  const stopDrawingTouch = () => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext("2d")!;
    setIsDrawing(false);
    setIsErasing(false);
    if (!eraseMode) maskCtx.closePath();
    updateMaskPreview();
  };

  const eraseMaskAtPosition = (x: number, y: number) => {
    const eraseRadius = brushSize / 2;

    setPaths((prevPaths) => {
      const updatedPaths = prevPaths.map((path) => {
        if (path.color !== "white") return path;

        const filteredPoints = path.points.filter((point) => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          return distance > eraseRadius;
        });

        return { ...path, points: filteredPoints };
      });

      return updatedPaths.filter((path) => path.points.length > 0);
    });

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

    updateMaskPreview();
  };

  const updateMaskPreview = () => {
    const inputCanvas = inputCanvasRef.current;
    const modalCanvas = maskModalCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!inputCanvas || !maskCanvas || !resizedImageData) return;

    const img = new Image();
    img.onload = () => {
      const inputCtx = inputCanvas.getContext("2d")!;
      inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
      inputCtx.drawImage(img, 0, 0);
      inputCtx.globalAlpha = maskOpacity;
      inputCtx.drawImage(maskCanvas, 0, 0);
      inputCtx.globalAlpha = 1.0;

      if (isMaskModalOpen && modalCanvas) {
        const modalCtx = modalCanvas.getContext("2d")!;
        modalCtx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);
        modalCtx.drawImage(img, 0, 0);
        modalCtx.globalAlpha = maskOpacity;
        modalCtx.drawImage(maskCanvas, 0, 0);
        modalCtx.globalAlpha = 1.0;
      }
    };
    img.onerror = () => setError("Không thể cập nhật preview");
    img.src = resizedImageData;
  };

  const deletePathAtPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskModalCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
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
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "canvas-state.png";
    link.href = dataURL;
    link.click();
    link.remove();
  };

  const handleResetCanvas = () => {
    setImage(null);
    setPaths([]);
    setInpaintedImage(null);
    setError(null);
    setOriginalImageData("");
    setResizedImageData("");
    setSelectedProduct(null);

    const inputCanvas = inputCanvasRef.current;
    if (inputCanvas) {
      const ctx = inputCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#F3F4F6";
        ctx.fillRect(0, 0, inputCanvas.width, inputCanvas.height);
      }
    }

    const outputCanvas = outputCanvasRef.current;
    if (outputCanvas) {
      const ctx = outputCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#F3F4F6";
        ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
      }
    }
  };

  const handleClearMask = () => {
    setPaths([]);
    redrawCanvas();
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

  const getCombinedImage = async (): Promise<string> => {
    if (!image || !maskCanvasRef.current) throw new Error("Không tìm thấy ảnh hoặc mask");

    const originalMaskCanvas = document.createElement("canvas");
    originalMaskCanvas.width = image.width;
    originalMaskCanvas.height = image.height;
    const originalMaskCtx = originalMaskCanvas.getContext("2d")!;

    const scaleX = image.width / maskCanvasRef.current.width;
    const scaleY = image.height / maskCanvasRef.current.height;

    originalMaskCtx.lineCap = "round";
    originalMaskCtx.lineJoin = "round";

    paths.forEach((path) => {
      if (path.points.length === 0) return;

      originalMaskCtx.beginPath();
      originalMaskCtx.strokeStyle = path.color;
      originalMaskCtx.lineWidth = path.width * scaleX;

      if (path.points.length === 1) {
        const point = path.points[0];
        originalMaskCtx.arc(point.x * scaleX, point.y * scaleY, (path.width * scaleX) / 2, 0, Math.PI * 2);
        originalMaskCtx.fillStyle = path.color;
        originalMaskCtx.fill();
      } else {
        originalMaskCtx.moveTo(path.points[0].x * scaleX, path.points[0].y * scaleY);
        for (let i = 0; i < path.points.length - 1; i++) {
          const xc = ((path.points[i].x + path.points[i + 1].x) / 2) * scaleX;
          const yc = ((path.points[i].y + path.points[i + 1].y) / 2) * scaleY;
          originalMaskCtx.quadraticCurveTo(path.points[i].x * scaleX, path.points[i].y * scaleY, xc, yc);
        }
        originalMaskCtx.stroke();
      }
    });

    const maskCanvasBW = document.createElement("canvas");
    maskCanvasBW.width = image.width;
    maskCanvasBW.height = image.height;
    const maskCtxBW = maskCanvasBW.getContext("2d")!;

    const maskImageData = originalMaskCtx.getImageData(0, 0, image.width, image.height);
    const maskData = maskImageData.data;

    for (let i = 0; i < maskData.length; i += 4) {
      const alpha = maskData[i + 3];
      maskCtxBW.fillStyle = alpha > 0 ? "white" : "black";
      maskCtxBW.fillRect((i / 4) % image.width, Math.floor((i / 4) / image.width), 1, 1);
    }

    const result = maskCanvasBW.toDataURL("image/png");
    maskCanvasBW.remove();
    originalMaskCanvas.remove();
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

    try {
      const maskImage = await getCombinedImage();
      const productImagePath = products[selectedProduct as keyof typeof products];
      const productImageBase64 = await convertImageToBase64(productImagePath);

      const resultUrl = await processInpainting(originalImageData, productImageBase64, maskImage);
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      const watermarkedImageUrl = await addWatermark(proxiedUrl);
      setInpaintedImage(watermarkedImageUrl);

      const img = new Image();
      img.onload = () => {
        const inputCanvas = inputCanvasRef.current;
        const outputCanvas = outputCanvasRef.current;
        if (inputCanvas && outputCanvas) {
          inputCanvas.width = img.width;
          inputCanvas.height = img.height;
          outputCanvas.width = img.width;
          outputCanvas.height = img.height;
          inputCanvas.getContext("2d")!.drawImage(img, 0, 0);
          outputCanvas.getContext("2d")!.drawImage(img, 0, 0);
        }
      };
      img.src = watermarkedImageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!inpaintedImage) return;
    if (customerInfo.phone && customerInfo.email && customerInfo.field) {
      const link = document.createElement("a");
      link.download = "ket-qua-xu-ly.png";
      link.href = inpaintedImage;
      link.click();
      link.remove();
    } else {
      setIsCustomerInfoOpen(true);
    }
  };

  const handleCustomerInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingInfo(true);

    const phoneRegex = /^\d{9,11}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(customerInfo.phone)) {
      setError("Số điện thoại phải từ 9-11 chữ số.");
      setIsSubmittingInfo(false);
      return;
    }
    if (!emailRegex.test(customerInfo.email)) {
      setError("Email không hợp lệ.");
      setIsSubmittingInfo(false);
      return;
    }
    if (!customerInfo.field.trim()) {
      setError("Vui lòng nhập lĩnh vực công tác.");
      setIsSubmittingInfo(false);
      return;
    }

    try {
      const response = await fetch("/api/customer-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customerInfo.phone,
          email: customerInfo.email,
          field: customerInfo.field,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Lỗi khi gửi thông tin khách hàng");
      setError(null);
      downloadImage();
      setIsCustomerInfoOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu thông tin");
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  const getProductQuote = () => {
    if (!selectedProduct) return "Vui lòng chọn một sản phẩm để xem thông tin.";
    const allProducts = Object.values(productGroups).flat();
    const product = allProducts.find((p) => p.name === selectedProduct);
    return product ? product.quote : "Không tìm thấy thông tin sản phẩm.";
  };

  return (
    <div className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col animate-fade-in">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">CaslaQuartz AI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8 flex-grow">
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
            <div className="lg:hidden">
              <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px]">
                <canvas ref={inputCanvasRef} className="max-w-full" />
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
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <Loader2 className="h-12 w-12 text-blue-900 animate-spin mb-4" />
                    <p className="text-blue-900/70 text-lg">Đang xử lý ảnh...</p>
                  </div>
                )}
              </div>
              {image && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={handleClearMask}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                  <Dialog open={isMaskModalOpen} onOpenChange={setIsMaskModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                        title="Vẽ Mask"
                        onClick={() => console.log("Opening mask modal")}
                      >
                        <Paintbrush className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[1024px]">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-blue-900">Vẽ Mask</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                          Dùng chuột trái để vẽ mask (màu trắng), chuột phải để xóa mask. Trên cảm ứng, bật chế độ xóa bên dưới.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[400px]">
                        <canvas
                          ref={maskModalCanvasRef}
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
                      </div>
                      <div className="flex justify-between mt-4">
                        <div className="flex gap-2 items-center">
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
                            className={`ml-4 ${eraseMode ? "bg-red-500 hover:bg-red-600" : "bg-blue-900 hover:bg-blue-800"} text-white`}
                          >
                            {eraseMode ? "Chế độ Xóa" : "Chế độ Vẽ"}
                          </Button>
                        </div>
                        <Button onClick={() => setIsMaskModalOpen(false)} className="bg-blue-900 hover:bg-blue-800 text-white">
                          Hoàn tất
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={saveCanvasState}
                    className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Save className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-medium text-blue-900">Tải Ảnh & Xem Mask</h2>
                <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px]">
                  <canvas ref={inputCanvasRef} className="max-w-full" />
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
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 bg-blue-50 rounded-md">
                      <TabsTrigger
                        value="info"
                        className="data-[state=active]:bg-blue-900 data-[state=active]:text-white hover:bg-blue-100"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Hướng dẫn
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="info" className="space-y-2 mt-2">
                      <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-900">
                        <p>1. Chọn nhóm sản phẩm và sản phẩm từ cột bên phải.</p>
                        <p>2. Nhấn "Vẽ Mask" để tạo mask trên ảnh.</p>
                        <p>3. Nhấn "Xử lý ảnh" để tạo kết quả.</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-medium text-blue-900">Kết Quả Xử Lý</h2>
                <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px]">
                  <canvas ref={outputCanvasRef} />
                  {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                      <Loader2 className="h-12 w-12 text-blue-900 animate-spin mb-4" />
                      <p className="text-blue-900/70 text-lg">Đang xử lý ảnh...</p>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <Alert className={isProcessing ? "animate-pulse bg-blue-50" : "bg-white"}>
                    <AlertTitle className="text-blue-900 font-medium">Ý nghĩa sản phẩm</AlertTitle>
                    <AlertDescription className="text-sm text-gray-700">
                      {getProductQuote()}
                    </AlertDescription>
                  </Alert>
                </div>
                <Dialog open={isCustomerInfoOpen} onOpenChange={setIsCustomerInfoOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={downloadImage}
                      disabled={!inpaintedImage}
                      className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Tải kết quả
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-blue-900">
                        Thông Tin Khách Hàng
                      </DialogTitle>
                      <DialogDescription className="text-sm text-gray-600">
                        Vui lòng điền thông tin để tải kết quả xử lý ảnh.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCustomerInfoSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Số Điện Thoại <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          required
                          type="tel"
                          placeholder="0901234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          required
                          type="email"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field" className="text-sm font-medium text-gray-700">
                          Lĩnh Vực Công Tác <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="field"
                          value={customerInfo.field}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, field: e.target.value })}
                          required
                          placeholder="Thiết kế nội thất"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                        disabled={isSubmittingInfo}
                      >
                        {isSubmittingInfo ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          "Xác Nhận & Tải Kết Quả"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="hidden lg:block">
              {image && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-gray-200 hover:bg-gray-300 text-blue-900">...</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleResetCanvas}>
                          <Upload className="h-4 w-4 mr-2" />
                          Tải ảnh mới
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleClearMask}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Xóa mask
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={saveCanvasState}>
                          <Save className="h-4 w-4 mr-2" />
                          Lưu ảnh
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Dialog open={isMaskModalOpen} onOpenChange={setIsMaskModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                          title="Vẽ Mask"
                          onClick={() => console.log("Opening mask modal")}
                        >
                          <Paintbrush className="h-4 w-4 mr-2" />
                          Vẽ Mask
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[1024px]">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold text-blue-900">Vẽ Mask</DialogTitle>
                          <DialogDescription className="text-sm text-gray-600">
                            Dùng chuột trái để vẽ mask (màu trắng), chuột phải để xóa mask. Trên cảm ứng, bật chế độ xóa bên dưới.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[400px]">
                          <canvas
                            ref={maskModalCanvasRef}
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
                        </div>
                        <div className="flex justify-between mt-4">
                          <div className="flex gap-2 items-center">
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
                              className={`ml-4 ${eraseMode ? "bg-red-500 hover:bg-red-600" : "bg-blue-900 hover:bg-blue-800"} text-white`}
                            >
                              {eraseMode ? "Chế độ Xóa" : "Chế độ Vẽ"}
                            </Button>
                          </div>
                          <Button onClick={() => setIsMaskModalOpen(false)} className="bg-blue-900 hover:bg-blue-800 text-white">
                            Hoàn tất
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
            </div>

            {error && (
              <Alert variant="destructive" className="mt-2 p-4">
                <AlertTitle className="text-sm font-medium">Lỗi</AlertTitle>
                <AlertDescription className="text-sm">{error}</AlertDescription>
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
                        onClick={() => handleProductSelect(product.name)}
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
                      onClick={() => handleProductSelect(product.name)}
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

      <footer className="mt-12 py-4 text-center text-sm text-blue-900/70">
        <p>Liên hệ: support@caslaquartz.com | Hotline: 1234-567-890</p>
        <p>© 2025 CaslaQuartz. All rights reserved.</p>
      </footer>
    </div>
  );
}

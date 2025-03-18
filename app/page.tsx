"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Download, Paintbrush, Loader2, Info, Send, RefreshCw, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useInpainting } from "@/hooks/useInpainting";

// Định nghĩa kiểu Point và Path
type Point = { x: number; y: number };
type Path = {
  points: Point[];
  color: string;
  width: number;
};

// Danh sách sản phẩm và câu quote
const productGroups = {
  "NHÓM TIÊU CHUẨN (STANDARD)": [
    { name: "C1012 - Glacier White", quote: "Glacier với nền trắng kết hợp với những hạt thạch anh kích thước nhỏ, kết hợp với ánh sáng tạo ra chiều sâu cho bề mặt, độ cứng cao, bền đẹp, phù hợp với các công trình thương mại" },
    { name: "C1026 - Polar", quote: "Polar với nền trắng kết hợp với những hạt thạch anh kích thước lớn, kết hợp với ánh sáng tạo ra chiều sâu cho bề mặt, độ cứng cao, bền đẹp, phù hợp với các công trình thương mại" },
    { name: "C1005 - Milky White", quote: "Milky White với màu trắng tinh khiết, nhẹ nhàng, dễ dàng kết hợp với các đồ nội thất khác, phù hợp với phong cách tối giản" },
    { name: "C3168 - Silver Wave", quote: "Silver Wave chủ đạo với nền trắng, hòa cùng đó là những ánh bạc ngẫu hứng như những con sóng xô bờ dưới cái nắng chói chang của miền biển nhiệt đới" },
    { name: "C3269 - Ash Grey", quote: "Ash Grey với màu nền tông xám, kết hợp với bond trầm tựa như làn khói ẩn hiện trong không gian, tạo nên sự trang nhã đầy cuốn hút" },
  ],
  "NHÓM TRUNG CẤP (DELUXE)": [
    { name: "C2103 - Onyx Carrara", quote: "Onyx Carrara lấy cảm hứng từ dòng đá cẩm thạch Carrara nổi tiếng của nước Ý; được thiết kế với những vân ẩn tinh tế, nhẹ nhàng trên nền đá trắng pha chút gam tối tạo không gian ấm cúng, bình yên." },
    { name: "C2104 - Massa", quote: "Massa được lấy cảm hứng từ dòng đá cẩm thạch Carrara nổi tiếng của Italy với những vân ẩn tinh tế và nhẹ nhàng tạo không gian sang trọng trên nền đá cẩm thạch trắng Carrara." },
    { name: "C3105 - Casla Cloudy", quote: "Casla Cloudy với tông xanh nhẹ nhàng, giống như tên gọi Cloudy, là bầu trời xanh với vân mây tinh tế xuất hiện ở mật độ vừa phải, tiếp nối vô tận trong một không gian khoáng đạt." },
    { name: "C3146 - Casla Nova", quote: "Casla Nova với tông nâu vàng của những áng mây nhẹ nhàng được thiết kế tự do chấm phá trên nền đá cẩm thạch trắng, tạo không gian vừa sang trọng lại ấm cúng." },
    { name: "C2240 - Marquin", quote: "Marquin nổi bật với nền đen điểm cùng bond màu trắng, hai màu sắc đối lập của bảng màu ẩn hiện đan xen nhau tạo nên sự trừu tượng trong khối kết cấu cụ thể" },
    { name: "C5225 - Amber", quote: "Amber khác lạ với các đường vân màu nâu đậm tinh tế, kéo dài theo chiều dài tấm đá. Màu sắc ấm áp và sang trọng mang lại vẻ đẹp tự nhiên, tạo điểm nhấn như một dòng sông đang uốn lượn." },
    { name: "C3311 - Calacatta Sky", quote: "Calacatta Sky với những đường vân mảnh đậm nhạt xen lẫn nhau, nhẹ nhàng lướt trên toàn bộ bề mặt tạo sự thu hút như vào một không gian vô tận. Màu nâu xám của vân hòa cùng nền đá trắng tạo nên sự hài hòa vừa cổ điển vừa hiện đại." },
    { name: "C3346 - Massimo", quote: "Massimo lấy vẻ ngoài của bê tông làm chủ đạo, họa tiết vân đá là sự mô phỏng các trường từ vô hình trên Mặt Trời, tạo nên hiệu ứng thị giác độc đáo, thô mộc nhưng mạnh mẽ và đầy táo bạo." },
    { name: "C4143 - Mario", quote: "Mario mang tông màu ấm nâu vàng, được lấy cảm hứng từ mùa thu vàng của Levitan, tạo nét thơ mộng cho không gian bằng việc gợi liên tưởng đến cảnh sắc của hàng cây mùa đổ lá bên cạnh dòng sông đang uốn lượn." },
    { name: "C4145 - Marina", quote: "Marina mang tông màu xám lạnh, được lấy cảm hứng từ những dòng sông miền cực bắc quanh năm phủ tuyết trắng, nơi màu xanh của nước tinh khiết hòa quyện với màu trắng của tuyết tạo nên một cảnh tượng kỳ vĩ tráng lệ." },
    { name: "C2262 - Concrete (Honed)", quote: "Concrete được lấy cảm hứng từ bề mặt giả xi măng, với sự pha trộn hoàn hảo giữa các gam màu xám sáng ấm áp, chuyển động vân tinh tế, là sự lựa chọn thông minh cho không gian hiện đại." },
    { name: "C5240 - Spring", quote: "Spring lấy cảm hứng từ các yếu tố tương phản sáng tối, cùng với đường vân sắc nét uyển chuyển nhấp nhô khắp bề mặt, mang lại sự cân bằng hoàn hảo, làm nổi bật vẻ hiện đại và sang trọng." },
  ],
  "NHÓM CAO CẤP (LUXURY)": [
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
  "NHÓM SIÊU CAO CẤP (SUPER LUXURY)": [
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

eexport const dynamic = "force-dynamic";

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
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [activeCanvas, setActiveCanvas] = useState<"canvas1" | "canvas2" | null>(null);

  // Refs
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
    setError(null);
    setActiveCanvas("canvas1");
    setImage(null);
    setResizedImageData("");

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
    if (!inputCanvasRef.current) return;

    setIsDrawing(true);
    const isRightClick = e.button === 2;
    setIsErasing(isRightClick);
    setActiveCanvas("canvas1");

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!isRightClick) {
      setPaths((prev) => [
        ...prev,
        {
          points: [{ x, y }],
          color: "white",
          width: brushSize,
        },
      ]);
    } else {
      eraseAtPosition(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !inputCanvasRef.current) return;

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!isErasing) {
      setPaths((prev) => {
        const newPaths = [...prev];
        const currentPath = newPaths[newPaths.length - 1];
        currentPath.points.push({ x, y });
        return newPaths;
      });
    } else {
      eraseAtPosition(x, y);
    }

    requestAnimationFrame(redrawCanvas);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setIsErasing(false);
    redrawCanvas();
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!inputCanvasRef.current) return;

    setIsDrawing(true);
    setIsErasing(false); // Chỉ vẽ với cảm ứng, không xóa
    setActiveCanvas("canvas1");

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setPaths((prev) => [
      ...prev,
      {
        points: [{ x, y }],
        color: "white",
        width: brushSize,
      },
    ]);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !inputCanvasRef.current) return;

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (!isErasing) {
      setPaths((prev) => {
        const newPaths = [...prev];
        const currentPath = newPaths[newPaths.length - 1];
        currentPath.points.push({ x, y });
        return newPaths;
      });
    }

    requestAnimationFrame(redrawCanvas);
  };

  const stopDrawingTouch = () => {
    setIsDrawing(false);
    setIsErasing(false);
    redrawCanvas();
  };

  const eraseAtPosition = (x: number, y: number) => {
    const eraseRadius = brushSize / 2;

    setPaths((prev) => {
      const newPaths = prev.map((path) => ({
        ...path,
        points: path.points.filter((point) => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          return distance > eraseRadius;
        }),
      })).filter((path) => path.points.length > 0);
      return newPaths;
    });
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
      if (path.points.length === 0) return;

      maskCtx.beginPath();
      maskCtx.strokeStyle = path.color;
      maskCtx.lineWidth = path.width;
      maskCtx.lineCap = "round";
      maskCtx.lineJoin = "round";

      path.points.forEach((point, index) => {
        if (index === 0) maskCtx.moveTo(point.x, point.y);
        else maskCtx.lineTo(point.x, point.y);
      });
      maskCtx.stroke();
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
    if (!inputCanvasRef.current) return;

    const rect = inputCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPaths((prev) => {
      const newPaths = [...prev];
      let minDistance = Infinity;
      let pathToDeleteIndex = -1;

      newPaths.forEach((path, index) => {
        path.points.forEach((point) => {
          const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
          if (distance < minDistance && distance < brushSize / 2) {
            minDistance = distance;
            pathToDeleteIndex = index;
          }
        });
      });

      if (pathToDeleteIndex !== -1) {
        newPaths.splice(pathToDeleteIndex, 1);
      }
      return newPaths;
    });

    redrawCanvas();
  };

  const handleNewImage = () => {
    setImage(null);
    setPaths([]);
    setResizedImageData("");
    setError(null);
    setActiveCanvas("canvas1");
    fileInputRef.current?.click();
  };

  const handleRefresh = () => {
    setPaths([]);
    setError(null);
    setActiveCanvas("canvas1");
    if (image && resizedImageData) {
      drawImageOnCanvas(image, resizedImageData);
    }
  };

  const saveCanvasState = () => {
    const canvas = inputCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `mask-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    link.remove();
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
      img.onerror = () => reject(new Error(`Không thể tải ảnh từ ${url}`));
      img.src = url.startsWith("http") ? url : `${window.location.origin}${url}`;
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

      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(resultUrl)}`;
      const watermarkedImageUrl = await addWatermark(proxiedUrl);
      setInpaintedImage(watermarkedImageUrl);

      const img = new Image();
      img.onload = () => drawResultOnCanvas(img);
      img.onerror = () => setError("Không thể tải ảnh kết quả");
      img.src = watermarkedImageUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định");
    } finally {
      setIsProcessing(false);
    }
  };

  const drawResultOnCanvas = (img: HTMLImageElement) => {
    const outputCanvas = outputCanvasRef.current;
    if (!outputCanvas) {
      setError("Canvas không khả dụng");
      return;
    }
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) {
      setError("Không thể lấy context của canvas");
      return;
    }

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
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) throw new Error("Không có mask canvas");

    return maskCanvas.toDataURL("image/png");
  };

  const downloadImage = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas || !inpaintedImage) {
      setError("Không có ảnh để tải xuống");
      return;
    }

    const link = document.createElement("a");
    link.download = `inpainted-${Date.now()}.png`;
    link.href = inpaintedImage;
    link.click();
    link.remove();
  };

  const getProductQuote = (productName: string) => {
    return "Thông tin báo giá sản phẩm sẽ được cập nhật sau.";
  };

  const handleGroupSelect = (value: string) => {
    setSelectedGroup(value);
    setSelectedProduct(null);
  };

  const handleProductSelect = (value: string) => {
    setSelectedProduct(value);
  };

  return (
    <div className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col animate-fade-in">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800 transition-all duration-300 hover:text-blue-900">
        CaslaQuartz AI
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        {/* Cột 1: Tải ảnh & Chọn vật thể */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-blue-900">Tải Ảnh & Chọn Vật Thể</h2>
            <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[400px]">
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

            {image && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 justify-between">
                  <Button
                    onClick={handleNewImage}
                    className="flex-1 bg-blue-900 hover:bg-blue-800 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh mới
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Xóa mask
                  </Button>
                  <Button
                    onClick={saveCanvasState}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-blue-900"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Lưu ảnh
                  </Button>
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
                    <div>
                      <label className="text-sm font-medium text-blue-900">Kích thước: {brushSize}px</label>
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
                  <TabsContent value="info" className="space-y-2 mt-2">
                    <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-900">
                      <p>1. Chọn nhóm sản phẩm và sản phẩm từ cột bên phải.</p>
                      <p>2. Vẽ mặt nạ lên vùng cần xử lý (chuột trái để vẽ, chuột phải để xóa mask).</p>
                      <p>3. Nhấn "Xử lý ảnh" để tạo kết quả.</p>
                    </div>
                  </TabsContent>
                </Tabs>

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
          </Card>
        </div>

        {/* Cột 2: Kết quả */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-blue-900">Kết quả</h2>
            <div className="bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[400px]">
              <canvas ref={outputCanvasRef} className="max-w-full" />
            </div>
            {inpaintedImage && (
              <Button
                onClick={downloadImage}
                className="bg-blue-900 hover:bg-blue-800 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Tải ảnh kết quả
              </Button>
            )}
          </Card>
        </div>

        {/* Cột 3: Chọn sản phẩm */}
        <div className="flex flex-col space-y-4">
          <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-blue-900">Chọn Sản Phẩm</h2>
            <div className="space-y-4">
              <Select onValueChange={handleGroupSelect} value={selectedGroup || undefined}>
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="Chọn nhóm sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(productGroups).map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedGroup && (
                <Select onValueChange={handleProductSelect} value={selectedProduct || undefined}>
                  <SelectTrigger className="bg-blue-50 border-blue-200">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {productGroups[selectedGroup].map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedProduct && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <h3 className="text-lg font-medium text-blue-900">Báo giá</h3>
                  <p className="text-sm text-blue-900">{getProductQuote(selectedProduct)}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <footer className="mt-12 py-4 text-center text-sm text-blue-900/70">
        <p>Liên hệ: support@caslaquartz.com | Hotline: 1234-567-890</p>
        <p>© 2025 CaslaQuartz. All rights reserved.</p>
      </footer>
    </div>
  );
}

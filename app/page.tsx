 "use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  Download,
  Paintbrush,
  Loader2,
  Info,
  Send,
  RefreshCw,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Hook useInpainting từ mã bạn cung cấp
const TENSOR_ART_API_URL = "https://ap-east-1.tensorart.cloud/v1";
const WORKFLOW_TEMPLATE_ID = "837405094118019506";

async function uploadImageToTensorArt(imageData: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY;
  console.log("API Key for upload:", apiKey);
  if (!apiKey) throw new Error("NEXT_PUBLIC_TENSOR_ART_API_KEY is not defined");

  const response = await fetch(`${TENSOR_ART_API_URL}/resource/image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ expireSec: 7200 }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Upload error:", errorText);
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }
  const { putUrl, resourceId, headers } = await response.json();

  const imageBlob = await fetch(imageData).then((res) => res.blob());
  const putResponse = await fetch(putUrl, {
    method: "PUT",
    headers: headers || { "Content-Type": "image/png" },
    body: imageBlob,
  });

  if (!putResponse.ok) throw new Error(`PUT failed: ${putResponse.status}`);
  return resourceId;
}

async function createInpaintingJob(uploadedImageId: string, productImageId: string, maskImageId: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY;
  console.log("API Key for job creation:", apiKey);
  if (!apiKey) throw new Error("NEXT_PUBLIC_TENSOR_ART_API_KEY is not defined");

  const workflowData = {
    request_id: Date.now().toString(),
    templateId: WORKFLOW_TEMPLATE_ID,
    fields: {
      fieldAttrs: [
        { nodeId: "731", fieldName: "image", fieldValue: uploadedImageId },
        { nodeId: "735", fieldName: "image", fieldValue: productImageId },
        { nodeId: "745", fieldName: "image", fieldValue: maskImageId },
      ],
    },
  };

  console.log("Sending to TensorArt:", JSON.stringify(workflowData, null, 2));

  const response = await fetch(`${TENSOR_ART_API_URL}/jobs/workflow/template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(workflowData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Create job error:", errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.job?.id) throw new Error("Missing job ID");
  return data.job.id;
}

async function pollJobStatus(jobId: string, timeout: number = 300000): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_TENSOR_ART_API_KEY is not defined");

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const response = await fetch(`${TENSOR_ART_API_URL}/jobs/${jobId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!response.ok) throw new Error(`Poll failed: ${response.status}`);
    const data = await response.json();
    if (data.job.status === "SUCCESS") {
      const resultUrl = data.job.resultUrl || data.job.successInfo?.images?.[0]?.url || data.job.output?.[0]?.url;
      if (!resultUrl) throw new Error("No result URL found");
      return resultUrl;
    } else if (data.job.status === "FAILED" || data.job.status === "CANCELLED") {
      throw new Error(`Job ${data.job.status.toLowerCase()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("Timeout");
}

export function useInpainting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function processInpainting({
    image,
    productImage,
    mask,
    onProgress,
  }: {
    image: string;
    productImage: string;
    mask: string;
    onProgress?: (progress: number) => void;
  }) {
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const [uploadedImageId, productImageId, maskImageId] = await Promise.all([
        uploadImageToTensorArt(image),
        uploadImageToTensorArt(productImage),
        uploadImageToTensorArt(mask),
      ]);

      const jobId = await createInpaintingJob(uploadedImageId, productImageId, maskImageId);

      const startTime = Date.now();
      const timeout = 300000; // 5 phút
      while (Date.now() - startTime < timeout) {
        const response = await fetch(`${TENSOR_ART_API_URL}/jobs/${jobId}`, {
          headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_TENSOR_ART_API_KEY}` },
        });
        const data = await response.json();

        // Cập nhật tiến trình dựa trên thời gian đã trôi qua (giả định)
        const elapsed = Date.now() - startTime;
        const progress = Math.min(Math.floor((elapsed / timeout) * 100), 95);
        if (onProgress) onProgress(progress);

        if (data.job.status === "SUCCESS") {
          const result = data.job.resultUrl || data.job.successInfo?.images?.[0]?.url || data.job.output?.[0]?.url;
          if (!result) throw new Error("No result URL found");
          setResultUrl(result);
          if (onProgress) onProgress(100);
          return result;
        } else if (data.job.status === "FAILED" || data.job.status === "CANCELLED") {
          throw new Error(`Job ${data.job.status.toLowerCase()}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      throw new Error("Timeout");
    } catch (err) {
      console.error("Error in processInpainting:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, resultUrl, processInpainting };
}

// Định nghĩa kiểu Path
type Path = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};

const productGroups = {
  "STANDARD": [
    { name: "C1012 - Glacier White", quote: "Glacier với nền trắng kết hợp với những hạt thạch anh kích thước nhỏ, kết hợp với ánh sáng tạo ra chiều sâu cho bề mặt, độ cứng cao, bền đẹp, phù hợp với các công trình thương mại" },
    { name: "C1026 - Polar", quote: "Polar với nền trắng kết hợp với những hạt thạch anh kích thước lớn, kết hợp với ánh sáng tạo ra chiều sâu cho bề mặt, độ cứng cao, bền đẹp, phù hợp với các công trình thương mại" },
    { name: "C1005 - Milky White", quote: "Milky White với màu trắng tinh khiết, nhẹ nhàng, dễ dàng kết hợp với các đồ nội thất khác, phù hợp với phong cách tối giản" },
    { name: "C3168 - Silver Wave", quote: "Silver Wave chủ đạo với nền trắng, hòa cùng đó là những ánh bạc ngẫu hứng như những con sóng xô bờ dưới cái nắng chói chang của miền biển nhiệt đới" },
    { name: "C3269 - Ash Grey", quote: "Ash Grey với màu nền tông xám, kết hợp với bond trầm tựa như làn khói ẩn hiện trong không gian, tạo nên sự trang nhã đầy cuốn hút" },
  ],
  "DELUXE": [
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
  "LUXURY": [
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
    .map((item) => [item.name, `/product_images/${item.name.split(" - ")[0]}.jpg`]),
);

export const dynamic = "force-dynamic";

export default function ImageInpaintingApp() {
  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [resizedImageData, setResizedImageData] = useState<string>("");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [maskOpacity, setMaskOpacity] = useState(0.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [pathsHistory, setPathsHistory] = useState<Path[][]>([]);
  const [redoStack, setRedoStack] = useState<Path[][]>([]);
  const [isBrushSizeOpen, setIsBrushSizeOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [showTutorial, setShowTutorial] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.keys(productGroups).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Customer info states
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    phone: "",
    email: "",
    field: "",
  });
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  // Refs
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { processInpainting, loading, error: inpaintingError } = useInpainting();
  const { toast } = useToast();

  // useEffect khởi tạo canvas và phím tắt
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

    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement("canvas");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") handleUndo();
      if (e.ctrlKey && e.key === "y") handleRedo();
      if (e.key === "e") setIsErasing((prev) => !prev);
      if (e.key === "+") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Các hàm xử lý cơ bản
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setImage(img);
      setPaths([]);
      setPathsHistory([]);
      setRedoStack([]);
      setInpaintedImage(null);
      setError(null);
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });

      const canvas = inputCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!inputCanvasRef.current || !maskCanvasRef.current || !image) return;
    setIsDrawing(true);
    setIsErasing(e.button === 2 || e.ctrlKey);
    const rect = inputCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!maskCtx) return;
    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";
    maskCtx.strokeStyle = isErasing ? "black" : "white";
    maskCtx.lineWidth = brushSize;
    maskCtx.beginPath();
    maskCtx.moveTo(x, y);

    setPathsHistory((prev) => [...prev, [...paths]]);
    setRedoStack([]);
    setPaths((prev) => [...prev, { points: [{ x, y }], color: isErasing ? "black" : "white", width: brushSize }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    const rect = inputCanvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!maskCtx) return;
    maskCtx.lineTo(x, y);
    maskCtx.stroke();
    setPaths((prev) => {
      const newPaths = [...prev];
      newPaths[newPaths.length - 1].points.push({ x, y });
      return newPaths;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (maskCanvasRef.current) maskCanvasRef.current.getContext("2d")?.closePath();
  };

  const handleUndo = () => {
    if (pathsHistory.length === 0) return;
    setRedoStack((prev) => [...prev, paths]);
    setPaths(pathsHistory[pathsHistory.length - 1]);
    setPathsHistory((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setPathsHistory((prev) => [...prev, paths]);
    setPaths(redoStack[redoStack.length - 1]);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

  const handleSubmit = async () => {
    if (!image || !selectedProduct || paths.length === 0) {
      setError("Vui lòng tải ảnh, chọn sản phẩm và vẽ mask trước khi xử lý");
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng kiểm tra lại ảnh, sản phẩm và mask",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const inputCanvas = inputCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      if (!inputCanvas || !maskCanvas) {
        throw new Error("Không thể truy cập canvas");
      }

      // Điều chỉnh kích thước mask canvas để khớp với ảnh gốc
      maskCanvas.width = image.width;
      maskCanvas.height = image.height;

      // Vẽ lại tất cả các đường path lên mask canvas
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        paths.forEach((path) => {
          maskCtx.beginPath();
          maskCtx.strokeStyle = path.color;
          maskCtx.lineWidth = path.width;
          maskCtx.lineCap = "round";
          maskCtx.lineJoin = "round";
          path.points.forEach((point, index) => {
            if (index === 0) {
              maskCtx.moveTo(point.x, point.y);
            } else {
              maskCtx.lineTo(point.x, point.y);
            }
          });
          maskCtx.stroke();
          maskCtx.closePath();
        });
      }

      // Chuyển canvas thành dữ liệu base64
      const imageData = inputCanvas.toDataURL("image/png");
      const maskData = maskCanvas.toDataURL("image/png");
      const productImageData = products[selectedProduct]; // Đường dẫn ảnh sản phẩm

      // Gửi dữ liệu đến TensorArt API qua processInpainting
      const resultUrl = await processInpainting({
        image: imageData,
        productImage: productImageData,
        mask: maskData,
        onProgress: (progress: number) => {
          setProcessingProgress(progress);
        },
      });

      // Cập nhật ảnh kết quả
      setInpaintedImage(resultUrl);

      // Vẽ kết quả lên output canvas
      const outputCanvas = outputCanvasRef.current;
      if (outputCanvas) {
        const ctx = outputCanvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            outputCanvas.width = img.width;
            outputCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = resultUrl;
        }
      }

      toast({
        title: "Thành công",
        description: "Ảnh đã được xử lý thành công",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xử lý ảnh");
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Đã xảy ra lỗi khi xử lý ảnh",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleGroup = (groupName: string) =>
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));

  const downloadImage = () => {
    if (!inpaintedImage) {
      toast({
        title: "Lỗi",
        description: "Không có ảnh kết quả để tải",
        variant: "destructive",
      });
      setError("Không có ảnh kết quả để tải");
      return;
    }

    if (customerInfo.phone && customerInfo.email && customerInfo.field) {
      const link = document.createElement("a");
      link.download = "caslaquartz-result.png";
      link.href = inpaintedImage;
      link.click();
      link.remove();

      toast({
        title: "Đã tải xuống",
        description: "Đã tải xuống ảnh kết quả thành công",
      });
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi gửi thông tin khách hàng");
      }

      const data = await response.json();
      console.log("Customer info saved:", data);

      setError(null);
      const link = document.createElement("a");
      link.download = "caslaquartz-result.png";
      link.href = inpaintedImage as string;
      link.click();
      link.remove();

      toast({
        title: "Đã tải xuống",
        description: "Đã tải xuống ảnh kết quả thành công",
      });

      setIsCustomerInfoOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu thông tin khách hàng");
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể lưu thông tin khách hàng",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-800 transition-all duration-300 hover:text-blue-900">
          CaslaQuartz AI
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8 flex-grow">
          <div className="flex flex-col space-y-4">
            <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
              <div className="lg:hidden">
                <Tabs defaultValue="input">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="input">Ảnh Gốc</TabsTrigger>
                    <TabsTrigger value="output">Kết Quả</TabsTrigger>
                  </TabsList>
                  <TabsContent value="input">
                    <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px] overflow-hidden">
                      <canvas
                        ref={inputCanvasRef}
                        className="max-w-full cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                      />
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
                        </div>
                      )}
                      {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                          <Loader2 className="h-12 w-12 text-blue-900 animate-spin mb-4" />
                          <p className="text-blue-900/70 text-lg">Đang xử lý ảnh...</p>
                          <div className="w-64 mt-4">
                            <Progress value={processingProgress} className="h-2" />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="output">
                    <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px]">
                      <canvas ref={outputCanvasRef} />
                      {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                          <Loader2 className="h-12 w-12 text-blue-900 animate-spin mb-4" />
                          <p className="text-blue-900/70 text-lg">Đang xử lý ảnh...</p>
                          <div className="w-64 mt-4">
                            <Progress value={processingProgress} className="h-2" />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {image && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button onClick={() => fileInputRef.current?.click()} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
                      <Upload className="h-5 w-5" />
                    </Button>
                    <Button onClick={handleUndo} disabled={pathsHistory.length === 0} className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50">
                      <Undo className="h-5 w-5" />
                    </Button>
                    <Button onClick={handleRedo} disabled={redoStack.length === 0} className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50">
                      <Redo className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-medium text-blue-900">Tải Ảnh & Chọn Vật Thể</h2>
                  <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[400px] overflow-hidden">
                    <canvas
                      ref={inputCanvasRef}
                      className="max-w-full cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                    />
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
                      </div>
                    )}
                    {image && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <Button onClick={handleZoomIn} size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleZoomOut} size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-medium text-blue-900">Kết Quả Xử Lý</h2>
                  <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[400px]">
                    <canvas ref={outputCanvasRef} />
                    {isProcessing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                        <Loader2 className="h-12 w-12 text-blue-900 animate-spin mb-4" />
                        <p className="text-blue-900/70 text-lg">Đang xử lý ảnh...</p>
                        <div className="w-64 mt-4">
                          <Progress value={processingProgress} className="h-2" />
                          <p className="text-xs text-center mt-1 text-blue-900/70">{processingProgress}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Dialog open={isCustomerInfoOpen} onOpenChange={setIsCustomerInfoOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={downloadImage}
                        disabled={!inpaintedImage}
                        className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Tải kết quả
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-blue-900">Thông Tin Khách Hàng</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                          Vui lòng điền đầy đủ thông tin dưới đây để tải kết quả xử lý ảnh. Các thông tin này sẽ giúp
                          chúng tôi phục vụ bạn tốt hơn.
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
                            placeholder="Ví dụ: 0901234567"
                            className={`w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                              error && !/^\d{9,11}$/.test(customerInfo.phone) ? "border-red-500" : ""
                            }`}
                          />
                          <p className="text-xs text-gray-500">
                            {error && !/^\d{9,11}$/.test(customerInfo.phone) ? (
                              <span className="text-red-500">Số điện thoại phải từ 9-11 chữ số.</span>
                            ) : (
                              "Vui lòng nhập số điện thoại chính xác (9-11 số)."
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Địa Chỉ Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                            required
                            type="email"
                            placeholder="Ví dụ: tencuaban@email.com"
                            className={`w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                              error && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email) ? "border-red-500" : ""
                            }`}
                          />
                          <p className="text-xs text-gray-500">
                            {error && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email) ? (
                              <span className="text-red-500">Email không hợp lệ.</span>
                            ) : (
                              "Email sẽ được sử dụng để liên hệ và gửi thông tin."
                            )}
                          </p>
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
                            placeholder="Ví dụ: Thiết kế nội thất, Kiến trúc"
                            className={`w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                              error && !customerInfo.field.trim() ? "border-red-500" : ""
                            }`}
                          />
                          <p className="text-xs text-gray-500">
                            {error && !customerInfo.field.trim() ? (
                              <span className="text-red-500">Vui lòng nhập lĩnh vực công tác.</span>
                            ) : (
                              "Thông tin này giúp chúng tôi hiểu rõ hơn về nhu cầu của bạn."
                            )}
                          </p>
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 transition-all duration-200"
                          disabled={isSubmittingInfo}
                        >
                          {isSubmittingInfo ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Đang Xử Lý...
                            </>
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
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => fileInputRef.current?.click()} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
                        <Upload className="h-4 w-4 mr-2" />
                        Tải ảnh mới
                      </Button>
                      <Button onClick={handleUndo} disabled={pathsHistory.length === 0} className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50">
                        <Undo className="h-4 w-4 mr-2" />
                        Hoàn tác
                      </Button>
                      <Button onClick={handleRedo} disabled={redoStack.length === 0} className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50">
                        <Redo className="h-4 w-4 mr-2" />
                        Làm lại
                      </Button>
                      <Button onClick={handleZoomIn} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleZoomOut} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={!image || isProcessing || !selectedProduct || paths.length === 0}
                      className="bg-blue-900 hover:bg-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>

          <div className="hidden lg:flex flex-col space-y-4">
            <Card className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-md h-full">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-xl font-medium text-blue-900">CaslaQuartz Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[400px] rounded-md border border-gray-200 bg-gray-50 p-4 mt-4">
                  {Object.entries(productGroups).map(([groupName, products]) => (
                    <div key={groupName} className="mb-4">
                      <div
                        className="flex items-center justify-between text-sm font-semibold text-blue-900 uppercase tracking-wide border-b border-gray-300 pb-1 cursor-pointer"
                        onClick={() => toggleGroup(groupName)}
                      >
                        <span>{groupName}</span>
                        {expandedGroups[groupName] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                      {expandedGroups[groupName] && (
                        <div className="flex flex-col gap-2 mt-2">
                          {products.map((product) => (
                            <Button
                              key={product.name}
                              onClick={() => setSelectedProduct(product.name)}
                              className={`w-full text-left justify-start py-2 px-4 text-sm transition-all ${
                                selectedProduct === product.name
                                  ? "bg-blue-900 text-white hover:bg-blue-800"
                                  : "bg-white text-blue-900 hover:bg-gray-100"
                              }`}
                            >
                              {product.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        <footer className="mt-12 py-4 text-center text-sm text-blue-900/70">
          <p>Liên hệ: support@caslaquartz.com | Hotline: 1234-567-890</p>
          <p>© 2025 CaslaQuartz. All rights reserved.</p>
        </footer>
      </div>
    </TooltipProvider>
  );
}

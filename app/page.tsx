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
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIsMobile } from "@/hooks/use-mobile"

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
  Object.values(productGroups).flat().map((item) => [
    item.name,
    `/product_images/${item.name.split(" - ")[0]}.jpg`,
  ])
);

export const dynamic = "force-dynamic";

export default function ImageInpaintingApp() {
  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [originalImageData, setOriginalImageData] = useState<string>("")
  const [resizedImageData, setResizedImageData] = useState<string>("")
  const [brushSize, setBrushSize] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isErasing, setIsErasing] = useState(false)
  const [maskOpacity, setMaskOpacity] = useState(0.5)
  const [isProcessing, setIsProcessing] = useState(false)
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [paths, setPaths] = useState<Path[]>([])
  const [pathsHistory, setPathsHistory] = useState<Path[][]>([])
  const [redoStack, setRedoStack] = useState<Path[][]>([])
  const [activeCanvas, setActiveCanvas] = useState<"canvas1" | "canvas2" | null>(null)
  const [isBrushSizeOpen, setIsBrushSizeOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 })
  const [showTutorial, setShowTutorial] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.keys(productGroups).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  // Customer info states
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    phone: "",
    email: "",
    field: "",
  })
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false)

  // Refs
  const inputCanvasRef = useRef<HTMLCanvasElement>(null)
  const outputCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const uploadButtonRef = useRef<HTMLButtonElement>(null)

  const { processInpainting } = useInpainting()
  const { toast } = useToast()
  const isMobile = useMobile()

  // useEffect khởi tạo canvas
  useEffect(() => {
    const initCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#F3F4F6"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    // Khởi tạo Canvas 1
    initCanvas(inputCanvasRef.current)

    // Khởi tạo Canvas 2 với ảnh placeholder
    const outputCanvas = outputCanvasRef.current
    if (outputCanvas) {
      const ctx = outputCanvas.getContext("2d")
      if (ctx) {
        const placeholderImg = new Image()
        placeholderImg.src = "/logo2048.jpg"
        placeholderImg.crossOrigin = "anonymous"
        placeholderImg.onload = () => {
          const maxWidth = outputCanvas.parentElement?.clientWidth || 500
          const aspectRatio = placeholderImg.width / placeholderImg.height
          const canvasWidth = Math.min(placeholderImg.width, maxWidth)
          const canvasHeight = canvasWidth / aspectRatio

          outputCanvas.width = canvasWidth
          outputCanvas.height = canvasHeight
          ctx.drawImage(placeholderImg, 0, 0, canvasWidth, canvasHeight)
        }
        placeholderImg.onerror = () => {
          console.error("Không thể tải ảnh placeholder /logo2048.jpg")
          initCanvas(outputCanvas)
        }
      }
    }

    // Create mask canvas
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement("canvas")
    }

    // Hiển thị hướng dẫn cho người dùng mới
    const hasSeenTutorial = localStorage.getItem("caslaquartz-tutorial-seen")
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }

    // Xử lý sự kiện phím tắt
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        handleRedo()
      } else if (e.key === "e") {
        setIsErasing(!isErasing)
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn()
      } else if (e.key === "-") {
        handleZoomOut()
      } else if (e.key === "0") {
        setZoomLevel(1)
        setPanOffset({ x: 0, y: 0 })
        updateCanvasTransform()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isErasing])

  // Cập nhật transform của canvas khi zoom hoặc pan thay đổi
  useEffect(() => {
    updateCanvasTransform()
  }, [zoomLevel, panOffset])

  const updateCanvasTransform = () => {
    const inputCanvas = inputCanvasRef.current
    if (!inputCanvas) return

    const ctx = inputCanvas.getContext("2d")
    if (!ctx) return

    // Lưu trạng thái hiện tại
    ctx.save()

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Xóa canvas
    ctx.clearRect(0, 0, inputCanvas.width, inputCanvas.height)

    // Áp dụng transform mới
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoomLevel, zoomLevel)

    // Vẽ lại ảnh
    if (image && resizedImageData) {
      const resizedImg = new Image()
      resizedImg.crossOrigin = "anonymous"
      resizedImg.onload = () => {
        ctx.drawImage(resizedImg, 0, 0, inputCanvas.width / zoomLevel, inputCanvas.height / zoomLevel)

        // Vẽ mask
        if (maskCanvasRef.current) {
          ctx.globalAlpha = maskOpacity
          ctx.drawImage(maskCanvasRef.current, 0, 0, inputCanvas.width / zoomLevel, inputCanvas.height / zoomLevel)
          ctx.globalAlpha = 1.0
        }

        // Khôi phục trạng thái
        ctx.restore()
      }
      resizedImg.src = resizedImageData
    } else {
      // Khôi phục trạng thái
      ctx.restore()
    }
  }

  const resizeImage = (img: HTMLImageElement, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!img || maxWidth <= 0) {
        reject(new Error("Ảnh hoặc maxWidth không hợp lệ"))
        return
      }
      const aspectRatio = img.width / img.height
      const canvasWidth = Math.min(img.width, maxWidth)
      const canvasHeight = canvasWidth / aspectRatio
      if (canvasHeight <= 0) {
        reject(new Error("Tỷ lệ ảnh không hợp lệ"))
        return
      }

      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvasWidth
      tempCanvas.height = canvasHeight
      const ctx = tempCanvas.getContext("2d")

      if (!ctx) {
        tempCanvas.remove()
        reject(new Error("Không thể tạo context cho canvas tạm"))
        return
      }

      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
      const result = tempCanvas.toDataURL("image/png")
      tempCanvas.remove()
      resolve(result)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Kiểm tra kích thước file
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh không được vượt quá 10MB",
          variant: "destructive",
        })
        return
      }

      // Kiểm tra định dạng file
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Lỗi",
          description: "Chỉ hỗ trợ định dạng JPG, PNG và WebP",
          variant: "destructive",
        })
        return
      }

      setPaths([])
      setPathsHistory([])
      setRedoStack([])
      setInpaintedImage(null)
      setError(null)
      setActiveCanvas("canvas1")
      setZoomLevel(1)
      setPanOffset({ x: 0, y: 0 })

      // Hiển thị thông báo đang xử lý
      toast({
        title: "Đang xử lý",
        description: "Đang tải ảnh lên...",
      })

      const reader = new FileReader()
      reader.onload = async (event) => {
        if (!event.target?.result) {
          toast({
            title: "Lỗi",
            description: "Không thể đọc file ảnh",
            variant: "destructive",
          })
          return
        }

        const img = new window.Image()
        img.onload = async () => {
          try {
            const tempCanvas = document.createElement("canvas")
            tempCanvas.width = img.width
            tempCanvas.height = img.height
            const ctx = tempCanvas.getContext("2d")
            if (!ctx) {
              tempCanvas.remove()
              throw new Error("Không thể tạo context cho canvas tạm")
            }
            ctx.drawImage(img, 0, 0)
            const originalData = tempCanvas.toDataURL("image/png")
            setOriginalImageData(originalData)
            tempCanvas.remove()

            const maxWidth = inputCanvasRef.current?.parentElement?.clientWidth || 500
            const resizedData = await resizeImage(img, maxWidth)
            setResizedImageData(resizedData)
            setImage(img)
            drawImageOnCanvas(img, resizedData)

            toast({
              title: "Thành công",
              description: "Đã tải ảnh lên thành công",
            })
          } catch (err) {
            toast({
              title: "Lỗi",
              description: err instanceof Error ? err.message : "Không thể xử lý ảnh",
              variant: "destructive",
            })
            setError(err instanceof Error ? err.message : "Không thể xử lý ảnh")
          }
        }
        img.onerror = () => {
          toast({
            title: "Lỗi",
            description: "Không thể tải ảnh",
            variant: "destructive",
          })
          setError("Không thể tải ảnh")
        }
        img.src = event.target.result as string
        img.crossOrigin = "anonymous"
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error in handleImageUpload:", err)
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải ảnh lên",
        variant: "destructive",
      })
    }
  }

  const handleManualImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const drawImageOnCanvas = (img: HTMLImageElement, resizedData: string) => {
    const inputCanvas = inputCanvasRef.current
    const outputCanvas = outputCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!inputCanvas || !maskCanvas) return

    const maxWidth = inputCanvas.parentElement?.clientWidth || 500
    const aspectRatio = img.width / img.height
    const canvasWidth = Math.min(img.width, maxWidth)
    const canvasHeight = canvasWidth / aspectRatio
    if (canvasWidth <= 0 || canvasHeight <= 0) return

    inputCanvas.width = canvasWidth
    inputCanvas.height = canvasHeight
    if (outputCanvas) {
      outputCanvas.width = canvasWidth
      outputCanvas.height = canvasHeight
    }
    maskCanvas.width = canvasWidth
    maskCanvas.height = canvasHeight

    const inputCtx = inputCanvas.getContext("2d")
    if (inputCtx) {
      const resizedImg = new Image()
      resizedImg.crossOrigin = "anonymous"
      resizedImg.onload = () => inputCtx.drawImage(resizedImg, 0, 0, canvasWidth, canvasHeight)
      resizedImg.onerror = () => setError("Không thể vẽ ảnh đã resize")
      resizedImg.src = resizedData
    }

    const maskCtx = maskCanvas.getContext("2d")
    if (maskCtx) maskCtx.clearRect(0, 0, canvasWidth, canvasHeight)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!inputCanvasRef.current || !maskCanvasRef.current || !image) return

    // Nếu đang pan thì không vẽ
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      startPanning(e)
      return
    }

    setIsDrawing(true)
    setIsErasing(e.button === 2 || e.ctrlKey || e.metaKey)
    setActiveCanvas("canvas1")

    const rect = inputCanvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel

    const maskCtx = maskCanvasRef.current.getContext("2d")
    if (!maskCtx) return

    maskCtx.lineCap = "round"
    maskCtx.lineJoin = "round"
    maskCtx.strokeStyle = isErasing ? "black" : "white"
    maskCtx.lineWidth = brushSize

    maskCtx.beginPath()
    maskCtx.moveTo(x, y)

    // Lưu trạng thái hiện tại vào history trước khi thêm path mới
    setPathsHistory((prev) => [...prev, [...paths]])
    setRedoStack([])

    setPaths((prev) => [...prev, { points: [{ x, y }], color: isErasing ? "black" : "white", width: brushSize }])

    updateMaskPreview()
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      continuePanning(e)
      return
    }

    if (!isDrawing || !inputCanvasRef.current || !maskCanvasRef.current || !image) return

    const rect = inputCanvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel

    const maskCtx = maskCanvasRef.current.getContext("2d")
    if (!maskCtx) return

    const currentPath = paths[paths.length - 1]
    if (!currentPath || currentPath.points.length === 0) return

    const lastPoint = currentPath.points[currentPath.points.length - 1]

    maskCtx.quadraticCurveTo(lastPoint.x, lastPoint.y, (x + lastPoint.x) / 2, (y + lastPoint.y) / 2)
    maskCtx.stroke()
    maskCtx.beginPath()
    maskCtx.moveTo((x + lastPoint.x) / 2, (y + lastPoint.y) / 2)

    setPaths((prev) => {
      const newPaths = [...prev]
      const currentPath = newPaths[newPaths.length - 1]
      currentPath.points.push({ x, y })
      return newPaths
    })

    updateMaskPreview()
  }

  const stopDrawing = () => {
    if (isPanning) {
      stopPanning()
      return
    }

    if (!maskCanvasRef.current) return
    const maskCtx = maskCanvasRef.current.getContext("2d")
    if (!maskCtx) return

    setIsDrawing(false)
    maskCtx.closePath()
    updateMaskPreview()
  }

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!inputCanvasRef.current || !maskCanvasRef.current || !image) return

    // Xử lý multi-touch
    if (e.touches.length > 1) {
      // Xử lý zoom/pan với 2 ngón tay
      return
    }

    setIsDrawing(true)
    setActiveCanvas("canvas1")

    const rect = inputCanvasRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = (touch.clientX - rect.left - panOffset.x) / zoomLevel
    const y = (touch.clientY - rect.top - panOffset.y) / zoomLevel

    const maskCtx = maskCanvasRef.current.getContext("2d")
    if (!maskCtx) return

    maskCtx.lineCap = "round"
    maskCtx.lineJoin = "round"
    maskCtx.strokeStyle = isErasing ? "black" : "white"
    maskCtx.lineWidth = brushSize

    maskCtx.beginPath()
    maskCtx.moveTo(x, y)

    // Lưu trạng thái hiện tại vào history
    setPathsHistory((prev) => [...prev, [...paths]])
    setRedoStack([])

    setPaths((prev) => [...prev, { points: [{ x, y }], color: isErasing ? "black" : "white", width: brushSize }])

    updateMaskPreview()
  }

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !inputCanvasRef.current || !maskCanvasRef.current || !image) return

    // Xử lý multi-touch
    if (e.touches.length > 1) {
      // Xử lý zoom/pan với 2 ngón tay
      return
    }

    const rect = inputCanvasRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = (touch.clientX - rect.left - panOffset.x) / zoomLevel
    const y = (touch.clientY - rect.top - panOffset.y) / zoomLevel

    const maskCtx = maskCanvasRef.current.getContext("2d")
    if (!maskCtx) return

    const currentPath = paths[paths.length - 1]
    if (!currentPath || currentPath.points.length === 0) return

    const lastPoint = currentPath.points[currentPath.points.length - 1]

    maskCtx.quadraticCurveTo(lastPoint.x, lastPoint.y, (x + lastPoint.x) / 2, (y + lastPoint.y) / 2)
    maskCtx.stroke()
    maskCtx.beginPath()
    maskCtx.moveTo((x + lastPoint.x) / 2, (y + lastPoint.y) / 2)

    setPaths((prev) => {
      const newPaths = [...prev]
      const currentPath = newPaths[newPaths.length - 1]
      currentPath.points.push({ x, y })
      return newPaths
    })

    updateMaskPreview()
  }

  const stopDrawingTouch = () => {
    if (!maskCanvasRef.current) return
    const maskCtx = maskCanvasRef.current.getContext("2d")
    if (!maskCtx) return

    setIsDrawing(false)
    maskCtx.closePath()
    updateMaskPreview()
  }

  const startPanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true)
    setLastPanPosition({ x: e.clientX, y: e.clientY })
  }

  const continuePanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return

    const deltaX = e.clientX - lastPanPosition.x
    const deltaY = e.clientY - lastPanPosition.y

    setPanOffset((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))

    setLastPanPosition({ x: e.clientX, y: e.clientY })
  }

  const stopPanning = () => {
    setIsPanning(false)
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.5))
  }

  const handleUndo = () => {
    if (pathsHistory.length === 0) return

    // Lưu trạng thái hiện tại vào redo stack
    setRedoStack((prev) => [...prev, paths])

    // Khôi phục trạng thái trước đó
    const previousPaths = pathsHistory[pathsHistory.length - 1]
    setPaths(previousPaths)

    // Cập nhật history
    setPathsHistory((prev) => prev.slice(0, -1))

    // Vẽ lại canvas
    setTimeout(() => {
      redrawCanvas()
    }, 0)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return

    // Lưu trạng thái hiện tại vào history
    setPathsHistory((prev) => [...prev, paths])

    // Khôi phục trạng thái từ redo stack
    const nextPaths = redoStack[redoStack.length - 1]
    setPaths(nextPaths)

    // Cập nhật redo stack
    setRedoStack((prev) => prev.slice(0, -1))

    // Vẽ lại canvas
    setTimeout(() => {
      redrawCanvas()
    }, 0)
  }

  const redrawCanvas = () => {
    const inputCanvas = inputCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!inputCanvas || !maskCanvas || !image) return

    const maskCtx = maskCanvas.getContext("2d")
    if (!maskCtx) return

    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

    maskCtx.lineCap = "round"
    maskCtx.lineJoin = "round"

    paths.forEach((path) => {
      if (path.points.length === 0) return

      maskCtx.beginPath()
      maskCtx.strokeStyle = path.color
      maskCtx.lineWidth = path.width

      if (path.points.length === 1) {
        const point = path.points[0]
        maskCtx.arc(point.x, point.y, path.width / 2, 0, Math.PI * 2)
        maskCtx.fillStyle = path.color
        maskCtx.fill()
      } else {
        maskCtx.moveTo(path.points[0].x, path.points[0].y)
        for (let i = 0; i < path.points.length - 1; i++) {
          const xc = (path.points[i].x + path.points[i + 1].x) / 2
          const yc = (path.points[i].y + path.points[i + 1].y) / 2
          maskCtx.quadraticCurveTo(path.points[i].x, path.points[i].y, xc, yc)
        }
        maskCtx.stroke()
      }
    })

    updateMaskPreview()
  }

  const updateMaskPreview = () => {
    const inputCanvas = inputCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!inputCanvas || !maskCanvas || !image) return

    const inputCtx = inputCanvas.getContext("2d")
    if (!inputCtx) return

    const resizedImg = new Image()
    resizedImg.crossOrigin = "anonymous"
    resizedImg.onload = () => {
      inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height)

      // Áp dụng transform
      inputCtx.save()
      inputCtx.translate(panOffset.x, panOffset.y)
      inputCtx.scale(zoomLevel, zoomLevel)

      // Vẽ ảnh gốc
      inputCtx.drawImage(resizedImg, 0, 0, inputCanvas.width / zoomLevel, inputCanvas.height / zoomLevel)

      // Vẽ mask với độ trong suốt
      inputCtx.globalAlpha = maskOpacity
      inputCtx.drawImage(maskCanvas, 0, 0, inputCanvas.width / zoomLevel, inputCanvas.height / zoomLevel)
      inputCtx.globalAlpha = 1.0

      // Khôi phục transform
      inputCtx.restore()
    }
    resizedImg.onerror = () => setError("Không thể cập nhật preview mask")
    resizedImg.src = resizedImageData
  }

  const deletePathAtPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return

    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const rect = maskCanvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel

    let closestPathIndex = -1
    let minDistance = Number.POSITIVE_INFINITY

    paths.forEach((path, index) => {
      path.points.forEach((point) => {
        const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
        if (distance < minDistance) {
          minDistance = distance
          closestPathIndex = index
        }
      })
    })

    if (closestPathIndex !== -1 && minDistance < 10) {
      // Lưu trạng thái hiện tại vào history
      setPathsHistory((prev) => [...prev, [...paths]])
      setRedoStack([])

      setPaths((prev) => prev.filter((_, i) => i !== closestPathIndex))
      redrawCanvas()

      toast({
        title: "Đã xóa đường vẽ",
        description: "Đã xóa đường vẽ tại vị trí đã chọn",
      })
    }
  }

  const handleProductSelect = (productName: string) => {
    if (!products[productName as keyof typeof products]) {
      setError("Sản phẩm không hợp lệ")
      return
    }
    setSelectedProduct(productName)
    setError(null)

    toast({
      title: "Đã chọn sản phẩm",
      description: `Đã chọn sản phẩm: ${productName}`,
    })
  }

  const saveCanvasState = () => {
    const canvas = inputCanvasRef.current
    if (!canvas) {
      setError("Không thể lưu canvas vì canvas không tồn tại")
      return
    }
    const dataURL = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = "canvas-state.png"
    link.href = dataURL
    link.click()
    link.remove()

    toast({
      title: "Đã lưu ảnh",
      description: "Đã lưu trạng thái hiện tại của canvas",
    })
  }

  const handleResetCanvas = () => {
    setImage(null)
    setPaths([])
    setPathsHistory([])
    setRedoStack([])
    setInpaintedImage(null)
    setError(null)
    setOriginalImageData("")
    setResizedImageData("")
    setActiveCanvas(null)
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })

    const inputCanvas = inputCanvasRef.current
    if (inputCanvas) {
      const ctx = inputCanvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#F3F4F6"
        ctx.fillRect(0, 0, inputCanvas.width, inputCanvas.height)
      }
    }

    const outputCanvas = outputCanvasRef.current
    if (outputCanvas) {
      const ctx = outputCanvas.getContext("2d")
      if (ctx) {
        const placeholderImg = new Image()
        placeholderImg.src = "/logo2048.jpg"
        placeholderImg.crossOrigin = "anonymous"
        placeholderImg.onload = () => {
          const maxWidth = outputCanvas.parentElement?.clientWidth || 500
          const aspectRatio = placeholderImg.width / placeholderImg.height
          const canvasWidth = Math.min(placeholderImg.width, maxWidth)
          const canvasHeight = canvasWidth / aspectRatio

          outputCanvas.width = canvasWidth
          outputCanvas.height = canvasHeight
          ctx.drawImage(placeholderImg, 0, 0, canvasWidth, canvasHeight)
        }
        placeholderImg.onerror = () => {
          ctx.fillStyle = "#F3F4F6"
          ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
        }
      }
    }

    toast({
      title: "Đã làm mới",
      description: "Đã làm mới toàn bộ canvas",
    })
  }

  const handleClearMask = () => {
    if (paths.length === 0) {
      toast({
        title: "Thông báo",
        description: "Không có mask nào để xóa",
      })
      return
    }

    // Lưu trạng thái hiện tại vào history
    setPathsHistory((prev) => [...prev, [...paths]])
    setRedoStack([])

    setPaths([])
    redrawCanvas()

    toast({
      title: "Đã xóa mask",
      description: "Đã xóa toàn bộ mask",
    })
  }

  const toggleDrawEraseMode = () => {
    setIsErasing(!isErasing)
    toast({
      title: isErasing ? "Chế độ vẽ" : "Chế độ xóa",
      description: isErasing ? "Đã chuyển sang chế độ vẽ" : "Đã chuyển sang chế độ xóa",
    })
  }

  const convertImageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Không thể tạo context cho canvas"))
          return
        }
        ctx.drawImage(img, 0, 0)
        const base64 = canvas.toDataURL("image/png")
        canvas.remove()
        resolve(base64)
      }
      img.onerror = () => reject(new Error("Không thể tải ảnh sản phẩm"))
      img.src = url
    })
  }

  const addWatermark = async (imageData: string): Promise<string> => {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageData

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Không thể tải ảnh từ ${imageData}`))
      })

      console.log("Đã tải ảnh để đóng dấu:", img.width, img.height)

      const logo = new Image()
      logo.crossOrigin = "anonymous"
      logo.src = "/logo.png"
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve()
        logo.onerror = () => reject(new Error("Không thể tải logo watermark từ /logo.png"))
      })

      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Không thể tạo context cho canvas")

      ctx.drawImage(img, 0, 0)
      const logoSize = img.width * 0.15 // Giảm kích thước logo
      const logoX = img.width - logoSize - 20
      const logoY = img.height - logoSize - 20

      // Thêm hiệu ứng trong suốt cho logo
      ctx.globalAlpha = 0.7
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
      ctx.globalAlpha = 1.0

      const result = canvas.toDataURL("image/png")
      canvas.remove()
      return result
    } catch (error) {
      console.error("Error in addWatermark:", error)
      throw error instanceof Error ? error : new Error("Unknown error in addWatermark")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image || !selectedProduct) {
      toast({
        title: "Lỗi",
        description: "Vui lòng tải ảnh và chọn sản phẩm trước khi xử lý",
        variant: "destructive",
      })
      setError("Vui lòng tải ảnh và chọn sản phẩm trước khi xử lý")
      return
    }

    if (paths.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng vẽ mask trước khi xử lý",
        variant: "destructive",
      })
      setError("Vui lòng vẽ mask trước khi xử lý")
      return
    }

    try {
      setIsProcessing(true)
      setError(null)
      setActiveCanvas("canvas2")
      setProcessingProgress(10)

      // Hiển thị thông báo đang xử lý
      toast({
        title: "Đang xử lý",
        description: "Đang chuẩn bị dữ liệu...",
      })

      const maskImage = await getCombinedImage()
      setProcessingProgress(30)

      const productImagePath = products[selectedProduct as keyof typeof products]
      const productImageBase64 = await convertImageToBase64(productImagePath)
      setProcessingProgress(50)

      // Debug dữ liệu đầu vào
      console.log("Input data for inpainting:", {
        originalImage: originalImageData.substring(0, 50),
        productImage: productImageBase64.substring(0, 50),
        maskImage: maskImage.substring(0, 50),
        originalImageSize: { width: image.width, height: image.height },
      })

      toast({
        title: "Đang xử lý",
        description: "Đang gửi dữ liệu đến máy chủ AI...",
      })

      const resultUrl = await processInpainting(originalImageData, productImageBase64, maskImage)
      console.log("Result URL from TensorArt:", resultUrl)
      setProcessingProgress(80)

      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(resultUrl)}`
      console.log("Proxied URL:", proxiedUrl)

      toast({
        title: "Đang xử lý",
        description: "Đang thêm watermark...",
      })

      const watermarkedImageUrl = await addWatermark(proxiedUrl)
      setInpaintedImage(watermarkedImageUrl)
      setProcessingProgress(100)

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        console.log("Image loaded successfully:", img.width, img.height)
        drawResultOnCanvas(img)

        toast({
          title: "Thành công",
          description: "Đã xử lý ảnh thành công",
        })
      }
      img.onerror = () => {
        console.error("Failed to load watermarked image:", watermarkedImageUrl)
        setError("Không thể tải ảnh kết quả sau khi thêm watermark")

        toast({
          title: "Lỗi",
          description: "Không thể tải ảnh kết quả sau khi thêm watermark",
          variant: "destructive",
        })
      }
      img.src = watermarkedImageUrl
    } catch (err) {
      console.error("Error in handleSubmit:", err)
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định")

      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  const drawResultOnCanvas = (img: HTMLImageElement) => {
    const inputCanvas = inputCanvasRef.current
    const outputCanvas = outputCanvasRef.current
    if (!inputCanvas) {
      console.error("Input canvas ref is null")
      setError("Canvas không khả dụng")
      return
    }
    const inputCtx = inputCanvas.getContext("2d")
    if (!inputCtx) {
      console.error("Input canvas context is null")
      setError("Không thể lấy context của canvas")
      return
    }

    if (img.width === 0 || img.height === 0) {
      console.error("Image has invalid dimensions:", img.width, img.height)
      setError("Kích thước ảnh không hợp lệ")
      return
    }

    const maxWidth = inputCanvas.parentElement?.clientWidth || 500
    const aspectRatio = img.width / img.height
    const canvasWidth = Math.min(img.width, maxWidth)
    const canvasHeight = canvasWidth / aspectRatio

    inputCanvas.width = canvasWidth
    inputCanvas.height = canvasHeight
    if (outputCanvas) {
      outputCanvas.width = canvasWidth
      outputCanvas.height = canvasHeight
      const outputCtx = outputCanvas.getContext("2d")
      if (outputCtx) {
        outputCtx.clearRect(0, 0, canvasWidth, canvasHeight)
        outputCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
      }
    }

    inputCtx.clearRect(0, 0, canvasWidth, canvasHeight)
    inputCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
    console.log("Image drawn on canvas with size:", canvasWidth, canvasHeight)
  }

  const getCombinedImage = async (): Promise<string> => {
    const inputCanvas = inputCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!inputCanvas || !maskCanvas || !image) {
      throw new Error("Không tìm thấy canvas hoặc ảnh")
    }

    const originalMaskCanvas = document.createElement("canvas")
    originalMaskCanvas.width = image.width
    originalMaskCanvas.height = image.height
    const originalMaskCtx = originalMaskCanvas.getContext("2d")
    if (!originalMaskCtx) {
      originalMaskCanvas.remove()
      throw new Error("Không thể tạo context cho mask gốc")
    }

    const scaleX = image.width / inputCanvas.width
    const scaleY = image.height / inputCanvas.height
    console.log("Scale factors:", { scaleX, scaleY, inputWidth: inputCanvas.width, imageWidth: image.width })

    originalMaskCtx.clearRect(0, 0, image.width, image.height)
    originalMaskCtx.lineCap = "round"
    originalMaskCtx.lineJoin = "round"

    paths.forEach((path) => {
      if (path.points.length === 0) return

      originalMaskCtx.beginPath()
      originalMaskCtx.strokeStyle = path.color
      originalMaskCtx.lineWidth = path.width * scaleX

      if (path.points.length === 1) {
        const point = path.points[0]
        const scaledX = point.x * scaleX
        const scaledY = point.y * scaleY
        originalMaskCtx.arc(scaledX, scaledY, (path.width * scaleX) / 2, 0, Math.PI * 2)
        originalMaskCtx.fillStyle = path.color
        originalMaskCtx.fill()
      } else {
        originalMaskCtx.moveTo(path.points[0].x * scaleX, path.points[0].y * scaleY)
        for (let i = 0; i < path.points.length - 1; i++) {
          const xc = ((path.points[i].x + path.points[i + 1].x) / 2) * scaleX
          const yc = ((path.points[i].y + path.points[i + 1].y) / 2) * scaleY
          originalMaskCtx.quadraticCurveTo(path.points[i].x * scaleX, path.points[i].y * scaleY, xc, yc)
        }
        originalMaskCtx.stroke()
      }
    })

    const maskCanvasBW = document.createElement("canvas")
    maskCanvasBW.width = image.width
    maskCanvasBW.height = image.height
    const maskCtxBW = maskCanvasBW.getContext("2d")
    if (!maskCtxBW) {
      maskCanvasBW.remove()
      originalMaskCanvas.remove()
      throw new Error("Không thể tạo context cho mask BW")
    }

    const maskImageData = originalMaskCtx.getImageData(0, 0, image.width, image.height)
    const maskData = maskImageData.data

    for (let i = 0; i < maskData.length; i += 4) {
      const alpha = maskData[i + 3]
      maskCtxBW.fillStyle = alpha > 0 ? "white" : "black"
      maskCtxBW.fillRect((i / 4) % image.width, Math.floor(i / 4 / image.width), 1, 1)
    }

    const result = maskCanvasBW.toDataURL("image/png")
    console.log("Mask image generated:", result.substring(0, 50))

    maskCanvasBW.remove()
    originalMaskCanvas.remove()
    return result
  }

  const downloadImage = () => {
    if (!inpaintedImage) {
      toast({
        title: "Lỗi",
        description: "Không có ảnh kết quả để tải",
        variant: "destructive",
      })
      setError("Không có ảnh kết quả để tải")
      return
    }

    if (customerInfo.phone && customerInfo.email && customerInfo.field) {
      const link = document.createElement("a")
      link.download = "caslaquartz-result.png"
      link.href = inpaintedImage
      link.click()
      link.remove()

      toast({
        title: "Đã tải xuống",
        description: "Đã tải xuống ảnh kết quả thành công",
      })
    } else {
      setIsCustomerInfoOpen(true)
    }
  }

  const handleCustomerInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingInfo(true)

    // Regex cho validation
    const phoneRegex = /^\d{9,11}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // Kiểm tra từng trường
    if (!phoneRegex.test(customerInfo.phone)) {
      setError("Số điện thoại phải từ 9-11 chữ số.")
      setIsSubmittingInfo(false)
      return
    }
    if (!emailRegex.test(customerInfo.email)) {
      setError("Email không hợp lệ.")
      setIsSubmittingInfo(false)
      return
    }
    if (!customerInfo.field.trim()) {
      setError("Vui lòng nhập lĩnh vực công tác.")
      setIsSubmittingInfo(false)
      return
    }

    // Nếu tất cả hợp lệ, gửi API
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
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Lỗi khi gửi thông tin khách hàng")
      }

      const data = await response.json()
      console.log("Customer info saved to log:", data)

      // Reset error và tải ảnh
      setError(null)

      const link = document.createElement("a")
      link.download = "caslaquartz-result.png"
      link.href = inpaintedImage as string
      link.click()
      link.remove()

      toast({
        title: "Đã tải xuống",
        description: "Đã tải xuống ảnh kết quả thành công",
      })

      setIsCustomerInfoOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu thông tin khách hàng")
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể lưu thông tin khách hàng",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingInfo(false)
    }
  }

  const getProductQuote = () => {
    if (!selectedProduct) return "Vui lòng chọn một sản phẩm để xem thông tin."
    const allProducts = Object.values(productGroups).flat()
    const product = allProducts.find((p) => p.name === selectedProduct)
    return product ? product.quote : "Không tìm thấy thông tin sản phẩm."
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }

  const filteredProducts = () => {
    if (!searchTerm && !selectedGroup) return productGroups

    const result: typeof productGroups = {}

    Object.entries(productGroups).forEach(([groupName, products]) => {
      // Lọc theo nhóm nếu có
      if (selectedGroup && selectedGroup !== groupName) return

      // Lọc theo từ khóa tìm kiếm
      if (searchTerm) {
        const filtered = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
        if (filtered.length > 0) {
          result[groupName] = filtered
        }
      } else {
        result[groupName] = products
      }
    })

    return result
  }

  const closeTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem("caslaquartz-tutorial-seen", "true")
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="container mx-auto py-8 px-4 font-sans min-h-screen flex flex-col animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-800 transition-all duration-300 hover:text-blue-900">
          CaslaQuartz AI
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8 flex-grow">
          {/* Cột 1: Tải ảnh & Kết quả xử lý */}
          <div className="flex flex-col space-y-4">
            <Card className="p-6 flex flex-col gap-6 bg-white rounded-lg shadow-md">
              {/* Màn hình nhỏ: Chỉ hiển thị 1 canvas */}
              <div className="lg:hidden">
                <div
                  className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px] overflow-hidden"
                  ref={canvasContainerRef}
                >
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
                        onClick={handleManualImageUpload}
                        className="mt-4 bg-blue-900 hover:bg-blue-800 text-white pointer-events-auto"
                        ref={uploadButtonRef}
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
                      <div className="w-64 mt-4">
                        <Progress value={processingProgress} className="h-2" />
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-blue-900 font-medium">Ý nghĩa sản phẩm</p>
                        <p className="text-sm text-gray-700">{getProductQuote()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {image && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleManualImageUpload}
                          className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                        >
                          <Upload className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Tải ảnh mới</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={handleClearMask} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
                          <RefreshCw className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Xóa mask</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={toggleDrawEraseMode}
                          className={`${isErasing ? "bg-red-100 hover:bg-red-200" : "bg-gray-200 hover:bg-gray-300"} text-blue-900`}
                        >
                          {isErasing ? <Eraser className="h-5 w-5" /> : <Paintbrush className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isErasing ? "Chế độ xóa" : "Chế độ vẽ"}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setIsBrushSizeOpen(true)}
                          className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                        >
                          <span className="text-xs font-bold">{brushSize}px</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Kích thước bút vẽ</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleUndo}
                          disabled={pathsHistory.length === 0}
                          className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50"
                        >
                          <Undo className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Hoàn tác</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleRedo}
                          disabled={redoStack.length === 0}
                          className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50"
                        >
                          <Redo className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Làm lại</TooltipContent>
                    </Tooltip>

                    {isBrushSizeOpen && (
                      <div className="absolute z-10 bg-white p-4 rounded-md shadow-md">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-blue-900">Kích thước: {brushSize}px</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsBrushSizeOpen(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Slider
                          value={[brushSize]}
                          min={1}
                          max={50}
                          step={1}
                          onValueChange={(value) => setBrushSize(value[0])}
                          className="mt-1"
                        />
                        <div className="flex justify-between mt-2">
                          <span className="text-xs">1px</span>
                          <span className="text-xs">50px</span>
                        </div>
                        <div className="mt-2">
                          <label className="text-sm font-medium text-blue-900">
                            Độ mờ mask: {Math.round(maskOpacity * 100)}%
                          </label>
                          <Slider
                            value={[maskOpacity * 100]}
                            min={10}
                            max={80}
                            step={5}
                            onValueChange={(value) => {
                              setMaskOpacity(value[0] / 100)
                              updateMaskPreview()
                            }}
                            className="mt-1"
                          />
                        </div>
                        <Button onClick={() => setIsBrushSizeOpen(false)} className="mt-2 w-full">
                          <Check className="h-4 w-4 mr-2" />
                          Xác nhận
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
                  <div
                    className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px] overflow-hidden"
                    ref={canvasContainerRef}
                  >
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
                          onClick={handleManualImageUpload}
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
                    {image && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleZoomIn}
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            >
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Phóng to</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleZoomOut}
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            >
                              <ZoomOut className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Thu nhỏ</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                  {image && (
                    <Tabs defaultValue="info" className="w-full">
                      <TabsList className="grid w-full grid-cols-1 bg-blue-50 rounded-md">
                        <TabsTrigger
                          value="info"
                          className="data-[state=active]:bg-blue-900 data-[state=active]:text-white hover:bg-blue-100 transition-all duration-200"
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Hướng dẫn
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="info" className="space-y-2 mt-2">
                        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-900">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Chọn nhóm sản phẩm và sản phẩm từ cột bên phải</li>
                            <li>Vẽ mặt nạ lên vùng cần xử lý (chuột trái để vẽ, chuột phải để tẩy)</li>
                            <li>
                              Nhấn <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Z</kbd> để hoàn tác,{" "}
                              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Y</kbd> để làm lại
                            </li>
                            <li>
                              Giữ <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Alt</kbd> + chuột trái để di
                              chuyển ảnh
                            </li>
                            <li>Nhấn "Xử lý ảnh" để tạo kết quả</li>
                          </ul>
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </div>

                {/* Output Canvas */}
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-medium text-blue-900">Kết Quả Xử Lý</h2>
                  <div className="relative bg-gray-100 rounded-md flex items-center justify-center border border-gray-300 h-[300px]">
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
                  <div className="mt-2">
                    <Alert
                      className={`transition-all duration-500 ${isProcessing ? "animate-pulse bg-blue-50" : "bg-white"}`}
                    >
                      <AlertTitle className="text-blue-900 font-medium">Ý nghĩa sản phẩm</AlertTitle>
                      <AlertDescription className="text-sm text-gray-700">{getProductQuote()}</AlertDescription>
                    </Alert>
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

              {/* Các nút điều khiển (màn hình lớn) */}
              <div className="hidden lg:block">
                {image && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleManualImageUpload}
                            className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Tải ảnh mới
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Tải ảnh mới lên</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={handleClearMask} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Xóa mask
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Xóa toàn bộ mask đã vẽ</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={toggleDrawEraseMode}
                            className={`${isErasing ? "bg-red-100 hover:bg-red-200" : "bg-gray-200 hover:bg-gray-300"} text-blue-900`}
                          >
                            {isErasing ? <Eraser className="h-4 w-4 mr-2" /> : <Paintbrush className="h-4 w-4 mr-2" />}
                            {isErasing ? "Chế độ xóa" : "Chế độ vẽ"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Chuyển đổi giữa chế độ vẽ và xóa</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setIsBrushSizeOpen(true)}
                            className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                          >
                            <span className="text-xs font-bold mr-2">{brushSize}px</span>
                            Kích thước
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Điều chỉnh kích thước bút vẽ</TooltipContent>
                      </Tooltip>

                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleUndo}
                              disabled={pathsHistory.length === 0}
                              className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50"
                            >
                              <Undo className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hoàn tác (Ctrl+Z)</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleRedo}
                              disabled={redoStack.length === 0}
                              className="bg-gray-200 hover:bg-gray-300 text-blue-900 disabled:opacity-50"
                            >
                              <Redo className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Làm lại (Ctrl+Y)</TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleZoomIn} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Phóng to</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleZoomOut} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
                              <ZoomOut className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Thu nhỏ</TooltipContent>
                        </Tooltip>
                      </div>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowTutorial(true)}
                            className="bg-gray-200 hover:bg-gray-300 text-blue-900"
                          >
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Trợ giúp
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Hiển thị hướng dẫn sử dụng</TooltipContent>
                      </Tooltip>

                      {isBrushSizeOpen && (
                        <div className="absolute z-10 bg-white p-4 rounded-md shadow-md">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-blue-900">Kích thước: {brushSize}px</label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsBrushSizeOpen(false)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Slider
                            value={[brushSize]}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(value) => setBrushSize(value[0])}
                            className="mt-1"
                          />
                          <div className="flex justify-between mt-2">
                            <span className="text-xs">1px</span>
                            <span className="text-xs">50px</span>
                          </div>
                          <div className="mt-4">
                            <label className="text-sm font-medium text-blue-900">
                              Độ mờ mask: {Math.round(maskOpacity * 100)}%
                            </label>
                            <Slider
                              value={[maskOpacity * 100]}
                              min={10}
                              max={80}
                              step={5}
                              onValueChange={(value) => {
                                setMaskOpacity(value[0] / 100)
                                updateMaskPreview()
                              }}
                              className="mt-1"
                            />
                          </div>
                          <Button onClick={() => setIsBrushSizeOpen(false)} className="mt-4 w-full">
                            <Check className="h-4 w-4 mr-2" />
                            Xác nhận
                          </Button>
                        </div>
                      )}
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

            {/* CaslaQuartz Menu (màn hình nhỏ) */}
            <div className="lg:hidden">
              <Card className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-medium text-blue-900">CaslaQuartz Menu</h2>

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

                <ScrollArea className="h-[300px] w-full rounded-md border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-6">
                    {Object.entries(filteredProducts()).map(([groupName, products]) => (
                      <div key={groupName} className="flex flex-col gap-2">
                        <div
                          className="flex items-center justify-between text-sm font-semibold text-blue-900 uppercase tracking-wide border-b border-gray-300 pb-1 cursor-pointer"
                          onClick={() => toggleGroup(groupName)}
                        >
                          <span>{groupName}</span>
                          {expandedGroups[groupName] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>

                        {expandedGroups[groupName] && (
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
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-auto">
                  <Alert
                    className={`transition-all duration-500 ${isProcessing ? "animate-pulse bg-blue-50" : "bg-white"}`}
                  >
                    <AlertTitle className="text-blue-900 font-medium">Ý nghĩa sản phẩm</AlertTitle>
                    <AlertDescription className="text-sm text-gray-700">{getProductQuote()}</AlertDescription>
                  </Alert>
                </div>
                {image && (
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
                )}
                {inpaintedImage && (
                  <Dialog open={isCustomerInfoOpen} onOpenChange={setIsCustomerInfoOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={downloadImage} className="bg-gray-200 hover:bg-gray-300 text-blue-900">
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
                )}
              </Card>
            </div>
          </div>

          {/* Cột 2: CaslaQuartz Menu (màn hình lớn) */}
          <div className="hidden lg:flex flex-col space-y-4">
            <Card className="p-6 flex flex-col gap-4 bg-white rounded-lg shadow-md h-full">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-xl font-medium text-blue-900">CaslaQuartz Menu</CardTitle>
              </CardHeader>

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

              <div className="flex flex-wrap gap-2 mb-2">
                <Badge
                  variant={selectedGroup === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedGroup(null)}
                >
                  Tất cả
                </Badge>
                {Object.keys(productGroups).map((groupName) => (
                  <Badge
                    key={groupName}
                    variant={selectedGroup === groupName ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedGroup(groupName === selectedGroup ? null : groupName)}
                  >
                    {groupName}
                  </Badge>
                ))}
              </div>

              <ScrollArea className="flex-grow rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-6">
                  {Object.entries(filteredProducts()).map(([groupName, products]) => (
                    <div key={groupName} className="flex flex-col gap-2">
                      <div
                        className="flex items-center justify-between text-sm font-semibold text-blue-900 uppercase tracking-wide border-b border-gray-300 pb-1 cursor-pointer"
                        onClick={() => toggleGroup(groupName)}
                      >
                        <span>{groupName}</span>
                        {expandedGroups[groupName] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>

                      {expandedGroups[groupName] && (
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
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <CardFooter className="p-0 pt-2 flex flex-col gap-2">
                {selectedProduct && (
                  <Alert className="bg-blue-50 p-3">
                    <AlertTitle className="text-blue-900 font-medium">Sản phẩm đã chọn</AlertTitle>
                    <AlertDescription className="text-sm text-blue-900">{selectedProduct}</AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Hướng dẫn sử dụng */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-blue-900">Hướng dẫn sử dụng CaslaQuartz AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-blue-900">Tải ảnh và vẽ mask</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Nhấn nút <strong>Tải ảnh lên</strong> để chọn ảnh từ thiết bị của bạn
                    </li>
                    <li>
                      Sử dụng <strong>chuột trái</strong> để vẽ mask lên vùng cần thay thế
                    </li>
                    <li>
                      Sử dụng <strong>chuột phải</strong> hoặc chuyển sang <strong>chế độ xóa</strong> để xóa phần mask
                      không mong muốn
                    </li>
                    <li>
                      Điều chỉnh <strong>kích thước bút vẽ</strong> để vẽ chi tiết hơn
                    </li>
                    <li>
                      Sử dụng <strong>Ctrl+Z</strong> để hoàn tác và <strong>Ctrl+Y</strong> để làm lại
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-blue-900">Chọn sản phẩm</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Chọn một <strong>nhóm sản phẩm</strong> từ danh sách bên phải
                    </li>
                    <li>
                      Chọn <strong>sản phẩm cụ thể</strong> mà bạn muốn áp dụng vào ảnh
                    </li>
                    <li>
                      Sử dụng <strong>thanh tìm kiếm</strong> để tìm sản phẩm nhanh hơn
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-blue-900">Xử lý ảnh</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Nhấn nút <strong>Xử lý ảnh</strong> để bắt đầu quá trình xử lý
                    </li>
                    <li>Đợi trong khi hệ thống AI xử lý ảnh của bạn</li>
                    <li>Kết quả sẽ hiển thị ở bên phải (hoặc bên dưới trên thiết bị di động)</li>
                    <li>
                      Nhấn <strong>Tải kết quả</strong> để lưu ảnh đã xử lý về thiết bị của bạn
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-blue-900">Phím tắt</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Z</kbd>
                      <span>Hoàn tác</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+Y</kbd>
                      <span>Làm lại</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">E</kbd>
                      <span>Chuyển đổi chế độ vẽ/xóa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Alt + Chuột</kbd>
                      <span>Di chuyển ảnh</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={closeTutorial} className="bg-blue-900 hover:bg-blue-800 text-white">
                  <Check className="h-4 w-4 mr-2" />
                  Đã hiểu
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <footer className="mt-12 py-4 text-center text-sm text-blue-900/70">
          <p>Liên hệ: support@caslaquartz.com | Hotline: 1234-567-890</p>
          <p>© 2025 CaslaQuartz. All rights reserved.</p>
        </footer>
      </div>
    </TooltipProvider>
  )
}



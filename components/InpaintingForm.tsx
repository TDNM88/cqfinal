'use client' // Đánh dấu component này chạy trên client-side

import { useState, useRef, useEffect } from 'react'
import { useInpainting } from '../hooks/useInpainting'

export default function InpaintingForm() {
  const [imageData, setImageData] = useState('')
  const [maskData, setMaskData] = useState('')
  const { loading, error, resultUrl, processInpainting } = useInpainting()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Khởi tạo canvas khi ảnh được tải
  useEffect(() => {
    if (imageData && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.src = imageData
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
        }
      }
    }
  }, [imageData])

  // Bắt đầu vẽ mask
  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
      }
    }
  }

  // Vẽ mask
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.89)' // Màu đỏ với độ trong suốt
      ctx.lineWidth = 10
      ctx.stroke()
    }
  }

  // Kết thúc vẽ mask
  const endDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.closePath()
      }
    }
  }

  // Lấy mask từ canvas
  const getMaskData = () => {
    const canvas = canvasRef.current
    if (canvas) {
      return canvas.toDataURL() // Chuyển canvas thành base64
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const mask = getMaskData()
    if (!mask) {
      alert('Vui lòng vẽ mask trên ảnh trước khi tạo ảnh.')
      return
    }
    await processInpainting(imageData, mask)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Hình ảnh sản phẩm:</label>
        <input
          type="text"
          value={imageData}
          onChange={(e) => setImageData(e.target.value)}
          placeholder="Nhập URL hình ảnh sản phẩm"
        />
      </div>
      {imageData && (
        <div>
          <label>Vẽ mask trên ảnh:</label>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            style={{ border: '1px solid black', cursor: 'crosshair' }}
          />
        </div>
      )}
      <button type="submit" disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Tạo ảnh'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {resultUrl && (
        <div>
          <p>Kết quả:</p>
          <img src={resultUrl} alt="Kết quả inpainting" />
          <a href={resultUrl} download="result.png">Tải ảnh về máy</a>
        </div>
      )}
    </form>
  )
} 
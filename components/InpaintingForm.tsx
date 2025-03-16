import { useState } from 'react'
import { useInpainting } from '../hooks/useInpainting'

export default function InpaintingForm() {
  const [imageData, setImageData] = useState('')
  const [maskData, setMaskData] = useState('')
  const { loading, error, resultUrl, processInpainting } = useInpainting()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await processInpainting(imageData, maskData)
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
      <div>
        <label>Hình ảnh mask:</label>
        <input
          type="text"
          value={maskData}
          onChange={(e) => setMaskData(e.target.value)}
          placeholder="Nhập URL hình ảnh mask"
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Tạo ảnh'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {resultUrl && (
        <div>
          <p>Kết quả:</p>
          <img src={resultUrl} alt="Kết quả inpainting" />
        </div>
      )}
    </form>
  )
} 
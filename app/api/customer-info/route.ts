import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Đường dẫn đến file log (tạo trong thư mục dự án)
const logFilePath = path.join(process.cwd(), "logs", "customer-info.log");

export async function POST(request: Request) {
  const { phone, email, field, timestamp } = await request.json();

  // Kiểm tra dữ liệu đầu vào
  if (!phone || !email || !field) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  try {
    // Đảm bảo thư mục logs tồn tại
    const logDir = path.dirname(logFilePath);
    await fs.mkdir(logDir, { recursive: true });

    // Tạo nội dung log
    const logEntry = `${timestamp} - Phone: ${phone}, Email: ${email}, Field: ${field}\n`;
    
    // Ghi vào file log (append mode)
    await fs.appendFile(logFilePath, logEntry, "utf8");

    // Phản hồi thành công
    return NextResponse.json(
      { message: "Customer info saved to log successfully", data: { phone, email, field, timestamp } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving customer info to log:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

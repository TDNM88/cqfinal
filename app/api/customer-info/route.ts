import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Cấu hình transporter cho Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Hoặc SMTP server của bạn
  port: 587,
  secure: false, // true cho 465, false cho các port khác
  auth: {
    user: process.env.EMAIL_USER, // Email của bạn (VD: your-email@gmail.com)
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng (App Password nếu dùng Gmail)
  },
});

export async function POST(request: Request) {
  const { phone, email, field, timestamp } = await request.json();

  // Kiểm tra dữ liệu đầu vào
  if (!phone || !email || !field) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  try {
    // Tạo nội dung email
    const mailOptions = {
      from: process.env.EMAIL_USER, // Email gửi
      to: "vlxd@caslagroup.com", // Email nhận (thay bằng email của bạn)
      subject: "Thông Tin Khách Hàng từ CaslaQuartz AI",
      text: `
        Thời gian: ${timestamp}
        Số điện thoại: ${phone}
        Email: ${email}
        Lĩnh vực công tác: ${field}
      `,
      html: `
        <h2>Thông Tin Khách Hàng</h2>
        <p><strong>Thời gian:</strong> ${timestamp}</p>
        <p><strong>Số điện thoại:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Lĩnh vực công tác:</strong> ${field}</p>
      `,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    // Phản hồi thành công
    return NextResponse.json(
      { message: "Customer info sent via email successfully", data: { phone, email, field, timestamp } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending customer info via email:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

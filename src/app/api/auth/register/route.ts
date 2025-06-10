/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/app/lib/auth";
import { sendEmail } from "@/lib/mail";

function generateRandomPassword(length = 12): string {
  // Đảm bảo độ dài tối thiểu là 8
  if (length < 8) length = 8;

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+-=[]{};:,.<>?";
  const allChars = uppercase + lowercase + digits + special;

  const getRandomChar = (chars: string) =>
    chars.charAt(Math.floor(Math.random() * chars.length));

  // Tạo mật khẩu đảm bảo có đủ nhóm ký tự
  function createPassword(): string {
    const password = [
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(digits),
      getRandomChar(special),
    ];

    // Thêm ký tự ngẫu nhiên cho đến khi đủ độ dài
    for (let i = password.length; i < length; i++) {
      password.push(getRandomChar(allChars));
    }

    // Trộn ngẫu nhiên
    return password.sort(() => Math.random() - 0.5).join("");
  }

  // Danh sách blacklist
  const blacklist = ["TBD", "123456"];
  const maxAttempts = 10;
  let attempts = 0;
  let password = "";

  // Lặp để sinh mật khẩu không chứa chuỗi cấm và có đủ độ dài
  do {
    if (++attempts > maxAttempts) {
      throw new Error(
        "Không thể tạo mật khẩu thỏa điều kiện sau nhiều lần thử."
      );
    }
    password = createPassword();
  } while (
    password.length < 8 ||
    blacklist.some((blk) => password.includes(blk))
  );

  return password;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { email, name, role } = await req.json();

  const password = generateRandomPassword(); // tạo password gốc
  const hashedPassword = await bcrypt.hash(password, 10); // hash password

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already exists" },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
  });

  await sendEmail({
    to: [email],
    subject: "Tài khoản Báo cáo CVDV đã được kích hoạt",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #2E86C1;">Thông báo kích hoạt tài khoản</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Tài khoản của bạn đã được <span style="color: green; font-weight: bold;">kích hoạt thành công</span>.</p>
        <p>Mật khẩu mới của bạn là:</p>
        <p style="font-size: 24px; font-weight: bold; color: #D35400; background: #FDEBD0; padding: 10px 15px; border-radius: 5px; display: inline-block;">${password}</p>
        <p>Vui lòng đăng nhập và đổi mật khẩu để bảo mật thông tin.</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Nếu bạn không yêu cầu thay đổi này, vui lòng liên hệ bộ phận hỗ trợ ngay lập tức.</p>
        <p style="font-size: 12px; color: #888;">HRM Team</p>
      </div>
    `,
  });

  return NextResponse.json({ user });
}

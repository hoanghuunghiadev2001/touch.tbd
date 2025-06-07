/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/app/lib/auth";
import { sendEmail } from "@/lib/mail";

function generateRandomPassword(length = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+-=[]{};:,.<>?";

  const allChars = uppercase + lowercase + digits + special;

  const getRandomChar = (chars: string) =>
    chars.charAt(Math.floor(Math.random() * chars.length));

  function createPassword(): string {
    let password = [
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(digits),
      getRandomChar(special),
    ];

    for (let i = password.length; i < length; i++) {
      password.push(getRandomChar(allChars));
    }

    password = password.sort(() => Math.random() - 0.5);
    return password.join("");
  }

  const blacklist = ["TBD", "123456"];
  let password = "";
  const maxAttempts = 10;
  let attempts = 0;

  do {
    if (attempts++ > maxAttempts) {
      throw new Error(
        "Không thể tạo mật khẩu thỏa điều kiện sau nhiều lần thử"
      );
    }
    password = createPassword();
  } while (blacklist.some((blk) => password.includes(blk)));

  return password;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await sendEmail({
      to: [user.email],
      subject: "Thông báo reset mật khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="color: #2E86C1;">Thông báo reset mật khẩu</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Mật khẩu mới của bạn là:</p>
          <p style="font-size: 24px; font-weight: bold; color: #D35400; background: #FDEBD0; padding: 10px 15px; border-radius: 5px; display: inline-block;">${newPassword}</p>
          <p>Vui lòng đăng nhập và đổi mật khẩu để bảo mật thông tin.</p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Nếu bạn không yêu cầu thay đổi này, vui lòng liên hệ bộ phận hỗ trợ ngay lập tức.</p>
          <p style="font-size: 12px; color: #888;">HRM Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Reset mật khẩu thành công, vui lòng kiểm tra email.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Reset mật khẩu thất bại", details: error },
      { status: 500 }
    );
  }
}

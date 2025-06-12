import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getUserFromRequest, isUser } from "@/app/lib/auth";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!isUser(req)) {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập" },
      { status: 403 }
    );
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Missing userId, currentPassword, or newPassword" },
      { status: 400 }
    );
  }

  // Validate new password strength
  if (!passwordRegex.test(newPassword)) {
    return NextResponse.json(
      {
        error:
          "Mật khẩu mới phải dài ít nhất 8 ký tự, có chữ hoa, chữ thường và ký tự đặc biệt.",
      },
      { status: 400 }
    );
  }

  const authUser = await getUserFromRequest(req);
  if (!authUser || (authUser.id !== user?.id && authUser.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập" },
      { status: 403 }
    );
  }

  try {
    const userChange = await prisma.user.findUnique({
      where: { id: user?.id },
    });

    if (!userChange) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Nếu người gọi không phải admin, yêu cầu kiểm tra mật khẩu cũ
    if (authUser.role !== "ADMIN") {
      const isMatch = await bcrypt.compare(
        currentPassword,
        userChange.password
      );
      if (!isMatch) {
        return NextResponse.json(
          { error: "Mật khẩu hiện tại không đúng" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user?.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi trong quá trình cập nhật", details: error },
      { status: 500 }
    );
  }
}

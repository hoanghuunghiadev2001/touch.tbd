/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // bạn import prisma client đúng đường dẫn nhé

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthYear = searchParams.get("monthYear");
    const name = searchParams.get("name")?.trim() || "";

    if (!monthYear) {
      return NextResponse.json(
        { success: false, message: "Thiếu tham số monthYear" },
        { status: 400 }
      );
    }

    const [yearStr, monthStr] = monthYear.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json(
        { success: false, message: "Tham số monthYear không hợp lệ" },
        { status: 400 }
      );
    }

    // Lấy tất cả nhân viên theo filter name
    const employees = await prisma.employee.findMany({
      where: {
        name: {
          contains: name,
        },
      },
      include: {
        targets: {
          where: { year, month },
        },
      },
      orderBy: { name: "asc" },
    });

    // Map dữ liệu, đảm bảo mỗi nhân viên đều có targets và performances (0 nếu không có)
    const data = employees;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API employees error:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}

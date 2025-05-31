import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const nameParam = searchParams.get("name")?.toLowerCase();

    // Lấy tháng, năm từ param hoặc mặc định tháng năm hiện tại
    const now = new Date();
    const monthParam = Number(searchParams.get("month") ?? now.getMonth() + 1);
    const yearParam = Number(searchParams.get("year") ?? now.getFullYear());

    if (nameParam) {
      // Nếu có tên nhân viên, lấy nhân viên đó cùng tất cả targets của họ (bất kể tháng năm)
      const employee = await prisma.employee.findFirst({
        where: {
          name: {
            equals: nameParam,
          },
        },
        include: {
          targets: {
            orderBy: [{ year: "asc" }, { month: "asc" }],
          },
        },
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, message: "Không tìm thấy nhân viên" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: [employee] });
    } else {
      // Nếu không truyền tên, lấy tất cả nhân viên có target trong tháng-năm đó
      const employees = await prisma.employee.findMany({
        where: {
          targets: {
            some: {
              month: monthParam,
              year: yearParam,
            },
          },
        },
        include: {
          targets: {
            where: {
              month: monthParam,
              year: yearParam,
            },
          },
        },
      });

      return NextResponse.json({ success: true, data: employees });
    }
  } catch (error) {
    console.error("Failed to fetch targets:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}

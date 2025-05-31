import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Lấy param monthYear, định dạng dự kiến: "YYYY-MM" hoặc "MM-YYYY"
    const monthYearParam = searchParams.get("monthYear");

    let month: number;
    let year: number;

    if (monthYearParam) {
      // Thử parse theo 2 format: "YYYY-MM" hoặc "MM-YYYY"
      // Tách theo dấu "-"
      const parts = monthYearParam.split("-");
      if (parts.length === 2) {
        const first = Number(parts[0]);
        const second = Number(parts[1]);

        if (first > 31) {
          // giả sử first là năm, second là tháng
          year = first;
          month = second;
        } else {
          // first là tháng, second là năm
          month = first;
          year = second;
        }
      } else {
        // Nếu không đúng format thì mặc định tháng, năm hiện tại
        const now = new Date();
        month = now.getMonth() + 1;
        year = now.getFullYear();
      }
    } else {
      // Nếu không truyền monthYear thì lấy tháng, năm hiện tại
      const now = new Date();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    // Điều kiện lọc targets
    const dateFilter = {
      month,
      year,
    };

    // Lọc theo tên (nếu truyền)
    const nameParam = searchParams.get("name")?.toLowerCase();

    // Lấy tất cả nhân viên thỏa điều kiện lọc tên (nếu có)
    const employees = await prisma.employee.findMany({
      where: nameParam
        ? {
            name: {
              contains: nameParam,
            },
          }
        : undefined,
      include: {
        targets: {
          where: dateFilter,
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}

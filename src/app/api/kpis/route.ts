import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, data } = body;

    if (!year || !month || !Array.isArray(data)) {
      return NextResponse.json(
        {
          message:
            "Thiếu hoặc sai định dạng dữ liệu năm, tháng hoặc danh sách chỉ tiêu",
        },
        { status: 400 }
      );
    }

    const created: string[] = [];
    const skipped: string[] = [];

    for (const item of data) {
      const { employeeId, tripTarget, revenueTarget } = item;

      if (!employeeId) continue;

      const existing = await prisma.monthlyKPI.findUnique({
        where: {
          employeeId_year_month: {
            employeeId,
            year,
            month,
          },
        },
      });

      if (existing) {
        skipped.push(employeeId);
        continue;
      }

      await prisma.monthlyKPI.create({
        data: {
          employeeId,
          year,
          month,
          tripTarget: tripTarget ?? null,
          revenueTarget: revenueTarget ?? null,
        },
      });

      created.push(employeeId);
    }

    return NextResponse.json({
      message: `Tạo thành công KPI cho ${created.length} nhân viên. Bỏ qua ${skipped.length} nhân viên đã có dữ liệu.`,
      created,
      skipped,
    });
  } catch (error) {
    console.error("Lỗi khi tạo KPI:", error);
    return NextResponse.json(
      { message: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}

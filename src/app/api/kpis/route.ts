import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isUser } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  if (!isUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { year, month, data } = body;

    if (!year || !month || !Array.isArray(data)) {
      return NextResponse.json(
        { message: "Thiếu hoặc sai định dạng dữ liệu." },
        { status: 400 }
      );
    }

    const created: string[] = [];
    const updated: string[] = [];

    for (const item of data) {
      const { employeeId, tripTarget, revenueTarget } = item;

      if (!employeeId) continue;

      const existing = await prisma.monthlyKPI.findFirst({
        where: { employeeId, year, month },
      });

      if (existing) {
        await prisma.monthlyKPI.update({
          where: { id: existing.id },
          data: {
            tripTarget: tripTarget ?? existing.tripTarget,
            revenueTarget: revenueTarget ?? existing.revenueTarget,
          },
        });

        updated.push(employeeId);
      } else {
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
    }

    return NextResponse.json({
      message: `Tạo mới KPI cho ${created.length} nhân viên. Cập nhật ${updated.length} nhân viên.`,
      created,
      updated,
    });
  } catch (error) {
    console.error("Lỗi khi tạo/cập nhật KPI:", error);
    return NextResponse.json(
      { message: "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}

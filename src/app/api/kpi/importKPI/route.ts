// app/api/kpi/import/route.ts

import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Lấy data JSON gửi lên
    const data = await request.json();

    const name = "Toyota Touch";
    const month = 3;
    const year = 2025;
    const name_month_year = `${name}_${month}_${year}`;

    const kpi = await prisma.kPI.upsert({
      where: { name_month_year },
      update: {},
      create: {
        name,
        month,
        year,
        name_month_year,
      },
    });

    for (const row of data) {
      const employeeName = row.name.trim();

      const employee = await prisma.employee.upsert({
        where: { name: employeeName },
        update: {},
        create: { name: employeeName },
      });

      await prisma.kPIEmployee.createMany({
        data: [
          {
            kpiId: kpi.id,
            employeeId: employee.id,
            criterion: "Lượt xe Toyota Touch",
            targetValue: parseFloat(row.TBS_LuotXe),
            actualValue: parseFloat(row.TBS_LuotXe),
          },
          {
            kpiId: kpi.id,
            employeeId: employee.id,
            criterion: "Doanh thu Toyota Touch",
            targetValue: parseFloat(row.TBS_DoanhThu),
            actualValue: parseFloat(row.TBS_DoanhThu),
          },
        ],
      });
    }

    return NextResponse.json({ message: "Import thành công" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import thất bại" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

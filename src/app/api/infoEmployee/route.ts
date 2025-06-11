// app/api/employees/metadata/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEmployeeUser } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  if (!getEmployeeUser(req).isEmployee) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    // Lấy danh sách nhân viên (id + tên)
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    // Lấy danh sách mã ngành (distinct jobCode từ dailyKPI)
    const jobCodes = await prisma.dailyKPI.findMany({
      distinct: ["jobCode"],
      where: {
        jobCode: { not: null },
      },
      select: {
        jobCode: true,
      },
    });

    // Chuyển jobCodes thành array string
    const jobCodeList = jobCodes.map((j) => j.jobCode);

    return NextResponse.json({
      success: true,
      employees,
      jobCodes: jobCodeList,
    });
  } catch (error) {
    console.error("API metadata error:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}

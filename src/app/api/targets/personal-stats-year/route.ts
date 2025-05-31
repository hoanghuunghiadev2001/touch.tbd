/* eslint-disable @typescript-eslint/no-explicit-any */
// 📂 /app/api/target/personal-stats-year/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const employeeName = searchParams.get("employeeName");
    const yearParam = searchParams.get("year");

    if (!employeeId && !employeeName) {
      return NextResponse.json(
        { error: "Cần truyền employeeId hoặc employeeName" },
        { status: 400 }
      );
    }

    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Tìm nhân viên theo ID hoặc tên
    let employee;
    if (employeeId) {
      employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });
    } else if (employeeName) {
      employee = await prisma.employee.findFirst({
        where: { name: employeeName },
      });
    }

    if (!employee) {
      return NextResponse.json(
        { error: "Không tìm thấy nhân viên" },
        { status: 404 }
      );
    }

    // Lấy tất cả chỉ tiêu trong năm của nhân viên
    const targets = await prisma.target.findMany({
      where: {
        employeeId: employee.id,
        year,
      },
      orderBy: { month: "asc" },
    });

    return NextResponse.json({
      employee,
      year,
      targets,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Lỗi server" },
      { status: 500 }
    );
  }
}

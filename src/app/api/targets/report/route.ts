/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { isUser } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  if (!isUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get("employeeId");
    const departmentCode = searchParams.get("departmentCode");
    const dateParam = searchParams.get("date"); // yyyy-mm-dd

    if (!employeeId && !departmentCode) {
      return NextResponse.json(
        { error: "Cần truyền employeeId hoặc departmentCode" },
        { status: 400 }
      );
    }

    const date = dateParam ? new Date(dateParam) : new Date();
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Tìm nhân viên phù hợp
    const employees = await prisma.employee.findMany({
      where: {
        ...(employeeId ? { id: employeeId } : {}),
        ...(departmentCode ? { departmentCode } : {}),
      },
      include: {
        monthlyKPIs: {
          include: {
            dailyKPIs: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
    });

    if (!employees.length) {
      return NextResponse.json(
        { error: "Không tìm thấy nhân viên phù hợp" },
        { status: 404 }
      );
    }

    // Tính tổng DailyKPI
    let totalTripCount = 0;
    let totalAmount = 0;

    const uniqueTickets = new Set<string>();

    employees.forEach((emp) => {
      emp.monthlyKPIs.forEach((kpi) => {
        kpi.dailyKPIs.forEach((daily) => {
          if (daily.ticketCode) uniqueTickets.add(daily.ticketCode);
          if (daily.amount) totalAmount += Number(daily.amount);
        });
      });
    });

    totalTripCount = uniqueTickets.size;

    return NextResponse.json({
      success: true,
      data: {
        filter: employeeId ? { employeeId } : { departmentCode },
        date: startDate.toISOString().split("T")[0],
        totalTripCount,
        totalAmount,
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi server" },
      { status: 500 }
    );
  }
}

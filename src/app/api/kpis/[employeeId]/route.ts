/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseMonthYear(monthYear: string): { month: number; year: number } {
  const [yearStr, monthStr] = monthYear.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error("Invalid monthYear format");
  }
  return { month, year };
}

// GET: /api/kpis/:employeeId?monthYear=2025-05
export async function GET(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const { employeeId } = params;
  const monthYear = req.nextUrl.searchParams.get("monthYear");

  if (!monthYear) {
    return NextResponse.json({ error: "Missing monthYear" }, { status: 400 });
  }

  try {
    const { month, year } = parseMonthYear(monthYear);

    const monthly = await prisma.monthlyKPI.findFirst({
      where: { employeeId, month, year },
      include: {
        dailyKPIs: {
          orderBy: { date: "asc" }, // Sắp xếp theo ngày tăng dần
        },
        employee: true,
      },
    });

    if (!monthly) {
      return NextResponse.json(
        { error: "MonthlyKPI not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      employeeId,
      employeeName: monthly.employee.name,
      month: monthly.month,
      year: monthly.year,
      revenueTarget: monthly.revenueTarget,
      tripTarget: monthly.tripTarget,
      dailyKPIs: monthly.dailyKPIs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: cập nhật monthly hoặc daily
export async function PUT(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  const { employeeId } = params;
  const body = await req.json();
  const { monthYear, updateType, data } = body;

  if (!monthYear || !updateType || !data) {
    return NextResponse.json(
      { error: "Missing fields in body" },
      { status: 400 }
    );
  }

  try {
    const { month, year } = parseMonthYear(monthYear);

    if (updateType === "monthly") {
      const updated = await prisma.monthlyKPI.updateMany({
        where: { employeeId, month, year },
        data: {
          revenueTarget: data.revenueTarget,
          tripTarget: data.tripTarget,
        },
      });
      return NextResponse.json({ message: "MonthlyKPI updated", updated });
    }

    if (updateType === "daily") {
      const updated = await prisma.dailyKPI.update({
        where: { id: data.id },
        data: {
          date: new Date(data.date),
          jobCode: data.jobCode,
          ticketCode: data.ticketCode,
          amount: data.amount,
        },
      });
      return NextResponse.json({ message: "DailyKPI updated", updated });
    }

    return NextResponse.json({ error: "Invalid updateType" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: xoá daily KPI
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { dailyKpiId } = body;

  if (!dailyKpiId) {
    return NextResponse.json({ error: "Missing dailyKpiId" }, { status: 400 });
  }

  try {
    await prisma.dailyKPI.delete({ where: { id: dailyKpiId } });
    return NextResponse.json({ message: "DailyKPI deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

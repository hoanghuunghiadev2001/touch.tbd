import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { isUser } from "@/app/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, request: Request) {
  if (!isUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await request.json();

    const { year, month, employeeId, date, jobCode, ticketCode, amount } = body;

    if (!year || !month || !employeeId || !date) {
      return NextResponse.json(
        { error: "year, month, employeeId, and date are required" },
        { status: 400 }
      );
    }

    // Tìm monthlyKPI theo employeeId, year, month
    const monthlyKPI = await prisma.monthlyKPI.findUnique({
      where: {
        employeeId_year_month: {
          employeeId,
          year,
          month,
        },
      },
    });

    if (!monthlyKPI) {
      return NextResponse.json(
        {
          error: "MonthlyKPI not found for the given employee, year and month",
        },
        { status: 404 }
      );
    }

    const newDailyKPI = await prisma.dailyKPI.create({
      data: {
        monthlyKPIId: monthlyKPI.id,
        date: new Date(date),
        jobCode: jobCode ?? null,
        ticketCode: ticketCode ?? null,
        amount:
          amount !== undefined && amount !== null
            ? new Prisma.Decimal(amount)
            : null,
      },
    });

    return NextResponse.json(newDailyKPI, { status: 201 });
  } catch (error) {
    console.error("Failed to create DailyKPI:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

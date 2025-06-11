import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // điều chỉnh đường dẫn tới prisma client

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || "");
  const month = parseInt(searchParams.get("month") || "");

  if (!year || !month) {
    return NextResponse.json(
      { error: "Missing year or month" },
      { status: 400 }
    );
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const results = await prisma.dailyKPI.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
    },
  });

  const uniqueDays = [
    ...new Set(results.map((r) => r.date.toISOString().slice(0, 10))),
  ];

  return NextResponse.json(uniqueDays);
}

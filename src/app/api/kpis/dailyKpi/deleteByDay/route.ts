import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const days: string[] = body.days;

  if (!Array.isArray(days) || days.length === 0) {
    return NextResponse.json({ error: "No days provided" }, { status: 400 });
  }

  let totalDeleted = 0;

  for (const day of days) {
    const date = new Date(day);
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));

    const result = await prisma.dailyKPI.deleteMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    totalDeleted += result.count;
  }

  return NextResponse.json({ deletedCount: totalDeleted });
}

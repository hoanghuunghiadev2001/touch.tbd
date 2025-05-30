import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { name, month, year, name_month_year } = await req.json();

  const newKpi = await prisma.kPI.create({
    data: { name, month, year, name_month_year },
  });

  return NextResponse.json(newKpi);
}

export async function GET() {
  const kpis = await prisma.kPI.findMany({
    include: {
      assignments: {
        include: {
          employee: true,
        },
      },
    },
  });

  return NextResponse.json(kpis);
}

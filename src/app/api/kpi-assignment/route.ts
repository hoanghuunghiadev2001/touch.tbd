import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { kpiId, employeeId, criterion, targetValue, actualValue } =
    await req.json();

  const assignment = await prisma.kPIEmployee.create({
    data: {
      kpiId,
      employeeId,
      criterion,
      targetValue,
      actualValue,
    },
  });

  return NextResponse.json(assignment);
}

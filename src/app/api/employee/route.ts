import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  const employee = await prisma.employee.create({
    data: { name },
  });

  return NextResponse.json(employee);
}

export async function GET() {
  const employees = await prisma.employee.findMany();
  return NextResponse.json(employees);
}

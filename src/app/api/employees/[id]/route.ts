/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const paramsAwait = await context.params;
  const { id } = paramsAwait;
  const data = await req.json();

  try {
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        employeeCode: data.employeeCode,
      },
    });

    return NextResponse.json({
      message: "Employee updated",
      employee: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

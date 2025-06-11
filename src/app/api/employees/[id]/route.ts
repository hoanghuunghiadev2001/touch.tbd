/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, context: any) {
  const { id } = context.params;
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

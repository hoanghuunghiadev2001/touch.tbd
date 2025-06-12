import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isUser } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  if (!isUser(req)) {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập" },
      { status: 403 }
    );
  }
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
  });
  return NextResponse.json({ managers });
}

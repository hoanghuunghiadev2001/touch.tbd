/* eslint-disable @typescript-eslint/no-explicit-any */
import { getUserFromRequest, isAdmin, isUser } from "@/app/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET (optional): Lấy 1 user theo ID (cho UI)
export async function GET(req: NextRequest) {
  const getUser = await getUserFromRequest(req);
  if (!isUser(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: getUser?.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT: Cập nhật user
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { user } = await req.json();
  const { id, name, email, role } = user;

  if (!id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    return NextResponse.json(
      { error: "Update failed", details: err },
      { status: 500 }
    );
  }
}

// DELETE: Xoá user
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await req.json();
  try {
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: "Delete failed", details: err },
      { status: 500 }
    );
  }
}

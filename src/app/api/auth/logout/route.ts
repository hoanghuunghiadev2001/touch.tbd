/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: "Logged out" });

  // Xóa cookie token bằng cách set maxAge = 0 hoặc expires trước đây
  response.cookies.set("token", "", {
    maxAge: 0,
    path: "/", // phải giống với path khi set cookie
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
}

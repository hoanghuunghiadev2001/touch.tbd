import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthPayload extends JwtPayload {
  id: string;
  role: string;
}

function getTokenFromRequest(req: NextRequest): string | null {
  // Lấy token từ cookie
  return req.cookies.get("token")?.value || null;
}

export function getUserFromRequest(req: NextRequest): AuthPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function isAdmin(req: NextRequest): boolean {
  const user = getUserFromRequest(req);
  return user?.role === "ADMIN";
}

export function isUser(req: NextRequest): boolean {
  const user = getUserFromRequest(req);
  return user?.role === "MANAGER" || user?.role === "ADMIN";
}

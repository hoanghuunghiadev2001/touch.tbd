/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import prisma from "@/lib/prisma";

import crypto from "crypto";
import { isUser } from "@/app/lib/auth";

// Tính hash của file

export async function POST(data: NextRequest, req: Request) {
  if (!isUser(data)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Không tìm thấy file" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex"); // Tính hash

    // Kiểm tra hash trong DB
    const existingFile = await prisma.importedFile.findUnique({
      where: { fileHash },
    });

    if (existingFile) {
      return NextResponse.json(
        { error: "File đã được import trước đó, không cần import lại" },
        { status: 400 }
      );
    }

    // Lưu hash vào DB
    await prisma.importedFile.create({
      data: {
        fileName: file.name,
        fileHash,
      },
    });

    // Đọc file Excel, lấy sheet thứ 2 (index 1), nếu không có thì lấy sheet đầu tiên (index 0)
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const currentYear = new Date().getFullYear();

    for (const row of rows) {
      const data = row as Record<string, any>;

      const name = (data["CVDV"] || "").toString().trim();
      const tripTarget = parseInt(
        data["LUOTXE"]?.toString().replace(/\D/g, "") || "0"
      );
      const revenueRaw = data["DOANHTHU"];
      const revenueTarget =
        typeof revenueRaw === "number"
          ? revenueRaw
          : parseFloat(revenueRaw?.toString().replace(/,/g, "") || "0");

      const month = parseInt(
        data["THANG"]?.toString().replace(/\D/g, "") || "0"
      );

      if (!name || !month || isNaN(tripTarget) || isNaN(revenueTarget)) {
        console.warn("Bỏ qua dòng dữ liệu không hợp lệ:", data);
        continue;
      }

      // Tìm hoặc tạo nhân viên
      let employee = await prisma.employee.findUnique({ where: { name } });
      if (!employee) {
        employee = await prisma.employee.create({ data: { name } });
      }

      // Upsert chỉ tiêu tháng
      await prisma.monthlyKPI.upsert({
        where: {
          employeeId_year_month: {
            employeeId: employee.id,
            year: currentYear,
            month: month,
          },
        },
        update: {
          tripTarget,
          revenueTarget,
        },
        create: {
          employeeId: employee.id,
          year: currentYear,
          month: month,
          tripTarget,
          revenueTarget,
        },
      });
    }

    return NextResponse.json({ message: "Import KPI thành công" });
  } catch (error: any) {
    console.error("Lỗi import KPI:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}

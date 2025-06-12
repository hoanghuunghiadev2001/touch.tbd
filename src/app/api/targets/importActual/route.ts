/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";
import fsPromises from "fs/promises";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { isUser } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  if (!isUser(req)) {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập" },
      { status: 403 }
    );
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
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Dùng upsert để tránh lỗi race condition
    await prisma.importedFile.upsert({
      where: { fileHash },
      update: {},
      create: {
        fileName: file.name,
        fileHash,
      },
    });

    // Tạo thư mục uploads nếu chưa có

    function excelDateToJSDate(excelDate: number): Date {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(excelEpoch.getTime() + excelDate * 86400000);
    }

    function formatDateToDDMMYYYY(date: Date): string {
      const day = date.getUTCDate().toString().padStart(2, "0");
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }

    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const employeeCache = new Map<string, string>(); // 👈 kiểu đúng
    const monthlyKPICache = new Map<string, string>();
    const dailyKPIs: any[] = [];

    for (const row of rows) {
      const data = row as Record<string, any>;
      const name = (data["cvdv"] || "").toString().trim();
      const rawDate = data["ngaygs"]?.toString().trim();

      if (!name || !rawDate) {
        console.warn("❌ Bỏ qua dòng thiếu dữ liệu:", data);
        continue;
      }

      const jsDate = excelDateToJSDate(Number(rawDate));
      const [dayStr, monthStr, yearStr] =
        formatDateToDDMMYYYY(jsDate).split("/");
      const day = Number(dayStr);
      const month = Number(monthStr);
      const year = Number(yearStr);

      const jobCode = (data["mahang"] || "").toString().trim();
      const ticketCode = (data["sophieu"] || "").toString().trim();
      const amount = Number(
        (data["thanhtien"] || "0").toString().replace(/\D/g, "") || "0"
      );

      let employeeId = employeeCache.get(name) as string | undefined;
      if (!employeeId) {
        let employee = await prisma.employee.findUnique({ where: { name } });
        if (!employee) {
          employee = await prisma.employee.create({ data: { name } });
        }
        employeeId = employee.id;
        employeeCache.set(name, employeeId);
      }

      const kpiKey = `${employeeId}-${year}-${month}`;
      let monthlyKPIId = monthlyKPICache.get(kpiKey);
      if (!monthlyKPIId) {
        let monthlyKPI = await prisma.monthlyKPI.findFirst({
          where: { employeeId, year, month },
        });
        if (!monthlyKPI) {
          monthlyKPI = await prisma.monthlyKPI.create({
            data: { employeeId, year, month },
          });
        }
        monthlyKPIId = monthlyKPI.id;
        monthlyKPICache.set(kpiKey, monthlyKPIId);
      }

      dailyKPIs.push({
        monthlyKPIId,
        date: jsDate,
        jobCode,
        ticketCode,
        amount,
      });
    }

    // Ghi hàng loạt vào DB
    if (dailyKPIs.length > 0) {
      await prisma.dailyKPI.createMany({
        data: dailyKPIs,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      message: "Import DailyKPI thành công",
      count: dailyKPIs.length,
    });
  } catch (error: any) {
    console.error("❌ Lỗi import:", error);
    return NextResponse.json(
      { error: error?.message || "Có lỗi xảy ra khi import file" },
      { status: 500 }
    );
  } finally {
    // Xoá file tạm
    try {
      const uploadsDir = path.join(process.cwd(), "uploads");
      const files = await fsPromises.readdir(uploadsDir);
      for (const file of files) {
        const fullPath = path.join(uploadsDir, file);
        await fsPromises.unlink(fullPath);
        console.log("🧹 Đã xoá file tạm:", fullPath);
      }
    } catch (err) {
      console.warn("⚠️ Không thể xoá file tạm:", err);
    }
  }
}

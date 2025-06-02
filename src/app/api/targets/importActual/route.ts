/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";
import fsPromises from "fs/promises";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
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

    // Tạo thư mục uploads nếu chưa có
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadsDir, filename);
    await fsPromises.writeFile(filepath, buffer);

    function excelDateToJSDate(excelDate: number): Date {
      // Excel bắt đầu tính từ 1899-12-30
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const jsDate = new Date(excelEpoch.getTime() + excelDate * 86400000); // 86400000 ms = 1 ngày
      return jsDate;
    }

    function formatDateToDDMMYYYY(date: Date): string {
      const day = date.getUTCDate().toString().padStart(2, "0");
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }

    try {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      // Lấy sheet thứ 2 nếu có, không thì lấy sheet đầu tiên
      const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

      for (const row of rows) {
        const data = row as Record<string, any>;

        const name = (data["cvdv"] || "").toString().trim();
        const rawDate = data["ngaygs"]?.toString().trim();

        if (!name || !rawDate) {
          console.warn("❌ Dữ liệu không hợp lệ, bỏ qua:", data);
          continue;
        }

        const jsDate = excelDateToJSDate(rawDate);
        const formattedDate = formatDateToDDMMYYYY(jsDate);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [day, month, year] = formattedDate.split("/").map(Number);

        const jobCode = (data["mahang"] || "").toString().trim();
        const ticketCode = (data["sophieu"] || "").toString().trim();
        const amount =
          (data["thanhtien"] || "0").toString().replace(/\D/g, "") || 0;

        // Tìm hoặc tạo nhân viên
        let employee = await prisma.employee.findUnique({ where: { name } });
        if (!employee) {
          employee = await prisma.employee.create({ data: { name } });
        }

        // Tìm hoặc tạo MonthlyKPI
        let monthlyKPI = await prisma.monthlyKPI.findFirst({
          where: {
            employeeId: employee.id,
            year,
            month,
          },
        });

        if (!monthlyKPI) {
          monthlyKPI = await prisma.monthlyKPI.create({
            data: {
              employeeId: employee.id,
              year,
              month,
            },
          });
        }

        // Ghi vào bảng DailyKPI
        await prisma.dailyKPI.create({
          data: {
            monthlyKPIId: monthlyKPI.id,
            date: jsDate,
            jobCode,
            ticketCode,
            amount,
          },
        });
      }

      return NextResponse.json({ message: "Import DailyKPI thành công" });
    } finally {
      try {
        await fsPromises.unlink(filepath);
        console.log("🧹 Đã xoá file tạm:", filepath);
      } catch (err) {
        console.warn("⚠️ Không thể xoá file tạm:", err);
      }
    }
  } catch (error: any) {
    console.error("❌ Lỗi import:", error);
    return NextResponse.json(
      { error: error?.message || "Có lỗi xảy ra khi import file" },
      { status: 500 }
    );
  }
}

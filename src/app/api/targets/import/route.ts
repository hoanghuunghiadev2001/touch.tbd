/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
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
    const monthParam = req.nextUrl.searchParams.get("month");
    let month = parseInt(monthParam || "0", 10);

    if (!month || month < 1 || month > 12) {
      month = new Date().getMonth() + 1;
    }

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

    const existingFile = await prisma.importedFile.findUnique({
      where: { fileHash },
    });

    if (existingFile) {
      return NextResponse.json(
        { error: "File đã được import trước đó, không cần import lại" },
        { status: 400 }
      );
    }

    await prisma.importedFile.create({
      data: {
        fileName: file.name,
        fileHash,
      },
    });

    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const currentYear = new Date().getFullYear();

    // Duyệt từ cột J đến khi nào hết tên ở hàng 4
    const columnLetters = getColumnsFrom("J");
    for (const col of columnLetters) {
      const nameCell = sheet[`${col}4`];
      const tripCell = sheet[`${col}9`];
      const revenueCell = sheet[`${col}17`];
      console.log(nameCell);

      if (!nameCell || !nameCell.v) break; // Không có tên → dừng

      const name = nameCell.v.toString().trim();
      const rawTrip = tripCell?.v;
      const tripTarget =
        tripCell?.t === "n"
          ? Number(rawTrip)
          : Number(rawTrip?.toString().replace(/,/g, "."));

      console.log(tripTarget, revenueCell);

      const revenueTarget = parseFloat(
        revenueCell?.v?.toString().replace(/,/g, "") || "0"
      );

      if (!name || isNaN(tripTarget) || isNaN(revenueTarget)) {
        console.warn("Bỏ qua dữ liệu không hợp lệ tại cột", col);
        continue;
      }

      // Tìm hoặc tạo nhân viên
      let employee = await prisma.employee.findUnique({ where: { name } });
      if (!employee) {
        employee = await prisma.employee.create({ data: { name } });
      }

      // Upsert KPI tháng
      await prisma.monthlyKPI.upsert({
        where: {
          employeeId_year_month: {
            employeeId: employee.id,
            year: currentYear,
            month,
          },
        },
        update: {
          tripTarget,
          revenueTarget,
        },
        create: {
          employeeId: employee.id,
          year: currentYear,
          month,
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

// Helper: Lấy danh sách cột từ "J" đến "ZZ"
function getColumnsFrom(startCol: string): string[] {
  const cols: string[] = [];
  const start = columnToNumber(startCol);
  for (let i = start; i < start + 100; i++) {
    cols.push(numberToColumn(i));
  }
  return cols;
}

function columnToNumber(col: string): number {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + col.charCodeAt(i) - 64;
  }
  return num;
}

function numberToColumn(n: number): string {
  let s = "";
  while (n > 0) {
    const mod = (n - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

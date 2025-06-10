/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { isUser } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  if (!isUser(req)) {
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
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Kiểm tra file đã import trước đó
    const existing = await prisma.importedFile.findUnique({
      where: { fileHash },
    });
    if (existing) {
      return NextResponse.json(
        { error: "File đã được import trước đó" },
        { status: 400 }
      );
    }

    await prisma.importedFile.create({
      data: { fileName: file.name, fileHash },
    });

    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    function excelDateToJSDate(excelDate: number): Date {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(excelEpoch.getTime() + excelDate * 86400000);
    }

    function formatDateToDDMMYYYY(date: Date): string {
      const d = date.getUTCDate().toString().padStart(2, "0");
      const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const y = date.getUTCFullYear();
      return `${d}/${m}/${y}`;
    }

    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (row: any) => {
          const name = (row["cvdv"] || "").toString().trim();
          const rawDate = row["ngaygs"]?.toString().trim();
          if (!name || !rawDate) return;

          const jsDate = excelDateToJSDate(+rawDate);
          const [day, month, year] = formatDateToDDMMYYYY(jsDate)
            .split("/")
            .map(Number);

          const jobCode = (row["mahang"] || "").toString().trim();
          const ticketCode = (row["sophieu"] || "").toString().trim();
          const amount =
            (row["thanhtien"] || "0").toString().replace(/\D/g, "") || "0";

          let employee = await prisma.employee.findUnique({ where: { name } });
          if (!employee) {
            employee = await prisma.employee.create({ data: { name } });
          }

          let monthlyKPI = await prisma.monthlyKPI.findFirst({
            where: { employeeId: employee.id, month, year },
          });

          if (!monthlyKPI) {
            monthlyKPI = await prisma.monthlyKPI.create({
              data: { employeeId: employee.id, month, year },
            });
          }

          await prisma.dailyKPI.create({
            data: {
              monthlyKPIId: monthlyKPI.id,
              date: jsDate,
              jobCode,
              ticketCode,
              amount: parseInt(amount),
            },
          });
        })
      );
    }

    return NextResponse.json({ message: "Import thành công" });
  } catch (error: any) {
    console.error("❌ Lỗi import:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi trong quá trình import file" },
      { status: 500 }
    );
  }
}

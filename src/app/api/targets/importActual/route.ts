/* eslint-disable @typescript-eslint/no-explicit-any */
// 📂 /app/api/target/import-excel/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const monthYearInput = formData.get("monthYear")?.toString(); // Dạng MM-YYYY

    let month: number;
    let year: number;

    if (monthYearInput) {
      const [m, y] = monthYearInput.split("-");
      month = parseInt(m);
      year = parseInt(y);
      if (!month || !year)
        throw new Error("Sai định dạng tháng-năm. Ví dụ: 06-2025");
    } else {
      const now = new Date();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    // Đọc file Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Gom dữ liệu theo mã xe
    const groupedData: Record<
      string,
      { employeeName: string; totalRevenue: number }
    > = {};

    data.forEach((row) => {
      const employeeName = row["cvdv"]?.toString()?.trim();
      const plate = row["sophieu"]?.toString()?.trim();
      const amountStr =
        row["thanhtien"]?.toString()?.replace(/[^0-9]/g, "") || "0";
      const amount = parseInt(amountStr) || 0;

      if (!employeeName || !plate) return;

      const key = `${plate}_${employeeName}`;

      if (!groupedData[key]) {
        groupedData[key] = { employeeName, totalRevenue: 0 };
      }
      groupedData[key].totalRevenue += amount;
    });

    // Gom theo nhân viên
    const finalData: Record<
      string,
      { actualTrips: number; actualRevenue: number }
    > = {};

    Object.values(groupedData).forEach((item) => {
      const { employeeName, totalRevenue } = item;
      if (!finalData[employeeName]) {
        finalData[employeeName] = { actualTrips: 0, actualRevenue: 0 };
      }
      finalData[employeeName].actualTrips += 1;
      finalData[employeeName].actualRevenue += totalRevenue;
    });

    // Lấy danh sách nhân viên
    const employees = await prisma.employee.findMany();
    console.log(employees);
    console.log(Object.toString());

    const operations = Object.entries(finalData).map(async ([name, data]) => {
      const employee = employees.find(
        (e) => e.name.toLowerCase() === name.toLowerCase()
      );
      console.log("aaa" + employees);

      if (!employee) return null;

      console.log(employee);

      const existingTarget = await prisma.target.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: employee.id,
            month,
            year,
          },
        },
      });

      if (existingTarget) {
        // Chỉ update actualTrips và actualRevenue
        return prisma.target.update({
          where: {
            id: existingTarget.id,
          },
          data: {
            actualTrips: data.actualTrips,
            actualRevenue: data.actualRevenue.toString(),
          },
        });
      } else {
        // Nếu chưa có, thì tạo mới với actualTrips, actualRevenue, các field khác mặc định
        return prisma.target.create({
          data: {
            employeeId: employee.id,
            month,
            year,
            tripTarget: 0, // Nếu cần mặc định thì để
            actualTrips: data.actualTrips,
            revenueTarget: "0", // Mặc định
            actualRevenue: data.actualRevenue.toString(),
          },
        });
      }
    });

    await Promise.all(operations);

    return NextResponse.json({
      message: "Import thành công",
      month,
      year,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý file Excel" },
      { status: 500 }
    );
  }
};

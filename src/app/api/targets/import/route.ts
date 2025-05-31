/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import fs from "fs"; // đồng bộ: existsSync, mkdirSync
import path from "path";
import * as xlsx from "xlsx";
import prisma from "@/lib/prisma";

import fsPromises from "fs/promises"; // Để dùng writeFile async

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new Response("File not found in request", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Thư mục lưu uploads
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadsDir, filename);

    // Ghi file
    await fsPromises.writeFile(filepath, buffer);
    try {
      // Đọc file Excel từ buffer (khuyến nghị hơn)
      const workbook = xlsx.read(buffer, { type: "buffer" });

      // Hoặc đọc từ file đã lưu (có thể dùng nếu muốn)
      // const workbook = xlsx.readFile(filepath);

      const sheetName = workbook.SheetNames[1];
      const sheet = workbook.Sheets[sheetName];

      // Chuyển sheet sang JSON
      const rows = xlsx.utils.sheet_to_json(sheet);

      // Xử lý từng dòng dữ liệu
      for (const row of rows) {
        // Giả sử định dạng cột như sau:
        // STT, CVDV (tên nhân viên), LUOTXE (chỉ tiêu lượt xe), DOANHTHU (chỉ tiêu doanh thu), THANG (tháng)

        // Vì row là unknown, ép kiểu
        const data = row as Record<string, any>;

        const name = (data["CVDV"] || "").toString().trim();
        const tripTarget = parseInt(
          data["LUOTXE"]?.toString().replace(/\./g, "").replace(/ /g, "") ||
            "0",
          10
        );
        const revenueTarget = (data["DOANHTHU"] || "").toString();
        const month = parseInt(data["THANG"]?.toString() || "0", 10);

        if (!name || !month || isNaN(tripTarget) || isNaN(revenueTarget)) {
          // Bỏ qua dòng dữ liệu không hợp lệ
          continue;
        }

        // Tìm hoặc tạo nhân viên theo tên (name là unique)
        let employee = await prisma.employee.findUnique({
          where: { name },
        });

        if (!employee) {
          employee = await prisma.employee.create({
            data: { name },
          });
        }

        const year = new Date().getFullYear(); // Nếu file chỉ có tháng thì lấy năm hiện tại, nếu có năm thì parse thêm

        // Tạo hoặc cập nhật Target
        await prisma.target.upsert({
          where: {
            employeeId_month_year: {
              employeeId: employee.id,
              month,
              year,
            },
          },
          update: {
            tripTarget,
            revenueTarget,
          },
          create: {
            employeeId: employee.id,
            month,
            year,
            tripTarget,
            revenueTarget,
          },
        });
      }

      return NextResponse.json({ message: "Import thành công" });
    } finally {
      await fsPromises.unlink(filepath);
      console.log("Đã xoá file tạm:", filepath);
    }
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi import file" },
      { status: 500 }
    );
  }
}

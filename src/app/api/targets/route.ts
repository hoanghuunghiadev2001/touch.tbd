/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const monthYearParam = searchParams.get("monthYear"); // VD: "2025-06" hoặc "06-2025"
    const employeeIdParam = searchParams.get("employeeId"); // filter theo employeeId (UUID)

    let month: number;
    let year: number;

    // Xử lý lấy tháng và năm
    if (monthYearParam) {
      const parts = monthYearParam.split("-");
      if (parts.length === 2) {
        const first = Number(parts[0]);
        const second = Number(parts[1]);
        if (first > 31) {
          // Giả sử định dạng "YYYY-MM"
          year = first;
          month = second;
        } else {
          // Giả sử định dạng "MM-YYYY"
          month = first;
          year = second;
        }
      } else {
        // Nếu định dạng sai, lấy tháng năm hiện tại
        const now = new Date();
        month = now.getMonth() + 1;
        year = now.getFullYear();
      }
    } else {
      // Mặc định lấy tháng năm hiện tại
      const now = new Date();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    // Build điều kiện lọc employeeId nếu có
    const employeeFilter = employeeIdParam
      ? {
          employeeId: employeeIdParam,
        }
      : {};

    // Lấy dữ liệu monthlyKPI có filter
    const monthlyKPIs = await prisma.monthlyKPI.findMany({
      where: {
        year,
        month,
        ...employeeFilter,
      },
      include: {
        employee: true, // lấy dữ liệu employee theo relation
        dailyKPIs: true, // lấy danh sách dailyKPIs để tính actual
      },
    });

    // Tổng hợp dữ liệu
    let totalTargetTrips = 0;
    let totalTargetRevenue = 0;
    let totalActualTrips = 0;
    let totalActualRevenue = 0;

    // Mảng dữ liệu trả về
    const data = monthlyKPIs.map((kpi) => {
      // Tính số chuyến thực tế dựa trên unique ticketCode của dailyKPIs
      const uniqueTicketCodes = new Set<string>();
      let actualRevenue = 0;

      for (const daily of kpi.dailyKPIs) {
        const code = daily.ticketCode?.toString().trim();
        if (code) uniqueTicketCodes.add(code);
        actualRevenue += Number(daily.amount ?? 0);
      }

      const actualTrips = uniqueTicketCodes.size;

      totalTargetTrips += Number(kpi.tripTarget ?? 0);
      totalTargetRevenue += Number(kpi.revenueTarget ?? 0);
      totalActualTrips += actualTrips;
      totalActualRevenue += actualRevenue;

      return {
        employeeId: kpi.employee?.id || null,
        employeeName: kpi.employee?.name || "",
        month: kpi.month,
        year: kpi.year,
        targetTrips: Number(kpi.tripTarget ?? 0),
        targetRevenue: Number(kpi.revenueTarget ?? 0),
        actualTrips,
        actualRevenue,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      summary: {
        month,
        year,
        totalTargetTrips,
        totalTargetRevenue,
        totalActualTrips,
        totalActualRevenue,
      },
    });
  } catch (error) {
    console.error("Failed to fetch KPI report:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}

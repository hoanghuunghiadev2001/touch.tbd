/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getStartAndEndOfCurrentMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Hàm tạo danh sách các ngày trong khoảng from -> to
function getDateRangeArray(from: Date, to: Date) {
  const dates = [];
  const current = new Date(from);
  while (current <= to) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let fromDate = searchParams.get("fromDate");
    let toDate = searchParams.get("toDate");
    const employeeId = searchParams.get("employeeId")?.trim() || "";
    const industryCode = searchParams.get("industryCode")?.trim() || "";

    if (!fromDate || !toDate) {
      const { start, end } = getStartAndEndOfCurrentMonth();
      fromDate = start.toISOString().slice(0, 10);
      toDate = end.toISOString().slice(0, 10);
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const dateRange = getDateRangeArray(from, to);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Tham số fromDate hoặc toDate không hợp lệ",
        },
        { status: 400 }
      );
    }

    // === Filter theo industryCode ===
    if (industryCode) {
      const dailyKPIs = await prisma.dailyKPI.findMany({
        where: {
          jobCode: industryCode,
          date: { gte: from, lte: to },
          ticketCode: { not: null },
        },
        select: {
          ticketCode: true,
          amount: true,
          date: true,
        },
        orderBy: { date: "asc" },
      });

      const groupedByDate = dailyKPIs.reduce<
        Record<string, { ticketCodes: Set<string>; totalRevenue: number }>
      >((acc, cur) => {
        const dateKey = cur.date.toISOString().slice(0, 10);
        if (!acc[dateKey]) {
          acc[dateKey] = { ticketCodes: new Set(), totalRevenue: 0 };
        }
        acc[dateKey].ticketCodes.add(cur.ticketCode!);
        acc[dateKey].totalRevenue += Number(cur.amount ?? 0);
        return acc;
      }, {});

      const data = dateRange.map((date) => ({
        date,
        totalAmount: groupedByDate[date]?.ticketCodes.size || 0,
        totalRevenue: groupedByDate[date]?.totalRevenue || 0,
      }));

      const totalAmount = data.reduce((sum, d) => sum + d.totalAmount, 0);
      const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);

      return NextResponse.json({
        success: true,
        filter: "industryCode",
        industryCode,
        totalAmount,
        totalRevenue,
        data,
      });
    }

    // === Filter theo employeeName ===
    if (employeeId) {
      const employees = await prisma.employee.findMany({
        where: { id: employeeId },
      });

      if (employees.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: "Không tìm thấy nhân viên",
        });
      }

      const data = await Promise.all(
        employees.map(async (emp) => {
          const dailyKPIs = await prisma.dailyKPI.findMany({
            where: {
              monthlyKPI: { employeeId: emp.id },
              date: { gte: from, lte: to },
              ticketCode: { not: null },
            },
            orderBy: { date: "asc" },
            select: {
              ticketCode: true,
              amount: true,
              date: true,
            },
          });

          const groupedByDate = dailyKPIs.reduce<
            Record<string, { ticketCodes: Set<string>; totalRevenue: number }>
          >((acc, cur) => {
            const dateKey = cur.date.toISOString().slice(0, 10);
            if (!acc[dateKey]) {
              acc[dateKey] = { ticketCodes: new Set(), totalRevenue: 0 };
            }
            acc[dateKey].ticketCodes.add(cur.ticketCode!);
            acc[dateKey].totalRevenue += Number(cur.amount ?? 0);
            return acc;
          }, {});

          const dailyData = dateRange.map((date) => ({
            date,
            totalAmount: groupedByDate[date]?.ticketCodes.size || 0,
            totalRevenue: groupedByDate[date]?.totalRevenue || 0,
          }));

          const totalAmount = dailyData.reduce(
            (sum, d) => sum + d.totalAmount,
            0
          );
          const totalRevenue = dailyData.reduce(
            (sum, d) => sum + d.totalRevenue,
            0
          );

          return {
            employee: emp,
            totalAmount,
            totalRevenue,
            dailyData,
          };
        })
      );

      const grandTotalAmount = data.reduce((sum, d) => sum + d.totalAmount, 0);
      const grandTotalRevenue = data.reduce(
        (sum, d) => sum + d.totalRevenue,
        0
      );

      return NextResponse.json({
        success: true,
        filter: "employeeName",
        totalAmount: grandTotalAmount,
        totalRevenue: grandTotalRevenue,
        data,
      });
    }

    // === Không filter - tổng hợp theo nhân viên ===
    const employees = await prisma.employee.findMany({
      orderBy: { name: "asc" },
    });

    const dailyKPIs = await prisma.dailyKPI.findMany({
      where: {
        date: { gte: from, lte: to },
        ticketCode: { not: null },
      },
      select: {
        ticketCode: true,
        amount: true,
        monthlyKPI: { select: { employeeId: true } },
      },
    });

    const employeeStatsMap = new Map<
      string,
      { ticketCodeSet: Set<string>; totalAmount: number }
    >();

    dailyKPIs.forEach((d) => {
      const empId = d.monthlyKPI?.employeeId;
      if (!empId) return;

      if (!employeeStatsMap.has(empId)) {
        employeeStatsMap.set(empId, {
          ticketCodeSet: new Set(),
          totalAmount: 0,
        });
      }
      const stat = employeeStatsMap.get(empId)!;
      if (d.ticketCode) stat.ticketCodeSet.add(d.ticketCode);
      stat.totalAmount += Number(d.amount ?? 0);
    });

    const employeeData = employees.map((emp) => {
      const stat = employeeStatsMap.get(emp.id);
      return {
        employee: emp,
        totalAmount: stat ? stat.ticketCodeSet.size : 0,
        totalRevenue: stat ? stat.totalAmount : 0,
      };
    });

    const allUniqueTicketCodes = new Set(dailyKPIs.map((d) => d.ticketCode));
    const totalAmount = allUniqueTicketCodes.size;
    const totalRevenue = dailyKPIs.reduce(
      (acc, cur) => acc + Number(cur.amount ?? 0),
      0
    );

    return NextResponse.json({
      success: true,
      filter: "all",
      summary: { totalAmount, totalRevenue },
      data: employeeData,
    });
  } catch (error) {
    console.error("API employees error:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const monthYearParam = searchParams.get("monthYear");
    const nameParam = searchParams.get("name")?.toLowerCase();

    let month: number;
    let year: number;

    if (monthYearParam) {
      const parts = monthYearParam.split("-");
      if (parts.length === 2) {
        const first = Number(parts[0]);
        const second = Number(parts[1]);

        if (first > 31) {
          year = first;
          month = second;
        } else {
          month = first;
          year = second;
        }
      } else {
        const now = new Date();
        month = now.getMonth() + 1;
        year = now.getFullYear();
      }
    } else {
      const now = new Date();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    const employees = await prisma.employee.findMany({
      where: nameParam
        ? {
            name: {
              contains: nameParam,
            },
          }
        : undefined,
      include: {
        monthlyKPIs: {
          where: {
            year,
            month,
          },
          orderBy: [{ year: "asc" }, { month: "asc" }],
          include: {
            dailyKPIs: {
              orderBy: { date: "asc" },
              select: {
                date: true,
                amount: true,
                ticketCode: true,
              },
            },
          },
        },
      },
    });

    const result = (employees as any).map(
      (employee: { monthlyKPIs: any[] }) => {
        const monthlyData = employee.monthlyKPIs.map((monthKPI: any) => {
          const ticketCodeSet = new Set<string>();
          let totalRevenue = 0;

          for (const daily of monthKPI.dailyKPIs || []) {
            const code = daily.ticketCode?.toString().trim();
            if (code) {
              ticketCodeSet.add(code);
            }
            totalRevenue += Number(daily.amount || 0);
          }

          const totalTrips = ticketCodeSet.size;

          return {
            ...monthKPI,
            totalTrips,
            totalRevenue,
          };
        });

        return {
          ...employee,
          monthlyKPIs: monthlyData,
        };
      }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}

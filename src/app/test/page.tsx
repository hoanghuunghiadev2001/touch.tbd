/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import dynamic from "next/dynamic";

// Import động ApexCharts để tránh SSR lỗi
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type EmployeeData = {
  name: string;
  targetLuotXe: number;
  actualLuotXe: number;
  targetDoanhThu: number;
  actualDoanhThu: number;
};

export default function PerformanceCharts() {
  // Dữ liệu mẫu
  const employees: EmployeeData[] = [
    {
      name: "Nguyen Van A",
      targetLuotXe: 50,
      actualLuotXe: 45,
      targetDoanhThu: 100000,
      actualDoanhThu: 95000,
    },
    {
      name: "Tran Thi B",
      targetLuotXe: 60,
      actualLuotXe: 65,
      targetDoanhThu: 120000,
      actualDoanhThu: 130000,
    },
    {
      name: "Le Van C",
      targetLuotXe: 55,
      actualLuotXe: 50,
      targetDoanhThu: 110000,
      actualDoanhThu: 105000,
    },
    // thêm nhân viên khác ...
  ];

  // Trục X là tên nhân viên
  const categories = employees.map((e) => e.name);

  // State chứa 2 chart series và options
  const [state, setState] = React.useState({
    luotXe: {
      series: [
        {
          name: "Chỉ tiêu lượt xe",
          data: employees.map((e) => e.targetLuotXe),
        },
        {
          name: "Thực tế lượt xe",
          data: employees.map((e) => e.actualLuotXe),
        },
      ],
      options: {
        chart: {
          type: "bar" as const,
          height: 350,
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "55%",
            borderRadius: 5,
            borderRadiusApplication: "end" as const,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          show: true,
          width: 2,
          colors: ["transparent"],
        },
        xaxis: {
          categories,
        },
        yaxis: {
          title: {
            text: "Số chuyến",
          },
        },
        fill: {
          opacity: 1,
        },
        tooltip: {
          y: {
            formatter: (val: number) => val.toLocaleString(),
          },
        },
      },
    },

    doanhThu: {
      series: [
        {
          name: "Chỉ tiêu doanh thu",
          data: employees.map((e) => e.targetDoanhThu),
        },
        {
          name: "Thực tế doanh thu",
          data: employees.map((e) => e.actualDoanhThu),
        },
      ],
      options: {
        chart: {
          type: "bar" as const,
          height: 350,
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "55%",
            borderRadius: 5,
            borderRadiusApplication: "end" as const,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          show: true,
          width: 2,
          colors: ["transparent"],
        },
        xaxis: {
          categories,
        },
        yaxis: {
          title: {
            text: "Doanh thu (VND)",
          },
        },
        fill: {
          opacity: 1,
        },
        tooltip: {
          y: {
            formatter: (val: number) =>
              val.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              }),
          },
        },
      },
    },
  });

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>Biểu đồ lượt xe (chỉ tiêu vs thực tế)</h2>
      <Chart
        options={state.luotXe.options}
        series={state.luotXe.series}
        type="bar"
        height={350}
      />

      <h2 style={{ marginTop: 50 }}>Biểu đồ doanh thu (chỉ tiêu vs thực tế)</h2>
      <Chart
        options={state.doanhThu.options}
        series={state.doanhThu.series}
        type="bar"
        height={350}
      />
    </div>
  );
}

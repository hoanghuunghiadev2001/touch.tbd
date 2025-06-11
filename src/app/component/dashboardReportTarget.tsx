import axios from "axios";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";

export interface Root {
  success: boolean;
  data: Daum[];
  summary: Summary;
}

export interface Daum {
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  targetTrips: number;
  targetRevenue: number;
  actualTrips: number;
  actualRevenue: number;
}

export interface Summary {
  month: number;
  year: number;
  totalTargetTrips: number;
  totalTargetRevenue: number;
  totalActualTrips: number;
  totalActualRevenue: number;
}

const DashboardReportTarget: React.FC = () => {
  const [dataReportTarget, setDataReportTarget] = useState<Root>();
  useEffect(() => {
    axios.get<Root>("/api/targets?monthYear=2025-6").then((res) => {
      setDataReportTarget(res.data);
    });
  }, []);
  const employeeNames = dataReportTarget?.data.map((d) => d.employeeName);

  function formatCurrencyShort(value: number): string {
    if (value >= 1_000_000_000)
      return `${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, "")} B`;
    if (value >= 1_000_000)
      return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, "")} M`;
    if (value >= 1_000)
      return `${(value / 1_000).toFixed(2).replace(/\.00$/, "")}k`;
    return value.toString();
  }

  // Biểu đồ lượt xe
  const tripChartOptions = {
    chart: { type: "line" as const },

    xaxis: {
      categories: employeeNames,
      labels: {
        rotate: -45,
        style: {
          fontSize: "12px",
        },
      },
    },
    title: { text: "Lượt xe: Chỉ tiêu vs Thực tế" },
    markers: {
      size: 5,
      colors: ["#008FFB"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 7 },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val,
      position: "top",
      offsetY: -6,
      style: { fontSize: "10px", colors: ["#000"], fontWeight: "bold" },
    },
    yaxis: { title: { text: "Lượt xe" } },

    tooltip: { y: { formatter: (val: number) => val.toLocaleString() } },
  };

  const tripChartSeries = [
    {
      name: "Chỉ tiêu",
      data: dataReportTarget?.data.map((d) => d.targetTrips) ?? [],
    },
    {
      name: "Thực tế",
      data: dataReportTarget?.data.map((d) => d.actualTrips) ?? [],
    },
  ];

  // Biểu đồ doanh thu
  const revenueChartOptions = {
    chart: { type: "line" as const },
    xaxis: {
      categories: employeeNames,
      labels: {
        rotate: -45,
        style: {
          fontSize: "12px",
        },
      },
    },
    title: { text: `Tổng Doanh Thu` },
    markers: {
      size: 5,
      colors: ["#008FFB"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 7 },
    },
    yaxis: {
      title: { text: "Doanh thu" },
      labels: {
        enabled: true,
        formatter: function (val: number) {
          return formatCurrencyShort(val); // Hiển thị số đơn giản, nếu muốn format thêm thì chỉnh ở đây
        },
      },
    },

    dataLabels: {
      enabled: true,
      formatter: (val: number) => formatCurrencyShort(val),
      position: "top",
      offsetY: -6,
      style: { fontSize: "10px", colors: ["#000"], fontWeight: "bold" },
    },
    tooltip: {
      y: {
        formatter: (val: number) =>
          val.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
      },
    },
  };

  const revenueChartSeries = [
    {
      name: "Chỉ tiêu",
      data: dataReportTarget?.data.map((d) => d.targetRevenue) ?? [],
    },
    {
      name: "Thực tế",
      data: dataReportTarget?.data.map((d) => d.actualRevenue) ?? [],
    },
  ];

  return (
    <div className="h-[calc(100vh-90px)] flex p-4">
      <div className="w-[250px] h-full shrink-0">ấdasd</div>
      <div className="w-[calc(100vw-280px)] h-full">
        <div className="h-[50%]">
          <Chart
            height={"100%"}
            options={tripChartOptions}
            series={tripChartSeries}
            type="line"
          />
        </div>
        <div className="h-[50%]">
          <Chart
            height={"100%"}
            options={revenueChartOptions}
            series={revenueChartSeries}
            type="line"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardReportTarget;

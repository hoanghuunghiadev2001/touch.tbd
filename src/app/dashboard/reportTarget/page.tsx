"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, DatePicker } from "antd";
import dayjs from "dayjs";
import ModalLoading from "@/app/component/modalLoading";
import { useRouter } from "next/navigation";
import { HomeFilled } from "@ant-design/icons";
import ClientChart from "@/app/component/ClientChart";

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
  const router = useRouter();
  const [dataReportTarget, setDataReportTarget] = useState<Root>();
  const [monthYear, setMonthYear] = useState(dayjs());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get<Root>(`/api/targets?monthYear=${monthYear.format("YYYY-MM")}`)
      .then((res) => {
        setDataReportTarget(res.data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải dữ liệu:", err);
        setDataReportTarget(undefined); // hoặc null nếu muốn
      })
      .finally(() => {
        setLoading(false);
      });
  }, [monthYear]);

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

  function formatCurrencyVND(value: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
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
    title: {
      text: `Tổng Lượt xe Tháng ${
        dataReportTarget?.summary.month + "/" + dataReportTarget?.summary.year
      }: ${dataReportTarget?.summary.totalActualTrips ?? 0} lượt`,
    },
    markers: {
      size: 5,
      colors: ["#008FFB"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 7 },
    },
    stroke: {
      show: true,
      curve: "smooth",
      width: 2, // Ẩn viền cột khi bar,
      colors: ["#FF5733", "#009E73"],
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
    title: {
      text: `Tổng Doanh Thu Tháng ${
        dataReportTarget?.summary.month + "/" + dataReportTarget?.summary.year
      }: ${formatCurrencyVND(
        dataReportTarget?.summary.totalActualRevenue ?? 0
      )}`,
    },
    markers: {
      size: 5,
      colors: ["#008FFB"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 7 },
    },
    stroke: {
      show: true,
      curve: "smooth",
      width: 2, // Ẩn viền cột khi bar,
      colors: ["#FF5733", "#56B4E9"],
    },
    yaxis: {
      title: { text: `Doanh thu` },
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

  function calculatePercentage(actual: number, target: number): string {
    if (target === 0) return "0%";
    const percent = (actual / target) * 100;
    return percent.toFixed(2) + "%"; // giữ 2 chữ số thập phân
  }

  return (
    <div className="h-[calc(100vh)] flex py-4 pr-4">
      <ModalLoading isOpen={loading} />
      <div className="w-[250px] h-full overflow-y-auto shrink-0 px-4 pb-4">
        <h2 className="text-2xl font-semibold text-center mb-2">
          Báo cáo tổng hợp
        </h2>
        <div className="gap-4 flex justify-between items-center mb-2">
          <Button
            type="primary"
            className="!w-full"
            onClick={() => {
              setLoading(true);
              router.push("/");
            }}
            icon={<HomeFilled />}
          ></Button>
          <Button
            className="!bg-[#f54e4e] !text-white"
            type="primary"
            onClick={() => {
              setLoading(true);
              router.push("/dashboard/report");
            }}
          >
            Báo cáo chi tiết
          </Button>
        </div>
        <DatePicker
          picker="month"
          value={monthYear}
          onChange={(date) => {
            if (date) setMonthYear(date);
          }}
          allowClear={false}
          className="w-full"
          format="MM/YYYY"
          placeholder="Chọn tháng"
        />
        <div className="grid grid-rows-1 gap-2 mt-2">
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl  shadow-card-report">
            <p className="m-0 text-lg">Doanh thu đạt được</p>
            <p
              className={`m-0 text-xl font-bold ${
                Number(dataReportTarget?.summary.totalTargetRevenue) >
                Number(dataReportTarget?.summary.totalActualRevenue)
                  ? "text-red-700"
                  : "text-green-700"
              }`}
            >
              {formatCurrencyVND(
                Number(dataReportTarget?.summary.totalActualRevenue)
              )}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl  shadow-card-report">
            <p className="m-0 text-lg">Tiến độ Doanh thu </p>
            <p
              className={`m-0 text-xl font-bold ${
                Number(dataReportTarget?.summary.totalTargetRevenue) >
                Number(dataReportTarget?.summary.totalActualRevenue)
                  ? "text-red-700"
                  : "text-green-700"
              }`}
            >
              {calculatePercentage(
                Number(dataReportTarget?.summary.totalActualRevenue) ?? 0,
                Number(dataReportTarget?.summary.totalTargetRevenue) ?? 0
              )}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl shadow-card-report ">
            <p className="m-0 text-lg">Chỉ tiêu doanh thu tháng</p>
            <p className="m-0 text-xl font-bold text-green-700">
              {formatCurrencyVND(
                Number(dataReportTarget?.summary.totalTargetRevenue)
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-rows-1 gap-2 mt-2">
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl  shadow-card-report  ">
            <p className="m-0 text-lg">Lượt xe đạt được</p>
            <p
              className={`m-0 text-xl font-bold ${
                Number(dataReportTarget?.summary.totalTargetTrips) >
                Number(dataReportTarget?.summary.totalActualTrips)
                  ? "text-red-700"
                  : "text-green-700"
              }`}
            >
              {dataReportTarget?.summary.totalActualTrips}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl  shadow-card-report">
            <p className="m-0 text-lg">Tiến độ lượt xe</p>
            <p
              className={`m-0 text-xl font-bold ${
                Number(dataReportTarget?.summary.totalTargetTrips) >
                Number(dataReportTarget?.summary.totalActualTrips)
                  ? "text-red-700"
                  : "text-green-700"
              }`}
            >
              {calculatePercentage(
                Number(dataReportTarget?.summary.totalActualTrips) ?? 0,
                Number(dataReportTarget?.summary.totalTargetTrips) ?? 0
              )}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-2xl  shadow-card-report">
            <p className="m-0 text-lg">Chỉ tiêu lượt xe tháng</p>
            <p className="m-0 text-xl font-bold text-green-700">
              {dataReportTarget?.summary.totalTargetTrips}
            </p>
          </div>
        </div>
      </div>
      <div className="w-[calc(100vw-280px)] h-full">
        {dataReportTarget?.data?.length ? (
          <>
            <div className="h-[50%]">
              <ClientChart
                height={"100%"}
                options={revenueChartOptions}
                series={revenueChartSeries}
                type="line"
              />
            </div>
            <div className="h-[50%]">
              <ClientChart
                height={"100%"}
                options={tripChartOptions}
                series={tripChartSeries}
                type="line"
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-gray-500 text-lg font-medium">
            Tháng {monthYear.format("MM/YYYY")} không có dữ liệu.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardReportTarget;

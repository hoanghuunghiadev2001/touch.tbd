/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Spin, message } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import ModalLoading from "@/app/component/modalLoading";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Target {
  month: number;
  actualTrips: number;
  actualRevenue: string;
  revenueTarget: string;
  tripTarget: number;
}

export default function ReportPage() {
  const params = useParams() as any;
  console.log(params);

  const employeeName = params.name;
  const employeeId = params.id;
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    if (!employeeId || !selectedYear) return;

    setLoading(true);
    axios
      .get("/api/targets/personal-stats-year", {
        params: {
          employeeId,
          year: selectedYear,
        },
      })
      .then((res) => {
        const data = res.data.targets;
        const fullData: Target[] = [];
        for (let m = 1; m <= 12; m++) {
          const target = data.find((t: Target) => t.month === m);
          fullData.push({
            month: m,
            actualTrips: target ? target.totalTrips : 0,
            actualRevenue: target ? target.totalRevenue : "0",
            revenueTarget: target ? target.revenueTarget : "0",
            tripTarget: target ? target.tripTarget : 0,
          });
        }

        setTargets(fullData);
        console.log(fullData);
      })
      .catch(() => {
        message.error("Lấy dữ liệu thống kê thất bại");
      })
      .finally(() => setLoading(false));
  }, [employeeId, selectedYear]);

  const chartOptionsTrips = {
    chart: {
      id: "personal-stats",
      toolbar: { show: true },
      zoom: { enabled: false },
    },
    xaxis: {
      categories: targets.map((t) => `tháng ${t.month} `),
    },
    yaxis: {
      title: { text: "Lượt xe" },
    },
    dataLabels: {
      enabled: true, // Bật hiển thị giá trị
      formatter: function (val: number) {
        return val; // Hiển thị số đơn giản, nếu muốn format thêm thì chỉnh ở đây
      },
      offsetY: 0, // Điều chỉnh vị trí số liệu trên cột (nếu cần)
      style: {
        fontSize: "10px",
        colors: ["#4d4d4d"], // Màu xanh dương (hoặc màu khác bạn thích)
        fontWeight: "bold", // In đậm nếu muốn
      },
    },
    tooltip: {
      shared: true,
      y: [
        {
          formatter: (val: number) => `${val} lượt`,
        },
        {
          formatter: (val: number) => `${val} lượt`,
        },
      ],
    },
  };

  const chartOptionsRevenue = {
    chart: {
      id: "personal-stats",
      toolbar: { show: true },
      zoom: { enabled: false },
    },
    colors: ["#FF4C4C", "#FF7A00"],
    xaxis: {
      categories: targets.map((t) => `tháng ${t.month} `),
    },
    dataLabels: {
      enabled: true, // Bật hiển thị giá trị
      formatter: function (val: number) {
        return formatCurrencyShort(val); // Hiển thị số đơn giản, nếu muốn format thêm thì chỉnh ở đây
      },
      offsetY: 0, // Điều chỉnh vị trí số liệu trên cột (nếu cần)
      style: {
        fontSize: "10px",
        colors: ["#4d4d4d"], // Màu xanh dương (hoặc màu khác bạn thích)
        fontWeight: "bold", // In đậm nếu muốn
      },
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
    tooltip: {
      shared: true,
      y: [
        {
          formatter: (val: number) => formatCurrencyShort(val),
        },
        {
          formatter: (val: number) => formatCurrencyShort(val),
        },
      ],
    },
  };

  const chartSeriesTrips = [
    {
      name: "Chỉ tiêu lượt xe",
      type: "line",
      data: targets.map((t) => t.tripTarget),
    },
    {
      name: "Lượt xe thực tế",
      type: "line",
      data: targets.map((t) => t.actualTrips),
    },
  ];

  const chartSeriesRevenue = [
    {
      name: "Chỉ tiêu doanh thu",
      type: "line",
      data: targets.map((t) => Number(t.revenueTarget)),
    },
    {
      name: "Doanh thu thực tế",
      type: "line",
      data: targets.map((t) => Number(t.actualRevenue)),
    },
  ];

  function getTotalTrips(targets: Target[]) {
    const totalTripTarget = targets.reduce((sum, t) => sum + t.tripTarget, 0);
    const totalActualTrips = targets.reduce((sum, t) => sum + t.actualTrips, 0);
    return { totalTripTarget, totalActualTrips };
  }

  function getTotalRevenue(targets: Target[]) {
    const totalRevenueTarget = targets.reduce(
      (sum, t) => sum + Number(t.revenueTarget),
      0
    );
    const totalActualRevenue = targets.reduce(
      (sum, t) => sum + Number(t.actualRevenue),
      0
    );
    return { totalRevenueTarget, totalActualRevenue };
  }

  function formatCurrencyShort(value: number) {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000)
        .toFixed(value % 1_000_000_000 === 0 ? 0 : 2)
        .replace(/\.00$/, "")} B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000)
        .toFixed(value % 1_000_000 === 0 ? 0 : 2)
        .replace(/\.00$/, "")} M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000)
        .toFixed(value % 1_000 === 0 ? 0 : 2)
        .replace(/\.00$/, "")}k`;
    } else {
      return `${value}`;
    }
  }

  const totalTrips = useMemo(() => getTotalTrips(targets), [targets]);
  const totalRevenue = useMemo(() => getTotalRevenue(targets), [targets]);

  return (
    <div>
      <ModalLoading isOpen={loading} />
      <div className="flex w-full">
        <div className="p-4 h-[100vh] shadow-2xl shadow-[#4a4a6a] rounded-br-xl rounded-tr-xl">
          <div className="w-[200px]">
            <Button type="primary" onClick={() => setLoading(true)}>
              <Link href={"/"}>Trang chủ</Link>
            </Button>
            <h2 className="my-3 text-lg  font-bold text-center uppercase underline-offset-2 text-[#18184d]">
              {decodeURIComponent(employeeName)}
            </h2>

            <div style={{ marginBottom: 24 }} className="w-full">
              <DatePicker
                className="w-full"
                picker="year"
                allowClear={false}
                onChange={(date) =>
                  setSelectedYear(date?.year() || dayjs().year())
                }
                defaultValue={dayjs()}
              />
            </div>

            <h3 className="font-bold text-xl text-[#4a4a6a]">Tổng lượt xe</h3>
            <div className="w-full mt-2">
              <div className="p-3 w-full rounded-xl shadow-xs text-center shadow-cyan-800 bg-gradient-to-tl from-green-400 to-cyan-800 font-bold text-lg text-white ">
                {totalTrips.totalActualTrips} / {totalTrips.totalTripTarget}{" "}
                lượt
              </div>
            </div>

            <h3 className="font-bold text-xl text-[#4a4a6a] mt-5">
              Tổng Doanh thu
            </h3>
            <div className="w-full mt-2">
              <div className="p-3 w-full text-center rounded-xl shadow-xs shadow-green-800 bg-gradient-to-tl from-[#FF7A00] to-[#FF4C4C] font-bold text-lg text-white ">
                {formatCurrencyShort(totalRevenue.totalActualRevenue)} /{" "}
                {formatCurrencyShort(totalRevenue.totalRevenueTarget)}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-[100vh] overflow-hidden">
          {loading ? (
            <Spin />
          ) : (
            <div className="h-[100%] flex flex-col">
              <div className="h-[50%]">
                <ReactApexChart
                  options={chartOptionsTrips}
                  series={chartSeriesTrips}
                  type="line"
                  height={"100%"}
                />
              </div>
              <div className="h-[50%]">
                <ReactApexChart
                  options={chartOptionsRevenue}
                  series={chartSeriesRevenue}
                  type="line"
                  height={"100%"}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

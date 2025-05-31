/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { DatePicker, Input, Button, Alert, Space } from "antd";
import dayjs from "dayjs";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type EmployeeInput = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  targets: {
    id: string;
    employeeId: string;
    month: number;
    year: number;
    tripTarget: number;
    actualTrips: number;
    revenueTarget: string; // string số
    actualRevenue: string; // string số
    createdAt: string;
    updatedAt: string;
  }[];
};

export type EmployeeData = {
  name: string;
  targetLuotXe: number;
  actualLuotXe: number;
  targetDoanhThu: number;
  actualDoanhThu: number;
};

export default function EmployeeDashboard() {
  const [monthYear, setMonthYear] = useState<dayjs.Dayjs | null>(dayjs());
  const [name, setName] = useState("");
  const [employees, setEmployees] = useState<EmployeeInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dataEmployee, setDataEmployee] = useState<EmployeeData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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
  // Hàm chuyển đổi dữ liệu
  function convertEmployeeData(
    input: EmployeeInput[],
    filterMonth: number,
    filterYear: number
  ): EmployeeData[] {
    if (!input) return [];
    return input.map((employee) => {
      const target = employee.targets.find(
        (t) => t.month === filterMonth && t.year === filterYear
      );
      return {
        name: employee.name,
        targetLuotXe: target ? target.tripTarget : 0,
        actualLuotXe: target ? target.actualTrips : 0,
        targetDoanhThu: target ? parseFloat(target.revenueTarget) || 0 : 0,
        actualDoanhThu: target ? parseFloat(target.actualRevenue) || 0 : 0,
      };
    });
  }

  const fetchData = async () => {
    if (!monthYear) return;

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("monthYear", monthYear.format("YYYY-MM"));
      if (name.trim()) params.append("name", name.trim());

      const res = await fetch(`/api/employees?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setEmployees(json.data);

        // Chuyển dữ liệu dựa theo tháng, năm hiện tại
        const result = convertEmployeeData(
          json.data,
          monthYear.month() + 1, // month() trả về 0-based nên +1
          monthYear.year()
        );

        setDataEmployee(result);
        setCategories(result.map((e) => e.name));
      } else {
        setError("Lấy dữ liệu thất bại");
      }
    } catch {
      setError("Lỗi mạng hoặc server");
    }
    setLoading(false);
  };

  // Tự động fetch khi thay đổi tháng hoặc tên tìm kiếm
  useEffect(() => {
    fetchData();
  }, [monthYear, name]);

  // State riêng cho biểu đồ lượt xe
  const [chartLuotXe, setChartLuotXe] = useState({
    series: [
      { name: "Chỉ tiêu lượt xe", data: [] as number[] },
      { name: "Thực tế lượt xe", data: [] as number[] },
    ],
    options: {
      chart: { type: "bar" as const, height: 350 },

      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
          },
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 5,
          borderRadiusApplication: "end" as const,
        },
      },
      dataLabels: {
        enabled: true, // Bật hiển thị giá trị
        formatter: function (val: number) {
          return val; // Hiển thị số đơn giản, nếu muốn format thêm thì chỉnh ở đây
        },
        position: "top",

        offsetY: -15, // Điều chỉnh vị trí số liệu trên cột (nếu cần)
        style: {
          fontSize: "10px",
          colors: ["#000"], // Màu xanh dương (hoặc màu khác bạn thích)
          fontWeight: "bold", // In đậm nếu muốn
        },
      },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      xaxis: { categories },
      yaxis: { title: { text: "Số chuyến" } },
      fill: { opacity: 1 },
      tooltip: {
        y: { formatter: (val: number) => val.toLocaleString() },
      },
    },
    fill: {
      colors: dataEmployee.map((e) =>
        e.actualLuotXe >= e.targetLuotXe ? "#00C853" : "#FF5252"
      ),
    },
  });

  // State riêng cho biểu đồ doanh thu
  const [chartDoanhThu, setChartDoanhThu] = useState({
    series: [
      { name: "Chỉ tiêu doanh thu", data: [] as number[] },
      { name: "Thực tế doanh thu", data: [] as number[] },
    ],
    options: {
      chart: { type: "bar" as const, height: 350 },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
          },
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 5,
          borderRadiusApplication: "end" as const,
        },
      },
      dataLabels: {
        enabled: true, // Bật hiển thị giá trị
        formatter: function (val: number) {
          return formatCurrencyShort(val); // Hiển thị số đơn giản, nếu muốn format thêm thì chỉnh ở đây
        },
        position: "top",

        offsetY: -15, // Điều chỉnh vị trí số liệu trên cột (nếu cần)
        style: {
          fontSize: "10px",
          colors: ["#000"], // Màu xanh dương (hoặc màu khác bạn thích)
          fontWeight: "bold", // In đậm nếu muốn
        },
      },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      xaxis: { categories },
      yaxis: {
        title: { text: "Doanh thu (VND)" },
        labels: {
          enabled: true,
          formatter: function (val: number) {
            return formatCurrencyShort(val); // Hiển thị số đơn giản, nếu muốn format thêm thì chỉnh ở đây
          },
        },
      },
      fill: { opacity: 1 },
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
  });

  // Cập nhật dữ liệu biểu đồ khi dataEmployee hoặc categories thay đổi
  useEffect(() => {
    setChartLuotXe((prev) => ({
      ...prev,
      series: [
        {
          name: "Chỉ tiêu lượt xe",
          data: dataEmployee.map((e) => e.targetLuotXe),
        },
        {
          name: "Thực tế lượt xe",
          data: dataEmployee.map((e) => e.actualLuotXe),
        },
      ],
      options: {
        ...prev.options,
        xaxis: { categories },
      },
      fill: {
        colors: dataEmployee.map((e) =>
          e.actualLuotXe >= e.targetLuotXe ? "#00C853" : "#FF5252"
        ),
      },
    }));

    setChartDoanhThu((prev) => ({
      ...prev,
      series: [
        {
          name: "Chỉ tiêu doanh thu",
          data: dataEmployee.map((e) => e.targetDoanhThu),
        },
        {
          name: "Thực tế doanh thu",
          data: dataEmployee.map((e) => e.actualDoanhThu),
        },
      ],
      options: {
        ...prev.options,
        xaxis: { categories },
      },
      colors: dataEmployee.map((e) =>
        e.actualDoanhThu >= e.targetDoanhThu ? "#00C853" : "#FF5252"
      ),
    }));
  }, [dataEmployee, categories]);

  const totalTargetDoanhThu =
    dataEmployee?.reduce((sum, e) => sum + Number(e.targetDoanhThu), 0) ?? 0;
  const totalActualDoanhThu =
    dataEmployee?.reduce((sum, e) => sum + Number(e.actualDoanhThu), 0) ?? 0;
  const percentCompletion =
    totalTargetDoanhThu > 0
      ? (Number(totalActualDoanhThu) / Number(totalTargetDoanhThu)) * 100
      : 0;
  console.log(totalTargetDoanhThu);

  const totalTargetLuotXe =
    dataEmployee?.reduce((sum, e) => sum + Number(e.targetLuotXe), 0) ?? 0;
  const totalActualLuotXe =
    dataEmployee?.reduce((sum, e) => sum + Number(e.actualLuotXe), 0) ?? 0;
  const percentCompletionLuotXe =
    totalTargetLuotXe > 0 && totalActualLuotXe > 0
      ? (Number(totalActualLuotXe) / Number(totalTargetLuotXe)) * 100
      : 0;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>Dashboard chỉ tiêu và thực tế</h2>

      <Space style={{ marginBottom: 20 }}>
        <DatePicker
          picker="month"
          onChange={(date) => setMonthYear(date)}
          value={monthYear}
          format="MM/YYYY"
        />
        <Input.Search
          placeholder="Tìm theo tên nhân viên"
          allowClear
          enterButton="Tìm"
          onSearch={(value) => setName(value)}
          style={{ width: 250 }}
        />
      </Space>

      {error && <Alert message={error} type="error" showIcon closable />}
      {loading && <Alert message="Đang tải dữ liệu..." type="info" showIcon />}

      <h3>Biểu đồ lượt xe (chỉ tiêu vs thực tế)</h3>
      <div style={{ marginBottom: 16 }}>
        <b>Tổng chỉ tiêu lượt xe: </b> {totalTargetLuotXe} lượt xe
        <br />
        <b>Tổng lượt xe thực tế: </b> {totalActualLuotXe} lượt xe
        <br />
        <b>Tỷ lệ hoàn thành: </b> {percentCompletionLuotXe.toFixed(2)}%
      </div>
      <Chart
        options={chartLuotXe.options}
        series={chartLuotXe.series}
        type="bar"
        height={350}
      />

      <h3 style={{ marginTop: 50 }}>Biểu đồ doanh thu (chỉ tiêu vs thực tế)</h3>

      <div style={{ marginBottom: 16 }}>
        <b>Tổng chỉ tiêu doanh thu: </b>{" "}
        {totalTargetDoanhThu.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        })}
        <br />
        <b>Tổng doanh thu thực tế: </b>{" "}
        {totalActualDoanhThu.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        })}
        <br />
        <b>Tỷ lệ hoàn thành: </b> {percentCompletion.toFixed(2)}%
      </div>
      <Chart
        options={chartDoanhThu.options}
        series={chartDoanhThu.series}
        type="bar"
        height={350}
      />
    </div>
  );
}

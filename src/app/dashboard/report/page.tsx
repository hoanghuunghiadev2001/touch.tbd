/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import {
  DatePicker,
  Input,
  Alert,
  Space,
  Typography,
  Select,
  Form,
  Button,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import dynamic from "next/dynamic";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import axios from "axios";
import ReactApexChart from "react-apexcharts";
import { Color } from "antd/es/color-picker";
import Link from "next/link";
import ModalLoading from "@/app/component/modalLoading";
import { useRouter } from "next/navigation";
import { HomeFilled } from "@ant-design/icons";
import ClientChart from "@/app/component/ClientChart";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Dynamic import Chart (apexcharts)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Kiểu dữ liệu input từ API
export interface result {
  success: boolean;
  filter: string;
  summary: Summary;
  data: Daum[];
}

export interface DailyDaum {
  date: string;
  totalAmount: number;
  totalRevenue: number;
}

export interface Summary {
  totalAmount: number;
  totalRevenue: number;
}

export interface Daum {
  employee: Employee;
  date?: string;
  dailyData?: DailyDaum[];
  totalAmount: number;
  totalRevenue: number;
}

export interface Employee {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Kiểu dữ liệu để vẽ biểu đồ
interface EmployeeData {
  name: string;
  actualLuotXe: number;
  actualDoanhThu: number;
}

export interface Result {
  success: boolean;
  data: Employee[];
  summary: Summary;
}

// Đổi tên interface Employee thứ hai để tránh trùng lặp
export interface EmployeeTarget {
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

function formatDateToDayMonth(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${day}/${month}`;
}

export default function EmployeeDashboard() {
  // State quản lý khoảng chọn ngày (fromDate, toDate)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"), // đầu tháng hiện tại
    dayjs(), // hôm nay
  ]);

  const month = dateRange[0].month() + 1; // month() trả về 0-11, nên +1
  const year = dateRange[0].year();

  // State tìm kiếm theo tên nhân viên
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [employeeId, setEmployeeId] = useState<string>();
  // State lọc theo mã ngành
  const [industryCode, setIndustryCode] = useState<string>();
  // Dữ liệu nhân viên từ API

  const router = useRouter();

  const [stateChartTrips, setStateChartTrips] = React.useState({
    series: [76],
    options: {
      chart: {
        type: "radialBar" as const,
        offsetY: -20,
        sparkline: {
          enabled: true,
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          track: {
            background: "#e7e7e7",
            strokeWidth: "97%",
            margin: 5, // margin is in pixels
            dropShadow: {
              enabled: true,
              top: 2,
              left: 0,
              color: "#444",
              opacity: 1,
              blur: 2,
            },
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              offsetY: -2,
              fontSize: "22px",
            },
          },
        },
      },
      grid: {
        padding: {
          top: -10,
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          shadeIntensity: 0.4,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 53, 91],
        },
      },
      labels: ["Average Results"],
    },
  });

  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    []
  );
  const [jobCodes, setJobCodes] = useState<string[]>([]);
  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dữ liệu đã chuyển đổi phù hợp biểu đồ
  const [dataEmployee, setDataEmployee] = useState<EmployeeData[]>([]);
  // Danh sách tên nhân viên (xaxis)
  const [categories, setCategories] = useState<string[]>([]);

  const [totalTargetMonth, setTotalTargetMonth] = useState<Summary>();

  // Hàm format tiền tệ rút gọn (vd: 2.5M, 1.2k,...)
  function formatCurrencyShort(value: number): string {
    if (value >= 1_000_000_000)
      return `${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, "")} B`;
    if (value >= 1_000_000)
      return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, "")} M`;
    if (value >= 1_000)
      return `${(value / 1_000).toFixed(2).replace(/\.00$/, "")}k`;
    return value.toString();
  }

  // Chuyển đổi dữ liệu API sang dạng biểu đồ, lọc theo khoảng từ ngày đến ngày
  function convertEmployeeData(input: result): any {
    if (input.data[0]?.dailyData) {
      setChartType("line");

      return input.data[0].dailyData.map((emp) => {
        return {
          name: formatDateToDayMonth(emp.date),
          actualLuotXe: emp.totalAmount,
          actualDoanhThu: emp.totalRevenue,
        };
      });
    } else {
      const isDateBased = input.data.some((emp) => !!emp.date);
      setChartType(isDateBased ? "line" : "bar");

      return input.data.map((emp) => {
        return {
          name:
            formatDateToDayMonth(emp.date ?? "") ||
            emp.employee?.name ||
            "Unknown",
          actualLuotXe: emp.totalAmount,
          actualDoanhThu: emp.totalRevenue,
        };
      });
    }
  }

  const TotalTaget = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("monthYear", year + "-" + month);

      const res = await axios.get<Result>(`/api/targets?${params.toString()}`);
      setTotalTargetMonth(res.data.summary);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dữ liệu từ API
  async function fetchData() {
    if (!dateRange || dateRange.length !== 2) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (dateRange[0] !== null && dateRange[1] !== null) {
        params.append("fromDate", dateRange[0].format("YYYY-MM-DD"));
        params.append("toDate", dateRange[1].format("YYYY-MM-DD"));
      }
      if (employeeId?.trim())
        params.append("employeeId", employeeId.trim() ?? "");
      if (industryCode?.trim())
        params.append("industryCode", industryCode.trim() ?? "");

      const res = await fetch(`/api/employees?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        if (json.data) {
          try {
            const converted = convertEmployeeData(json);
            setDataEmployee(converted);
            setCategories(converted.map((e: { name: any }) => e.name));
          } catch (error) {
            console.error("Lỗi trong convertEmployeeData:", error);
            setError("Lỗi xử lý dữ liệu biểu đồ");
            return;
          }
        } else {
          return;
        }
      } else {
        setError("Lấy dữ liệu thất bại từ server");
      }
    } catch (error) {
      setError("Lỗi mạng hoặc server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const res = await fetch("/api/infoEmployee");
        const data = await res.json();

        if (data.success) {
          setEmployees(data.employees);
          setJobCodes(data.jobCodes);
        } else {
          console.error("Lỗi fetch API:", data.message);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }

    fetchMetadata();
  }, []);

  // Config biểu đồ lượt xe
  const chartLuotXeOptions = {
    chart: { type: chartType as any, height: 350 },
    colors: ["#f5a971"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
        borderRadiusApplication: "end" as const,
        dataLabels: { position: "top" },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val,
      position: "top",
      offsetY: -15,
      style: { fontSize: "12px", colors: ["#000"], fontWeight: "bold" },
    },
    stroke: {
      show: true,
      width: chartType === "line" ? 2 : 0, // Ẩn viền cột khi bar
      colors: chartType === "line" ? ["#FF5733"] : ["transparent"],
    },
    xaxis: { categories, tickAmount: 12 },
    yaxis: { title: { text: "Lượt xe" } },
    markers: {
      size: 5,
      colors: ["#008FFB"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 7 },
    },
    tooltip: { y: { formatter: (val: number) => val.toLocaleString() } },
  };

  const chartLuotXeSeries = [
    {
      name: "Lượt xe",
      data: dataEmployee.map((e) => e.actualLuotXe),
      type: chartType === "line" ? "line" : "bar",
    },
  ];

  // Config biểu đồ doanh thu
  const chartDoanhThuOptions = {
    chart: { type: chartType as any, height: 350 },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
        borderRadiusApplication: "end" as const,
        dataLabels: { position: "top" },
      },
    },
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
      offsetY: -15,
      style: { fontSize: "12px", colors: ["#000"], fontWeight: "bold" },
    },
    stroke: {
      show: true,
      width: chartType === "line" ? 2 : 0, // Ẩn viền cột khi bar
      colors: chartType === "line" ? ["#FF5733"] : ["transparent"],
    },
    xaxis: { categories, tickAmount: 12 },

    tooltip: {
      y: {
        formatter: (val: number) =>
          val.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
      },
    },
  };

  const chartDoanhThuSeries = [
    {
      name: "Doanh thu",
      data: dataEmployee.map((e) => e.actualDoanhThu),
      type: chartType === "line" ? "line" : "bar",
    },
  ];

  const totalActualDoanhThu = formatCurrencyShort(
    Number(totalTargetMonth?.totalActualRevenue ?? 0)
  );
  const totalTargetDoanhThu = formatCurrencyShort(
    Number(totalTargetMonth?.totalTargetRevenue ?? 0)
  );

  const totalPercentDoanhThu = (
    ((totalTargetMonth?.totalActualRevenue ?? 0) /
      (totalTargetMonth?.totalTargetRevenue ?? 0)) *
    100
  ).toFixed(2);

  const totalActualLuotXe = formatCurrencyShort(
    Number(totalTargetMonth?.totalActualTrips ?? 0)
  );
  const totalTargetLuotXe = Number(totalTargetMonth?.totalTargetTrips ?? 0);

  const totalPercentLuotXe = (
    ((totalTargetMonth?.totalActualTrips ?? 0) /
      (totalTargetMonth?.totalTargetTrips ?? 0)) *
    100
  ).toFixed(2);

  // Tự động gọi fetch khi dateRange, name hoặc industryCode thay đổi
  useEffect(() => {
    fetchData();
    TotalTaget();
  }, [dateRange, employeeId, industryCode]);

  return (
    <div className="flex w-full gap-4 p-4 h-[calc(100vh)]">
      <ModalLoading isOpen={loading} />
      <div className="w-[250px] h-full shrink-0">
        <h2 className="text-2xl font-semibold text-center mb-2">
          Báo cáo chi tiết
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
            className="!bg-[#104b22] !text-white"
            type="primary"
            onClick={() => {
              setLoading(true);
              router.push("/dashboard/reportTarget");
            }}
          >
            Báo cáo tổng hợp
          </Button>
        </div>
        <div className="flex flex-col">
          <Form.Item label="Ngày">
            <RangePicker
              value={dateRange as [Dayjs | null, Dayjs | null]}
              onChange={(dates) => {
                if (dates && dates.length === 2 && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
              allowEmpty={[false, false]}
              format="DD/MM/YYYY"
            />
          </Form.Item>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              label="Tên nhân viên:"
              className="col-span-2"
              layout="vertical"
            >
              <Select
                showSearch
                placeholder="Tên nhân viên"
                value={employeeId}
                onChange={(e) => {
                  setIndustryCode(undefined);
                  setEmployeeId(e);
                }}
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={employees.map((code) => ({
                  value: code.id,
                  label: code.name,
                }))}
              />
            </Form.Item>
            <Form.Item label="Ngành:" layout="vertical">
              <Select
                className="w-full"
                showSearch
                placeholder="Mã gành"
                value={industryCode}
                onChange={(e) => {
                  setEmployeeId(undefined);
                  setIndustryCode(e);
                }}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                allowClear
                options={jobCodes.map((code) => ({
                  value: code,
                  label: code,
                }))}
              />
            </Form.Item>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            message="Lỗi"
            description={error}
            closable
            onClose={() => setError("")}
            style={{ marginBottom: 16 }}
          />
        )}

        {loading && <Text>Đang tải dữ liệu...</Text>}

        {!loading && (
          <>
            {/* Tổng quan Doanh Thu */}
            <Title level={4} className="text-center">
              Chỉ tiêu tháng {month} năm {year}{" "}
            </Title>
            <div className="flex flex-col pb-2">
              <Title level={3} className="text-center !mb-2">
                Doanh Thu
              </Title>
              <Text strong>
                Tổng doanh thu:{" "}
                <p
                  className={`${
                    Number(totalActualDoanhThu) > Number(totalTargetDoanhThu)
                      ? "text-green-700"
                      : "text-red-700"
                  } text-2xl inline`}
                >
                  {" "}
                  {totalActualDoanhThu}
                </p>
              </Text>
              <Text strong>
                Tiến độ Doan thu:{" "}
                <p
                  className={`${
                    Number(totalActualDoanhThu) > Number(totalTargetDoanhThu)
                      ? "text-green-700"
                      : "text-red-700"
                  } text-2xl inline`}
                >
                  {totalPercentDoanhThu}%
                </p>
              </Text>
              <Text strong>
                Mục tiêu doanh thu:{" "}
                <p className="text-2xl inline text-green-700">
                  {" "}
                  {totalTargetDoanhThu}
                </p>
              </Text>
            </div>
            <div className="flex flex-col mt-2 border-t border-[#999999]">
              <Title level={3} className="text-center !mb-2">
                Lượt xe
              </Title>
              <Text strong>
                Tổng lượt xe:{" "}
                <p
                  className={`${
                    Number(totalActualLuotXe) > Number(totalTargetLuotXe)
                      ? "text-green-700"
                      : "text-red-700"
                  } text-2xl inline`}
                >
                  {" "}
                  {totalActualLuotXe} lượt
                </p>
              </Text>
              <Text strong>
                Tiến độ lượt xe:{" "}
                <p
                  className={`${
                    Number(totalActualLuotXe) > Number(totalTargetLuotXe)
                      ? "text-green-700"
                      : "text-red-700"
                  } text-2xl inline`}
                >
                  {" "}
                  {totalPercentLuotXe}%
                </p>
              </Text>
              <Text strong>
                Mục tiêu lượt xe:{" "}
                <p className="text-2xl inline text-green-700">
                  {" "}
                  {totalTargetLuotXe} lượt
                </p>
              </Text>
            </div>

            {/* <div className="flex flex-col mt-5">
              <Text strong>Tổng lượt xe: </Text>
              <div className="mt-2 grid grid-cols-2">
                <Text className="">Mục tiêu: {totalTargetLuotXe} </Text>
                <Text className="">Đạt được: {totalActualLuotXe} </Text>
              </div>
              <div className="my-7 relative bg-[#bebebe] rounded-2xl h-3 w-full ">
                <div
                  style={{
                    width: `${
                      Number(totalPercentLuotXe) > 100
                        ? 100
                        : totalPercentLuotXe
                    }%`,
                  }}
                  className=" absolute left-0 top-0 h-full bg-gradient-to-bl from-[#fec194] to-[#ff0061] rounded-2xl"
                >
                  <div className="w-full relative h-full">
                    <Text className="absolute font-bold top-[-25px] right-[-20px] h-full">
                      {Number(totalPercentLuotXe) > 0
                        ? totalPercentLuotXe + "%"
                        : ""}
                    </Text>
                  </div>
                </div>

                <Text className=" font-bold absolute bottom-[-30px] right-0">
                  {totalTargetLuotXe} Lượt
                </Text>
                <Text className="font-bold absolute bottom-[-30px] left-0">
                  {totalActualLuotXe} Lượt
                </Text>
              </div>
            </div> */}
          </>
        )}
      </div>
      <div className="w-full h-full">
        {loading && <Text>Đang tải dữ liệu...</Text>}

        {!loading && (
          <div className="h-full grid grid-ro">
            <ClientChart
              options={chartDoanhThuOptions}
              series={chartDoanhThuSeries}
              type={chartType}
              height={"50%"}
            />
            <ClientChart
              options={chartLuotXeOptions}
              series={chartLuotXeSeries}
              type={chartType}
              height={"50%"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

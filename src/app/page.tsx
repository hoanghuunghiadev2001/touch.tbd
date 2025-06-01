/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Button,
  message,
  Space,
  Upload,
  UploadProps,
  Table,
  Input,
  DatePicker,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import ModalImportValue from "./component/modalImportValue";

export interface Result {
  success: boolean;
  data: Employee[];
}

export interface Employee {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  monthlyKPIs: MonthlyKPI[];
}

// export interface MonthlyKPI {
//   id: string;
//   employeeId: string;
//   month: number;
//   year: number;
//   tripTarget: number;
//   totalTrips: number;
//   revenueTarget: string;
//   totalRevenue: string;
//   createdAt: string;
//   updatedAt: string;
// }

export interface MonthlyKPI {
  id: string
  employeeId: string
  year: number
  month: number
  tripTarget: number
  revenueTarget: string
  amount: number
  createdAt: string
  updatedAt: string
  dailyKPIs: DailyKpi[]
  totalTrips: number
  totalRevenue: number
}

export interface DailyKpi {
  date: string
  amount: string
  ticketCode: string
}



interface DataType {
  id: string;
  key: string;
  stt: number;
  name: string;
  month: number;
  year: number;
  tripTarget: number;
  totalTrips: number;
  revenueTarget: string;
  totalRevenue: string;
}

export default function UploadTargetForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [openModalValue, setOpenModalValue] = useState(false);

  const [data, setData] = useState<Employee[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [monthYearFilter, setMonthYearFilter] = useState<dayjs.Dayjs | null>(
    null
  );

  const handleUpload: UploadProps["beforeUpload"] = (file) => {
    setFile(file);
    return false; // Ngăn auto upload của Antd
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthYearFilter) {
        params.append("monthYear", monthYearFilter.format("YYYY-MM"));
      }
      if (nameFilter) params.append("name", nameFilter);

      const res = await axios.get<Result>(`/api/targets?${params.toString()}`);
      setData(res.data.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!file) {
      message.warning("Vui lòng chọn file Excel!");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch("/api/targets/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi import");
      }
      message.success(data.message || "Import KPI thành công");
      setFile(null); // reset file sau khi import thành công
      fetchData(); // load lại dữ liệu sau import
    } catch (err: any) {
      message.error(err.message || "Lỗi import dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tạo dữ liệu cho table
  const tableData: DataType[] = data.flatMap((employee) =>
    employee.monthlyKPIs.map((kpi, index) => ({
      id: employee.id,
      key: `${employee.id}-${kpi.id}`,
      stt: index + 1,
      name: employee.name,
      month: kpi.month,
      year: kpi.year,
      tripTarget: kpi.tripTarget,
      totalTrips: kpi.totalTrips,
      revenueTarget: Number(kpi.revenueTarget).toLocaleString("vi-VN"),
      totalRevenue: Number(kpi.totalRevenue).toLocaleString("vi-VN"),
    }))
  );

  console.log(tableData);



  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      key: "stt",
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: "Tên nhân viên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Tháng",
      dataIndex: "month",
      key: "month",
      align: "center",
    },
    {
      title: "Năm",
      dataIndex: "year",
      key: "year",
      align: "center",
    },
    {
      title: "Chỉ tiêu lượt xe",
      dataIndex: "tripTarget",
      key: "tripTarget",
      align: "right",
    },
    {
      title: "Thực tế lượt xe",
      dataIndex: "totalTrips",
      key: "totalTrips",
      align: "right",
    },
    {
      title: "Chỉ tiêu doanh thu (VNĐ)",
      dataIndex: "revenueTarget",
      key: "revenueTarget",
      align: "right",
      render: (_, record) => <p>{aroundNumber(aroundNumber(record.revenueTarget))}</p>,

    },
    {
      title: "Thực tế doanh thu (VNĐ)",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right",
    },
    {
      title: "Chi tiết",
      render: (_, record) => (
        <Space>
          <Link href={`/dashboard/${record.id}/${encodeURIComponent(record.name)}`}>
            Chi tiết
          </Link>
        </Space>
      ),
    },
  ];

  function aroundNumber(input: string): string {

    // 1. Chuyển dấu phẩy (,) thành dấu chấm thập phân
    const normalized = input.replace(/\./g, "").replace(",", ".");

    // 2. Ép thành số và làm tròn lên
    const number = Math.ceil(parseFloat(normalized));

    // 3. Format lại với dấu chấm phân cách hàng nghìn (locale: vi-VN)
    return number.toLocaleString("vi-VN");
  }

  return (
    <div className="p-5">
      <ModalImportValue
        onClose={() => setOpenModalValue(false)}
        open={openModalValue}
      />
      <div className="flex justify-between items-center my-4">
        <Space>
          <Input
            placeholder="Tìm theo tên nhân viên"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
          <DatePicker
            picker="month"
            placeholder="Chọn tháng năm"
            format="MM/YYYY"
            value={monthYearFilter}
            onChange={(date) => setMonthYearFilter(date)}
            allowClear
            style={{ width: 150 }}
          />
          <Button onClick={fetchData} loading={loading}>
            Lọc
          </Button>
        </Space>

        <Space>
          <Upload beforeUpload={handleUpload} maxCount={1} accept=".xlsx,.xls">
            <Button icon={<UploadOutlined />}>Thêm chỉ tiêu tháng</Button>
          </Upload>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Cập nhật
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => setOpenModalValue(true)}
          >
            Cập nhật cho nhân viên
          </Button>
          <Button type="dashed" loading={loading}>
            <Link href={`/dashboard/report`}>Xem báo cáo</Link>
          </Button>
        </Space>
      </div>

      <Table<DataType> size="small" columns={columns} dataSource={tableData} />
    </div>
  );
}

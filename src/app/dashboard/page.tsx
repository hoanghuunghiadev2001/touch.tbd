/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { Table, Input, Button, Space, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import dayjs from "dayjs";
import Link from "next/link";

export interface result {
  success: boolean;
  data: Daum[];
}

export interface Daum {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  targets: TargetItem[];
}

export interface TargetItem {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  tripTarget: number;
  actualTrips: number;
  revenueTarget: string;
  actualRevenue: string;
  createdAt: string;
  updatedAt: string;
}

interface DataType {
  id: string;
  key: string;
  stt: number;
  name: string;
  month: number;
  year: number;
  tripTarget: number;
  actualTrips: number;
  revenueTarget: string;
  actualRevenue: string;
}

export default function TargetTable() {
  const [data, setData] = useState<Daum[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState<number | undefined>();
  const [yearFilter, setYearFilter] = useState<number | undefined>();

  const [monthYearFilter, setMonthYearFilter] = useState<dayjs.Dayjs | null>(
    null
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthYearFilter) {
        // Gửi param dạng "YYYY-MM" ví dụ "2025-05"
        params.append("monthYear", monthYearFilter.format("YYYY-MM"));
      }
      if (nameFilter) params.append("name", nameFilter);

      const res = await axios.get<result>(`/api/targets?${params.toString()}`);
      setData(res.data.data);
      console.log(res.data.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tableData: DataType[] = data.flatMap((employee) =>
    employee.targets.map((target, index) => ({
      id: employee.id,
      key: `${employee.id}-${target.id}`,
      stt: index + 1,
      name: employee.name,
      month: target.month,
      year: target.year,
      tripTarget: target.tripTarget,
      actualTrips: target.actualTrips,
      revenueTarget: Number(target.revenueTarget).toLocaleString("vi-VN"),
      actualRevenue: Number(target.actualRevenue).toLocaleString("vi-VN"),
    }))
  );

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      key: "stt",
      render: (text, record, index) => index + 1, // index bắt đầu từ 0, nên +1 cho STT
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
      dataIndex: "actualTrips",
      key: "actualTrips",
      align: "right",
    },
    {
      title: "Chỉ tiêu doanh thu (VNĐ)",
      dataIndex: "revenueTarget",
      key: "revenueTarget",
      align: "right",
    },
    {
      title: "Thực tế doanh thu (VNĐ)",
      dataIndex: "actualRevenue",
      key: "actualRevenue",
      align: "right",
    },
    {
      title: "Chi tiêts",
      render: (_, record) => (
        <Space>
          <Link
            href={`/dashboard/${record.id}/${encodeURIComponent(record.name)}`}
          >
            Chi tiết
          </Link>
        </Space>
      ),
    },
  ];

  // Picker for year and month
  // Antd DatePicker can pick month and year, but here we separate for clarity
  return (
    <div style={{ padding: 20 }}>
      <Space style={{ marginBottom: 16 }}>
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
          onChange={(date: React.SetStateAction<dayjs.Dayjs | null>) =>
            setMonthYearFilter(date)
          }
          allowClear
          style={{ width: 150 }}
        />
        <Button onClick={fetchData}>Lọc</Button>
      </Space>

      <Table<DataType> size="small" columns={columns} dataSource={tableData} />
    </div>
  );
}

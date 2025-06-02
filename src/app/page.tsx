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
  DatePicker,
  Form,
  Select,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import ModalImportValue from "./component/modalImportValue";
import ModalLoading from "./component/modalLoading";

export interface Result {
  success: boolean;
  data: Employee[];
  summary: Summary;
}

export interface Employee {
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
  id: string;
  employeeId: string;
  year: number;
  month: number;
  tripTarget: number;
  revenueTarget: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  dailyKPIs: DailyKpi[];
  totalTrips: number;
  totalRevenue: number;
}

export interface DailyKpi {
  date: string;
  amount: string;
  ticketCode: string;
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

  const [data, setData] = useState<Result>();
  const [nameFilter, setNameFilter] = useState<string>();
  const [monthYearFilter, setMonthYearFilter] = useState<dayjs.Dayjs | null>(
    dayjs().startOf("month")
  );
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const res = await fetch("/api/infoEmployee");
        const data = await res.json();

        if (data.success) {
          setEmployees(data.employees);
        } else {
          console.error("Lỗi fetch API:", data.message);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }

    fetchMetadata();
  }, []);

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
      if (nameFilter) params.append("employeeId", nameFilter);

      const res = await axios.get<Result>(`/api/targets?${params.toString()}`);
      setData(res.data);
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
  const tableData: DataType[] =
    data?.data?.flatMap((employee, index) => {
      if (!employee) return [];
      return {
        id: employee.employeeId,
        key: `${index + "-target"}`,
        stt: index + 1,
        name: employee.employeeName,
        month: employee.month,
        year: employee.year,
        tripTarget: employee.targetTrips,
        totalTrips: employee.actualTrips,
        revenueTarget: Number(employee.targetRevenue).toLocaleString("vi-VN"),
        totalRevenue: Number(employee.actualRevenue).toLocaleString("vi-VN"),
      };
    }) || [];

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
      render: (_, record) => (
        <p>{aroundNumber(aroundNumber(record.revenueTarget))}</p>
      ),
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
        <Space onClick={() => setLoading(true)}>
          <Link
            href={`/dashboard/${record.id}/${encodeURIComponent(record.name)}`}
          >
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

  useEffect(() => {
    if (!openModalValue) {
      setLoading(false);
    }
  }, [openModalValue]);

  useEffect(() => {
    console.log(loading);
  }, [loading]);

  return (
    <div className="p-5">
      <ModalLoading isOpen={loading} />
      <ModalImportValue
        loading={loading}
        onClose={() => {
          setOpenModalValue(false);
          setLoading(false);
        }}
        open={openModalValue}
        setLoading={setLoading}
      />
      <div className="flex justify-between items-center my-4">
        <Space>
          <Form.Item
            style={{ minWidth: "250px" }}
            label="Tên nhân viên"
            layout="horizontal"
            className="!m-0"
          >
            <Select
              showSearch
              placeholder="Tên nhân viên"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e);
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
          <DatePicker
            picker="month"
            placeholder="Chọn tháng năm"
            format="MM/YYYY"
            value={monthYearFilter}
            onChange={(date) => setMonthYearFilter(date)}
            allowClear
            style={{ width: 150 }}
          />
          <Button type="primary" onClick={fetchData} loading={loading}>
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
          <Button
            type="dashed"
            loading={loading}
            onClick={() => setLoading(true)}
          >
            <Link href={`/dashboard/report`}>Xem báo cáo</Link>
          </Button>
        </Space>
      </div>

      <Table<DataType>
        size="small"
        columns={columns}
        dataSource={tableData || []}
      />
    </div>
  );
}

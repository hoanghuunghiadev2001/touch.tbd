/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { useRouter } from "next/navigation";
import ModalAddKPIMonth from "../component/modalAddKPIMonth";
import ModalLoading from "../component/modalLoading";
import ModalDetailEmployee from "../component/modalDetailEmployee";
import ModalImportValue from "../component/modalImportValue";
import ModalImportTarget from "../component/modalImportTarget";

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

export interface EmployeeDetailKPI {
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  revenueTarget: string;
  tripTarget: number;
  dailyKPIs: DailyKpiDetail[];
}

export interface DailyKpiDetail {
  id: string;
  monthlyKPIId: string;
  date: string;
  jobCode: string;
  ticketCode: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
}

export default function UploadTargetForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [openModalValue, setOpenModalValue] = useState(false);
  const [openModalTarget, setOpenModalTarget] = useState(false);
  const [modalAddKPIMonth, setModalAddKPIMonth] = useState(false);
  const [monthTarget, setMontTarget] = useState<string>();
  const [form] = Form.useForm();

  const [data, setData] = useState<Result>();
  const [nameFilter, setNameFilter] = useState<string>();
  const [monthYearFilter, setMonthYearFilter] = useState<dayjs.Dayjs | null>(
    dayjs().startOf("month")
  );
  const [modalDetailEmployee, setModalDetaiEmployee] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    []
  );

  const [dataEmployeeDetail, setDataEmployeeDetail] =
    useState<EmployeeDetailKPI>();

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
  const EmployeeDetail = async (id: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthYearFilter) {
        params.append("employeeId", id);
        params.append("monthYear", monthYearFilter.format("YYYY-MM"));
      }

      const res = await axios.get<any>(`/api/kpis/${id}?${params.toString()}`);
      setDataEmployeeDetail(res.data);
      setModalDetaiEmployee(true);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
    setLoading(false);
  };

  const updateTarget = async (
    editAmountTarget: number,
    editTripTarget: number,
    setEditTarget: any
  ) => {
    if (dataEmployeeDetail) {
      const monthYear =
        dataEmployeeDetail?.year +
        "-" +
        (dataEmployeeDetail?.month < 10
          ? "0" + dataEmployeeDetail?.month
          : dataEmployeeDetail?.month);
      try {
        setLoading(true);
        // Call API PUT to update daily KPI

        const res = await fetch(`/api/kpis/${dataEmployeeDetail?.employeeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthYear: monthYear,
            updateType: "monthly",
            data: {
              revenueTarget: editAmountTarget,
              tripTarget: editTripTarget,
            },
          }),
        });
        const data = await res.json();
        if (res.ok) {
          EmployeeDetail(dataEmployeeDetail?.employeeId);
          fetchData();
          setEditTarget(false);
          message.success("Updated successfully");
          setLoading(false);
        } else {
          setLoading(false);
          message.error(data.error || "Update failed");
        }
      } catch (error) {
        setLoading(false);

        message.error("Update error");
      }
    }
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

  const handleSubmit = async (month: string, file?: File) => {
    if (!file) {
      message.warning("Vui lòng chọn file Excel!");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch(`/api/targets/import?month=${month}`, {
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

  const editDailyKPI = async (
    id: string,
    date: string,
    jobCode: string,
    ticketCode: string,
    amount: number,
    setEditingKey: any
  ) => {
    if (dataEmployeeDetail)
      try {
        // Validate date
        if (!date) {
          message.error("Date is required");
          return;
        }
        const monthYear =
          dataEmployeeDetail?.year +
          "-" +
          (dataEmployeeDetail?.month < 10
            ? "0" + dataEmployeeDetail?.month
            : dataEmployeeDetail?.month);
        // Call API PUT to update daily KPI
        const res = await fetch(`/api/kpis/${dataEmployeeDetail?.employeeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthYear,
            updateType: "daily",
            data: {
              id,
              date: date,
              jobCode: jobCode,
              ticketCode: ticketCode,
              amount: amount,
            },
          }),
        });
        const data = await res.json();
        if (res.ok) {
          message.success("Updated successfully");
          EmployeeDetail(dataEmployeeDetail?.employeeId);
          fetchData();
          setEditingKey(null);
          return res.ok;
        } else {
          message.error(data.error || "Update failed");
        }
      } catch (error) {
        message.error("Update error");
      }
  };

  // Delete daily KPI
  const deleteDailyKPI = async (id: string) => {
    if (dataEmployeeDetail?.employeeId)
      try {
        const res = await fetch(`/api/kpis/${dataEmployeeDetail?.employeeId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dailyKpiId: id }),
        });
        const data = await res.json();
        if (res.ok) {
          message.success("Deleted successfully");
          EmployeeDetail(dataEmployeeDetail?.employeeId);
          fetchData();
        } else {
          message.error(data.error || "Delete failed");
        }
      } catch (error) {
        message.error("Delete error");
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function parseVNDStringToNumber(vnd: string): number {
    return Number(vnd.replace(/\./g, ""));
  }

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
      render: (_, record) => (
        <p
          className={`${
            record.totalTrips > record.tripTarget
              ? "text-green-700"
              : "text-red-700"
          }`}
        >
          {record.totalTrips}
        </p>
      ),
    },
    {
      title: "Chỉ tiêu doanh thu (VNĐ)",
      dataIndex: "revenueTarget",
      key: "revenueTarget",
      align: "right",
      render: (_, record) => <p>{aroundNumber(record.revenueTarget)}</p>,
    },
    {
      title: "Thực tế doanh thu (VNĐ)",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right",
      render: (_, record) => (
        <p
          className={`${
            parseVNDStringToNumber(aroundNumber(record.totalRevenue)) >=
            parseVNDStringToNumber(aroundNumber(record.revenueTarget))
              ? "text-green-700"
              : "text-red-700"
          }`}
        >
          {record.totalRevenue}
        </p>
      ),
    },
    {
      title: "Chi tiết",
      render: (_, record) => (
        <Space
          className="text-blue-600 cursor-pointer"
          onClick={() => EmployeeDetail(record.id)}
        >
          Chi tiết
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

  return (
    <div className="pt-2 pb-5 px-5 ">
      <ModalLoading isOpen={loading} />
      <ModalAddKPIMonth
        setOpenModalTarget={setOpenModalTarget}
        onclose={() => setModalAddKPIMonth(false)}
        open={modalAddKPIMonth}
        setMontTarget={setMontTarget}
      />
      <ModalDetailEmployee
        editDailyKPI={editDailyKPI}
        onclose={() => {
          setModalDetaiEmployee(false);
          fetchData();
        }}
        open={modalDetailEmployee}
        dataEmployeeDetail={dataEmployeeDetail}
        deleteDailyKPI={deleteDailyKPI}
        updateTarget={updateTarget}
      />
      <ModalImportValue
        loading={loading}
        onClose={() => {
          setOpenModalValue(false);
          setLoading(false);
          fetchData();
        }}
        open={openModalValue}
        setLoading={setLoading}
      />
      <ModalImportTarget
        month={monthTarget ?? ""}
        loading={loading}
        onClose={() => {
          setOpenModalTarget(false);
          setLoading(false);
        }}
        open={openModalTarget}
        setLoading={setLoading}
        handleSubmit={handleSubmit}
      />
      <div className="flex justify-between items-center my-4">
        <Space>
          <Form form={form}>
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
          </Form>

          <DatePicker
            picker="month"
            placeholder="Chọn tháng năm"
            format="MM/YYYY"
            value={monthYearFilter}
            onChange={(date) => setMonthYearFilter(date)}
            allowClear={false}
            style={{ width: 150 }}
          />
          <Button type="primary" onClick={fetchData} loading={loading}>
            Tìm kiếm
          </Button>
        </Space>

        <Space>
          <Button
            type="primary"
            loading={loading}
            onClick={() => setModalAddKPIMonth(true)}
          >
            Thêm chỉ tiêu
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => setOpenModalValue(true)}
          >
            Cập nhật dữ liệu
          </Button>
          <Button
            type="dashed"
            loading={loading}
            onClick={() => {
              setLoading(true);
              router.push(`/dashboard/report`);
            }}
          >
            Xem báo cáo
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

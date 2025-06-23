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
  Modal,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs from "dayjs";
import Link from "next/link";
import ModalImportValue from "./component/modalImportValue";
import ModalLoading from "./component/modalLoading";
import ModalDetailEmployee from "./component/modalDetailEmployee";
import { useRouter } from "next/navigation";
import ModalImportTarget from "./component/modalImportTarget";
import ModalAddKPIMonth from "./component/modalAddKPIMonth";
import EmployeeManagerModal from "./component/modalEmployees";
import DailyKPIDeleteModal from "./component/modalDeleteKpiDay";
import { DataUser } from "./component/logout";

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
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<Result>();
  const [nameFilter, setNameFilter] = useState<string>();
  const [monthYearFilter, setMonthYearFilter] = useState<dayjs.Dayjs | null>(
    dayjs().startOf("month")
  );
  const [modalDeleteKpiDay, setModalDeleteKPIDay] = useState(false);
  const [modalDetailEmployee, setModalDetaiEmployee] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    []
  );
  const [dataUser, setDataUser] = useState<DataUser>();
  const [modalManagerEmployees, setModalManagerEmployees] =
    useState<boolean>(false);

  const [dataEmployeeDetail, setDataEmployeeDetail] =
    useState<EmployeeDetailKPI>();

  const year = monthYearFilter?.year();
  const month = (monthYearFilter?.month() ?? 0) + 1;

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
          messageApi.open({
            type: "success",
            content: "Cập nhật thành công!",
          });
          setLoading(false);
        } else {
          setLoading(false);
          messageApi.open({
            type: "error",
            content: "Cập nhật thất bại!",
          });
        }
      } catch (error) {
        setLoading(false);

        messageApi.open({
          type: "error",
          content: "Cập nhật thất bại!:" + error,
        });
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
      setLoading(false);
    } catch (error) {
      setLoading(false);

      console.error("Failed to fetch data", error);
    }
  };

  const handleSubmit = async (month: string, file?: File) => {
    if (!file) {
      messageApi.open({
        type: "warning",
        content: "Vui lòng chọn file Excel!",
      });
      return;
    }
    setLoading(true);

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
      messageApi.open({
        type: "success",
        content: data.message || "Import KPI thành công",
      });
      setFile(null); // reset file sau khi import thành công
      fetchData(); // load lại dữ liệu sau import
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      messageApi.open({
        type: "error",
        content: err.message || "Lỗi import dữ liệu",
      });
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
    setLoading(true);
    if (dataEmployeeDetail)
      try {
        // Validate date
        if (!date) {
          messageApi.open({
            type: "warning",
            content: "Date is required!",
          });
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
          messageApi.open({
            type: "success",
            content: "Cập nhật thành công",
          });
          EmployeeDetail(dataEmployeeDetail?.employeeId);
          fetchData();
          setLoading(false);
          setEditingKey(null);
          return res.ok;
        } else {
          setLoading(false);
          messageApi.open({
            type: "error",
            content: "Cập nhật thất bại",
          });
        }
      } catch (error) {
        setLoading(false);
        messageApi.open({
          type: "error",
          content: "Cập nhật thất bại",
        });
      }
  };

  // Delete daily KPI
  const deleteDailyKPI = async (id: string) => {
    setLoading(true);
    if (dataEmployeeDetail?.employeeId)
      try {
        const res = await fetch(`/api/kpis/${dataEmployeeDetail?.employeeId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dailyKpiId: id }),
        });
        const data = await res.json();
        if (res.ok) {
          messageApi.open({
            type: "success",
            content: `Xóa thành công`,
          });
          EmployeeDetail(dataEmployeeDetail?.employeeId);
          fetchData();
          setLoading(false);
        } else {
          setLoading(false);
          messageApi.open({
            type: "error",
            content: data.error || "Delete failed",
          });
        }
      } catch (error) {
        setLoading(false);
        messageApi.open({
          type: "error",
          content: "Date is required!",
        });
      }
  };

  async function getUser() {
    try {
      const req = await fetch("/api/users/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await req.json();

      if (!req.ok) {
        throw new Error(data.error || "lỗi khi lấy user");
      }
      setDataUser(data);
      if (data.role !== "USER") {
        fetchMetadata();
      }
      return data;
    } catch (error) {
      console.error("lỗi khi lấy user:", error);
      throw error;
    }
  }

  useEffect(() => {
    fetchData();
    getUser();
  }, []);

  async function fetchMetadata() {
    setLoading(true);

    try {
      const res = await fetch("/api/infoEmployee");
      const data = await res.json();

      if (data.success) {
        setEmployees(data.employees);
        setLoading(false);
      } else {
        setLoading(false);
        messageApi.open({
          type: "error",
          content: "Lỗi fetch API:" + data.message,
        });
        console.error("Lỗi fetch API:", data.message);
      }
    } catch (error) {
      setLoading(false);
      messageApi.open({
        type: "error",
        content: "Fetch error:" + error,
      });
      console.error("Fetch error:", error);
    }
  }

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
      width: "200px",
    },
    {
      title: "Tháng",
      dataIndex: "month",
      key: "month",
      align: "center",
      width: "100px",
    },
    {
      title: "Năm",
      dataIndex: "year",
      key: "year",
      align: "center",
      width: "100px",
    },
    {
      title: "Chỉ tiêu lượt xe",
      dataIndex: "tripTarget",
      key: "tripTarget",
      align: "right",
      width: "150px",
    },
    {
      title: "Thực tế lượt xe",
      dataIndex: "totalTrips",
      key: "totalTrips",
      align: "right",
      width: "150px",

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
      width: "200px",

      render: (_, record) => <p>{aroundNumber(record.revenueTarget)}</p>,
    },
    {
      title: "Thực tế doanh thu (VNĐ)",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right",
      width: "200px",
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
      width: "100px",

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

  const handleSubmitImportValue = async (file: File) => {
    if (!file) {
      messageApi.open({
        type: "warning",
        content: "Vui lòng chọn file Excel!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("/api/targets/importActual", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi import");
      setLoading(false);
      messageApi.open({
        type: "success",
        content: `Import thành công cho ${data.count} dòng`,
      });
      fetchData();

      setOpenModalValue(false);
    } catch (err: any) {
      messageApi.open({
        type: "error",
        content: err.message || "Lỗi import dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (selectedDays: string[]) => {
    setLoading(true);
    const res = await fetch("/api/kpis/dailyKpi/deleteByDay", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: selectedDays }),
    });

    const result = await res.json();
    setLoading(false);

    if (res.ok) {
      fetchData();

      messageApi.open({
        type: "success",
        content: `Đã xoá ${result.deletedCount} dòng KPI`,
      });
    } else {
      setLoading(false);

      messageApi.open({
        type: "success",
        content: result.error || "Lỗi khi xoá",
      });
    }
    setLoading(false);
  };

  return (
    <div className="pt-2 pb-5 px-5 ">
      {contextHolder}
      <ModalLoading isOpen={loading} />
      <ModalAddKPIMonth
        messageApi={messageApi}
        setOpenModalTarget={setOpenModalTarget}
        onclose={() => setModalAddKPIMonth(false)}
        open={modalAddKPIMonth}
        setMontTarget={setMontTarget}
        fetchData={fetchData}
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
        dataUser={dataUser}
      />
      <ModalImportValue
        loading={loading}
        onClose={() => {
          setOpenModalValue(false);
        }}
        open={openModalValue}
        handleSubmitImportValue={handleSubmitImportValue}
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
      <DailyKPIDeleteModal
        open={modalDeleteKpiDay}
        onClose={() => setModalDeleteKPIDay(false)}
        year={year ?? 0}
        month={month}
        messageApi={messageApi}
        handleDelete={handleDelete}
      />

      <EmployeeManagerModal
        onClose={() => setModalManagerEmployees(false)}
        open={modalManagerEmployees}
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

          <Button type="primary" onClick={fetchData}>
            Tìm kiếm
          </Button>
          {dataUser?.role && dataUser?.role !== "USER" && (
            <Button
              className="!bg-amber-600"
              type="primary"
              onClick={() => setModalManagerEmployees(true)}
            >
              Quản lý CVDV
            </Button>
          )}
        </Space>
        {dataUser?.role && dataUser?.role !== "USER" ? (
          <Space>
            <Button
              className="!bg-purple-800"
              type="primary"
              onClick={() => setModalAddKPIMonth(true)}
            >
              Thêm chỉ tiêu
            </Button>
            <Button
              className="!bg-yellow-800"
              type="primary"
              onClick={() => setOpenModalValue(true)}
            >
              Cập nhật dữ liệu
            </Button>
            <Button
              className="!bg-cyan-800"
              type="primary"
              onClick={() => setModalDeleteKPIDay(true)}
            >
              Quản lý Dữ liệu
            </Button>
            <Button
              className="!bg-[#104b22] !text-white"
              onClick={() => {
                setLoading(true);
                router.push(`/dashboard/reportTarget`);
              }}
            >
              Báo cáo chỉ tiêu
            </Button>
            <Button
              className="!bg-[#f54e4e] !text-white"
              onClick={() => {
                setLoading(true);
                router.push(`/dashboard/report`);
              }}
            >
              Báo cáo tổng hợp
            </Button>
          </Space>
        ) : (
          ""
        )}
      </div>

      <Table<DataType>
        size="small"
        columns={columns}
        dataSource={tableData || []}
        scroll={{ x: "100%", y: "calc(100vh - 200px)" }}
        pagination={{ pageSize: 15 }}
      />
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { DatePicker, Form, Modal, Select } from "antd";
import { EmployeeDetailKPI } from "../page";
import { useRouter } from "next/navigation";

import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  InputNumber,
  Popconfirm,
  Typography,
  message,
  Button,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Link from "next/link";
import { DataUser } from "./logout";

type DailyKPI = {
  id: string;
  date: string;
  jobCode?: string | null;
  ticketCode?: string | null;
  amount?: number | null;
};

interface ModalDetailEmployeeProps {
  open: boolean;
  onclose: () => void;
  dataEmployeeDetail?: EmployeeDetailKPI;
  editDailyKPI: (
    id: string,
    date: string,
    jobCode: string,
    ticketCode: string,
    amount: number,
    setEditingKey: any
  ) => void;
  deleteDailyKPI: (id: string) => void;
  updateTarget: (
    editAmountTarget: number,
    editTripTarget: number,
    setEditTarget: any
  ) => void;
  dataUser?: DataUser;
}

const ModalDetailEmployee = ({
  onclose,
  open,
  dataEmployeeDetail,
  editDailyKPI,
  deleteDailyKPI,
  updateTarget,
  dataUser,
}: ModalDetailEmployeeProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dailyKPIs, setDailyKPIs] = useState<DailyKPI[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Partial<DailyKPI>>({});
  const [editTarget, setEditTarget] = useState(false);
  const [jobCodes, setJobCodes] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);
  const [editTripTarget, setEditTripTarget] = useState<number>(
    dataEmployeeDetail?.tripTarget ?? 0
  );
  const [editAmountTarget, setEditAmountTarget] = useState<number>(
    Number(dataEmployeeDetail?.revenueTarget) ?? 0
  );

  const [adding, setAdding] = useState(false);
  const year = dataEmployeeDetail?.year;
  const month = dataEmployeeDetail?.month;
  const minDate = dayjs(`${year}-${month}-01`).format("YYYY-MM-DD");
  const maxDate = dayjs(`${year}-${month}-01`)
    .endOf("month")
    .format("YYYY-MM-DD");

  const [newKPI, setNewKPI] = useState<Partial<DailyKPI>>({
    date: dayjs(maxDate).format("YYYY-MM-DD"),
    jobCode: "",
    ticketCode: "",
    amount: 0,
  });
  const PAGE_SIZE = 15;

  const [currentPage, setCurrentPage] = useState(1);

  // Tính tổng số trang
  const totalPages = Math.ceil(dailyKPIs.length / PAGE_SIZE);

  const disabledDate = (current: dayjs.Dayjs) => {
    const start = dayjs(`${year}-${month}-01`);
    const end = start.endOf("month");
    return current < start || current > end;
  };

  const filteredKPIs = filterDate
    ? dailyKPIs.filter((item) => dayjs(item.date).isSame(filterDate, "day"))
    : dailyKPIs;

  const resetState = () => {
    setDailyKPIs(
      dataEmployeeDetail?.dailyKPIs.map((item: any) => ({
        ...item,
        amount: item.amount ? Number(item.amount) : null,
        date: item.date,
      })) || []
    );
    setNewKPI({
      date: dayjs(maxDate).format("YYYY-MM-DD"),
      jobCode: "",
      ticketCode: "",
      amount: 0,
    });
    setEditingKey(null);
    setAdding(false);
    setFormValues({});
    setEditTarget(false);
    setEditTripTarget(dataEmployeeDetail?.tripTarget ?? 0);
    setEditAmountTarget(Number(dataEmployeeDetail?.revenueTarget) ?? 0);
  };

  useEffect(() => {
    if (dataEmployeeDetail) {
      const dailyList = dataEmployeeDetail?.dailyKPIs.map((item: any) => ({
        ...item,
        amount: item.amount ? Number(item.amount) : null,
        date: item.date,
      }));
      setDailyKPIs(dailyList);
    }
  }, [dataEmployeeDetail]);

  useEffect(() => {
    if (!open) return;
    async function fetchMetadata() {
      try {
        const res = await fetch("/api/infoEmployee");
        const data = await res.json();

        if (data.success) {
          setJobCodes(data.jobCodes);
        } else {
          console.error("Lỗi fetch API:", data.message);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }

    fetchMetadata();
  }, [open]);

  const edit = (record: DailyKPI) => {
    setEditingKey(record.id);
    setFormValues({ ...record });
  };

  const cancel = () => {
    setEditingKey(null);
    setFormValues({});
  };

  const save = async (id: string) => {
    if (dataEmployeeDetail)
      editDailyKPI(
        id,
        formValues.date ?? "",
        formValues.jobCode ?? "",
        formValues.ticketCode ?? "",
        formValues.amount ?? 0,
        setEditingKey
      );
  };

  const handleAddNewKPI = async () => {
    try {
      const res = await fetch("/api/kpis/dailyKpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: dataEmployeeDetail?.employeeId,
          year: year,
          month: month,
          ...newKPI,
        }),
      });

      if (!res.ok) throw new Error("Thêm KPI thất bại");
      const createdKPI = await res.json();

      setDailyKPIs((prev) => [...prev, createdKPI]);
      message.success("Thêm KPI thành công");
      setAdding(false);
      setNewKPI({
        date: dayjs(maxDate).format("YYYY-MM-DD"),
        jobCode: "",
        ticketCode: "",
        amount: 0,
      });
    } catch (error) {
      console.error(error);
      message.error("Thêm KPI thất bại");
    }
  };

  const isEditing = (record: DailyKPI) => record.id === editingKey;

  const columns: ColumnsType<DailyKPI> = [
    {
      title: "STT",
      key: "stt",
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: "Ngày",
      dataIndex: "date",
      width: 130,
      render: (_, record) => {
        const isNew = record.id === "new";
        const value = isNew ? newKPI.date : formValues.date;

        if (isEditing(record) || isNew) {
          return (
            <Input
              min={minDate}
              max={maxDate}
              type="date"
              value={dayjs(value ? value : maxDate).format("YYYY-MM-DD")}
              onChange={(e) => {
                const date = e.target.value;
                if (isNew) {
                  setNewKPI((prev) => ({ ...prev, date }));
                } else {
                  setFormValues((prev) => ({ ...prev, date }));
                }
              }}
            />
          );
        }
        return dayjs(record.date).format("DD/MM/YYYY");
      },
    },
    {
      title: "Mã công việc",
      dataIndex: "jobCode",
      width: 150,
      render: (_, record) => {
        const isNew = record.id === "new";
        const value = isNew ? newKPI.jobCode : formValues.jobCode;

        if (isEditing(record) || isNew) {
          return (
            <Select
              className="w-full"
              showSearch
              placeholder="Mã gành"
              onChange={(e: any) => {
                const jobCode = e;
                if (isNew) {
                  setNewKPI((prev) => ({ ...prev, jobCode }));
                } else {
                  setFormValues((prev) => ({ ...prev, jobCode }));
                }
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
          );
        }
        return record.jobCode || "-";
      },
    },
    {
      title: "Mã vé",
      dataIndex: "ticketCode",
      width: 150,
      render: (_, record) => {
        const isNew = record.id === "new";
        const value = isNew ? newKPI.ticketCode : formValues.ticketCode;

        if (isEditing(record) || isNew) {
          return (
            <Input
              value={value ?? ""}
              onChange={(e) => {
                const ticketCode = e.target.value;
                if (isNew) {
                  setNewKPI((prev) => ({ ...prev, ticketCode }));
                } else {
                  setFormValues((prev) => ({ ...prev, ticketCode }));
                }
              }}
            />
          );
        }
        return record.ticketCode || "-";
      },
    },
    {
      title: "Doanh thu",
      dataIndex: "amount",
      width: 120,
      render: (_, record) => {
        const isNew = record.id === "new";
        const value = isNew ? newKPI.amount : formValues.amount;

        if (isEditing(record) || isNew) {
          return (
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              value={value ?? 0}
              onChange={(amount) => {
                if (isNew) {
                  setNewKPI((prev) => ({ ...prev, amount }));
                } else {
                  setFormValues((prev) => ({ ...prev, amount }));
                }
              }}
            />
          );
        }
        return record.amount?.toLocaleString() ?? "-";
      },
    },
    // {
    //   title: "Hành động",
    //   dataIndex: "actions",
    //   width: 160,
    //   render: (_, record) => {
    //     const editable = isEditing(record);
    //     const isNew = record.id === "new";

    //     if (isNew) {
    //       return (
    //         <Space>
    //           <Button type="link" onClick={handleAddNewKPI}>
    //             Lưu
    //           </Button>
    //           <Button type="link" danger onClick={() => setAdding(false)}>
    //             Huỷ
    //           </Button>
    //         </Space>
    //       );
    //     }

    //     return editable ? (
    //       <Space>
    //         <Button type="link" onClick={() => save(record.id)}>
    //           Lưu
    //         </Button>
    //         <Button type="link" onClick={cancel}>
    //           Huỷ
    //         </Button>
    //       </Space>
    //     ) : (
    //       <Space>
    //         <Button
    //           type="link"
    //           disabled={editingKey !== null || adding}
    //           onClick={() => edit(record)}
    //         >
    //           Sửa
    //         </Button>
    //         <Popconfirm
    //           title="Bạn có chắc muốn xoá?"
    //           onConfirm={() => deleteDailyKPI(record.id)}
    //           okText="Xoá"
    //           cancelText="Huỷ"
    //         >
    //           <Button
    //             type="link"
    //             danger
    //             disabled={editingKey !== null || adding}
    //           >
    //             Xoá
    //           </Button>
    //         </Popconfirm>
    //       </Space>
    //     );
    //   },
    // },
  ];

  function formatToVND(amount: number): string {
    if (amount < 1) {
      return "0";
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  useEffect(() => {
    if (dataEmployeeDetail) {
      setEditAmountTarget(Number(dataEmployeeDetail.revenueTarget));
      setEditTripTarget(dataEmployeeDetail.tripTarget);
    }
  }, [dataEmployeeDetail]);

  return (
    <Modal
      centered
      open={open}
      onCancel={() => {
        onclose();
        resetState();
      }}
      footer={null}
      width={1000}
    >
      <div className="flex justify-between items-center pr-10 mb-6">
        <h2 className="text-xl font-semibold">
          KPI tháng {dataEmployeeDetail?.month}/{dataEmployeeDetail?.year} -{" "}
          {dataEmployeeDetail?.employeeName}
        </h2>

        <Button
          type="dashed"
          loading={loading}
          onClick={() => {
            setLoading(true);
            router.push(
              `/dashboard/${
                dataEmployeeDetail?.employeeId
              }/${encodeURIComponent(dataEmployeeDetail?.employeeName ?? "")}`
            );
          }}
        >
          Xem báo cáo
        </Button>
      </div>

      <div className="flex justify-between">
        <div className="flex justify-end mb-4 items-center gap-2">
          <span>Lọc theo ngày:</span>
          <DatePicker
            value={filterDate}
            onChange={(date) => {
              setFilterDate(date);
              setCurrentPage(1);
            }}
            allowClear
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            disabledDate={disabledDate}
          />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <strong>KPI: Lượt xe - </strong>{" "}
          {editTarget ? (
            <Input
              className="!w-[100px]"
              type="number"
              value={editTripTarget}
              onChange={(e) => setEditTripTarget(Number(e.target.value))}
            />
          ) : (
            dataEmployeeDetail?.tripTarget ?? "0"
          )}{" "}
          | <strong>KPI: Doanh thu - </strong>{" "}
          {editTarget ? (
            <Input
              className="!w-[150px]"
              type="number"
              value={editAmountTarget}
              onChange={(e) => setEditAmountTarget(Number(e.target.value))}
            />
          ) : dataEmployeeDetail?.revenueTarget ? (
            formatToVND(Number(dataEmployeeDetail?.revenueTarget) ?? 0)
          ) : (
            0
          )}
          {editTarget && dataUser?.role !== "USER" ? (
            <div className="flex gap-2 ">
              <Button
                type="link"
                onClick={() => {
                  updateTarget(editAmountTarget, editTripTarget, setEditTarget);
                }}
              >
                Lưu
              </Button>
              <Button
                type="link"
                onClick={() => {
                  setEditTarget(false);
                }}
              >
                Hủy
              </Button>
            </div>
          ) : dataUser?.role !== "USER" ? (
            <Button
              type="link"
              onClick={() => {
                setEditTarget(true);
              }}
            >
              Sửa
            </Button>
          ) : null}
        </div>

        {/* <div className="flex justify-end mb-2">
          {!adding ? (
            <Button
              type="primary"
              onClick={() => {
                setAdding(true);
                setCurrentPage(totalPages + 1);
                console.log(totalPages + 1);
              }}
              disabled={editingKey !== null}
            >
              + Thêm dữ liệu
            </Button>
          ) : null}
        </div> */}
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        scroll={{ y: "calc(100vh - 350px)" }}
        pagination={{
          pageSize: PAGE_SIZE,
          current: currentPage,
          onChange: (page) => setCurrentPage(page),
        }}
        dataSource={
          (adding
            ? [...filteredKPIs, { id: "new", ...newKPI }]
            : filteredKPIs) as DailyKPI[]
        }
      />
    </Modal>
  );
};

export default ModalDetailEmployee;

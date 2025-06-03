/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Modal } from "antd";
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

type DailyKPI = {
  id: string;
  date: string; // ISO string
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
}
const ModalDetailEmployee = ({
  onclose,
  open,
  dataEmployeeDetail,
  editDailyKPI,
  deleteDailyKPI,
  updateTarget,
}: ModalDetailEmployeeProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dailyKPIs, setDailyKPIs] = useState<DailyKPI[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Partial<DailyKPI>>({});
  const [editTarget, setEditTarget] = useState(false);
  const [editTripTarget, setEditTripTarget] = useState<number>(
    dataEmployeeDetail?.tripTarget ?? 0
  );
  const [editAmountTarget, setEditAmountTarget] = useState<number>(
    Number(dataEmployeeDetail?.revenueTarget) ?? 0
  );

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

  // Start editing a row
  const edit = (record: DailyKPI) => {
    setEditingKey(record.id);
    setFormValues({ ...record });
  };

  // Cancel editing
  const cancel = () => {
    setEditingKey(null);
    setFormValues({});
  };

  // Save edit
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

  // Editable cell renderers
  const isEditing = (record: DailyKPI) => record.id === editingKey;

  const columns: ColumnsType<DailyKPI> = [
    {
      title: "Ngày",
      dataIndex: "date",
      width: 130,
      render: (_, record) => {
        if (isEditing(record)) {
          return (
            <Input
              type="date"
              value={dayjs(formValues.date).format("YYYY-MM-DD")}
              onChange={(e) =>
                setFormValues((prev: any) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
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
        if (isEditing(record)) {
          return (
            <Input
              value={formValues.jobCode || ""}
              onChange={(e) =>
                setFormValues((prev: any) => ({
                  ...prev,
                  jobCode: e.target.value,
                }))
              }
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
        if (isEditing(record)) {
          return (
            <Input
              value={formValues.ticketCode || ""}
              onChange={(e) =>
                setFormValues((prev: any) => ({
                  ...prev,
                  ticketCode: e.target.value,
                }))
              }
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
        if (isEditing(record)) {
          return (
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              value={formValues.amount ?? 0}
              onChange={(value) =>
                setFormValues((prev: any) => ({ ...prev, amount: value ?? 0 }))
              }
            />
          );
        }
        return record.amount?.toLocaleString() ?? "-";
      },
    },
    {
      title: "Hành động",
      dataIndex: "actions",
      width: 160,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button type="link" onClick={() => save(record.id)}>
              Lưu
            </Button>
            <Button type="link" onClick={cancel}>
              Huỷ
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="link"
              disabled={editingKey !== null}
              onClick={() => edit(record)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc muốn xoá?"
              onConfirm={() => deleteDailyKPI(record.id)}
              okText="Xoá"
              cancelText="Huỷ"
            >
              <Button type="link" danger disabled={editingKey !== null}>
                Xoá
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  function formatToVND(amount: number): string {
    if (amount < 1) {
      return "0";
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0, // VNĐ thường không có số lẻ
    }).format(amount);
  }

  useEffect(() => {
    if (dataEmployeeDetail) {
      setEditAmountTarget(Number(dataEmployeeDetail.revenueTarget));
      setEditTripTarget(dataEmployeeDetail.tripTarget);
    }
  }, [dataEmployeeDetail]);

  return (
    <Modal centered open={open} onCancel={onclose} footer={null} width={1000}>
      <div className="flex justify-between items-center pr-10">
        <h2 className="mb-4 text-xl font-semibold">
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
          formatToVND(
            Number(dataEmployeeDetail?.revenueTarget?.toLocaleString()) ?? 0
          ) ?? "-"
        ) : (
          0
        )}
        {editTarget ? (
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
        ) : (
          <Button
            type="link"
            onClick={() => {
              setEditTarget(true);
            }}
          >
            Sửa
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={dailyKPIs}
        scroll={{ y: "calc(100vh - 300px)" }}
      />
    </Modal>
  );
};
export default ModalDetailEmployee;

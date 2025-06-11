/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { Modal, Checkbox } from "antd";
import { MessageInstance } from "antd/es/message/interface";
import ModalLoading from "./modalLoading";

type DailyKPIDeleteModalProps = {
  open: boolean;
  onClose: () => void;
  year: number;
  month: number;
  fetchData: () => void;
  messageApi: MessageInstance;
};

const DailyKPIDeleteModal: React.FC<DailyKPIDeleteModalProps> = ({
  open,
  onClose,
  year,
  month,
  fetchData,
  messageApi,
}) => {
  const [days, setDays] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/kpis/dailyKpi/dayInMonth?year=${year}&month=${month}`)
        .then((res) => res.json())
        .then((data) => {
          setDays(data);
          setSelectedDays([]);
          setLoading(false);
        })
        .catch(() => {
          messageApi.open({
            type: "error",
            content: `Lỗi server`,
          });
          setLoading(false);
        });
    }
  }, [open, year, month]);

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch("/api/kpis/dailyKpi/deleteByDay", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: selectedDays }),
    });

    const result = await res.json();
    setLoading(false);

    if (res.ok) {
      messageApi.open({
        type: "success",
        content: `Đã xoá ${result.deletedCount} dòng KPI`,
      });
      fetchData();
      onClose();
    } else {
      messageApi.open({
        type: "success",
        content: result.error || "Lỗi khi xoá",
      });
    }
  };

  return (
    <Modal
      title={`Xoá dữ liệu DailyKPI tháng ${month}/${year}`}
      open={open}
      onCancel={onClose}
      onOk={handleDelete}
      okButtonProps={{ disabled: selectedDays.length === 0, loading }}
      okText="Xoá đã chọn"
    >
      <ModalLoading isOpen={loading} />
      {days.length === 0 ? (
        <p>Không có dữ liệu DailyKPI trong tháng này.</p>
      ) : (
        <Checkbox.Group
          value={selectedDays}
          onChange={(checkedValues) =>
            setSelectedDays(checkedValues as string[])
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {days.map((day) => (
              <Checkbox key={day} value={day}>
                {day}
              </Checkbox>
            ))}
          </div>
        </Checkbox.Group>
      )}
    </Modal>
  );
};

export default DailyKPIDeleteModal;

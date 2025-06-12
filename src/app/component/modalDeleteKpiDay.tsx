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
  handleDelete: (days: string[]) => void;
  messageApi: MessageInstance;
};

const DailyKPIDeleteModal: React.FC<DailyKPIDeleteModalProps> = ({
  open,
  onClose,
  year,
  month,
  handleDelete,
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

  return (
    <Modal
      title={`Xoá dữ liệu DailyKPI tháng ${month}/${year}`}
      open={open}
      onCancel={onClose}
      onOk={() => handleDelete(selectedDays)}
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

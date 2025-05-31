/* eslint-disable @typescript-eslint/no-explicit-any */
// 📂 components/ImportTargetForm.tsx
"use client";

import { useState } from "react";
import { Upload, Button, DatePicker, message, Space, Modal } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
interface ModalImportValueProps {
  open: boolean;
  onClose: () => void;
}
const ModalImportValue = ({ onClose, open }: ModalImportValueProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [monthYear, setMonthYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload: UploadProps["beforeUpload"] = (file) => {
    setFile(file);
    return false; // Ngăn auto upload của Antd
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setMonthYear(date.format("MM-YYYY"));
    } else {
      setMonthYear(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      message.warning("Vui lòng chọn file Excel!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (monthYear) formData.append("monthYear", monthYear);

    setLoading(true);
    try {
      const res = await fetch("/api/targets/importActual", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi import");

      message.success(`Import thành công cho tháng ${data.month}-${data.year}`);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Thêm dữ liệu cho nhân viên"
      style={{ top: 20 }}
      open={open}
      onCancel={onClose}
      footer={null} // Tắt footer
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Upload beforeUpload={handleUpload} maxCount={1} accept=".xlsx, .xls">
          <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
        </Upload>

        <DatePicker
          picker="month"
          format="MM-YYYY"
          placeholder="Chọn tháng-năm (nếu không chọn sẽ là tháng hiện tại)"
          onChange={handleDateChange}
          allowClear
          style={{ width: "100%" }}
        />

        <Button type="primary" loading={loading} onClick={handleSubmit}>
          Import Chỉ tiêu
        </Button>
      </Space>
    </Modal>
  );
};

export default ModalImportValue;

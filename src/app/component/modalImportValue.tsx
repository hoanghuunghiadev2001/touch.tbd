/* eslint-disable @typescript-eslint/no-explicit-any */
// 📂 components/ImportTargetForm.tsx
"use client";

import { useState } from "react";
import { Upload, Button, message, Space, Modal } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
interface ModalImportValueProps {
  open: boolean;
  onClose: () => void;
  setLoading: (value: boolean) => void;
  loading: boolean;
}
const ModalImportValue = ({
  onClose,
  open,
  setLoading,
  loading,
}: ModalImportValueProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload: UploadProps["beforeUpload"] = (file) => {
    setFile(file);
    return false; // Ngăn auto upload của Antd
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
      const res = await fetch("/api/targets/importActual", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi import");
      setLoading(false);
      message.success(`Import thành công cho tháng ${data.month}-${data.year}`);
      onClose();
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
      <Space direction="horizontal" size="large" style={{ width: "100%" }}>
        <Upload beforeUpload={handleUpload} maxCount={1} accept=".xlsx, .xls">
          <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
        </Upload>
        <Button
          type="primary"
          loading={loading}
          disabled={file ? false : true}
          onClick={handleSubmit}
        >
          Cập nhật dữ liệu
        </Button>
      </Space>
    </Modal>
  );
};

export default ModalImportValue;

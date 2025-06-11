/* eslint-disable @typescript-eslint/no-explicit-any */
// 📂 components/ImportTargetForm.tsx
"use client";

import { useState } from "react";
import { Upload, Button, Space, Modal } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
interface ModalImportValueProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  handleSubmitImportValue: (file: File) => void;
}
const ModalImportValue = ({
  onClose,
  open,
  loading,
  handleSubmitImportValue,
}: ModalImportValueProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload: UploadProps["beforeUpload"] = (file) => {
    setFile(file);
    return false; // Ngăn auto upload của Antd
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
          onClick={() => (file ? handleSubmitImportValue(file) : "")}
        >
          Cập nhật dữ liệu
        </Button>
      </Space>
    </Modal>
  );
};

export default ModalImportValue;

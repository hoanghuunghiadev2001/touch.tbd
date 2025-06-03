/* eslint-disable @typescript-eslint/no-explicit-any */
// 📂 components/ImportTargetForm.tsx
"use client";

import { useState } from "react";
import { Upload, Button, Space, Modal } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
interface ModalImportTargetProps {
  open: boolean;
  onClose: () => void;
  setLoading: (value: boolean) => void;
  loading: boolean;
  handleSubmit: (file?: File) => void;
}
const ModalImportTarget = ({
  onClose,
  open,
  loading,
  handleSubmit,
}: ModalImportTargetProps) => {
  const [file, setFile] = useState<File>();

  const handleUpload: UploadProps["beforeUpload"] = (file) => {
    setFile(file);
    return false; // Ngăn auto upload của Antd
  };

  return (
    <Modal
      title="Thêm chỉ tiêu "
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
          onClick={() => handleSubmit(file)}
        >
          Cập nhật Chỉ tiêu
        </Button>
      </Space>
    </Modal>
  );
};

export default ModalImportTarget;

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { Modal, Table, Button, Form, Input, message } from "antd";
import axios from "axios";

interface Employee {
  id: string;
  name: string;
  employeeCode?: string | null;
}

const EmployeeManagerModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [form] = Form.useForm();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get<Employee[]>("/api/getAllEmployees");
      setEmployees(res.data);
    } catch (err) {
      message.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    form.setFieldsValue(employee);
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`/api/employees/${selectedEmployee?.id}`, values);
      message.success("Cập nhật thành công");
      setEditModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      message.error(err.response?.data?.error || "Cập nhật thất bại");
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const columns = [
    { title: "Tên nhân viên", dataIndex: "name" },
    { title: "Mã nhân viên", dataIndex: "employeeCode" },
    {
      title: "Hành động",
      render: (_: any, record: Employee) => (
        <Button onClick={() => handleEdit(record)} type="link">
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <>
      <Modal
        title="Quản lý CVDV"
        open={open}
        onCancel={onClose}
        footer={null}
        width={700}
      >
        <Table
          dataSource={employees ?? []}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={false}
          scroll={{ y: "calc(100vh - 300px)" }}
        />
      </Modal>

      <Modal
        title="Chỉnh sửa nhân viên"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleUpdate}
        okText="Lưu"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Tên nhân viên"
            name="name"
            rules={[{ required: true, message: "Nhập tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Mã nhân viên"
            name="employeeCode"
            rules={[{ required: true, message: "Nhập mã nhân viên" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EmployeeManagerModal;

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Select,
} from "antd";

interface Manager {
  id: string;
  name: string;
  email: string;
}

export interface DataUser {
  id: string;
  name: string;
  email: string;
  role: string;
  managedById: any;
  managedBy: any;
  subordinates: any[];
  createdAt: string;
  updatedAt: string;
}

export default function ManagerPage() {
  const [managers, setManagers] = useState<DataUser[]>([]);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState<DataUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAllUser = async () => {
    const res = await fetch("/api/users/all-user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch user");
    }

    const data: DataUser[] = await res.json();
    setManagers(data);
  };

  const showModal = (manager?: DataUser) => {
    if (manager) {
      setEditing(manager);
      form.setFieldsValue(manager);
    } else {
      setEditing(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  async function deleteUser(id: string) {
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Xóa user thất bại");
      }

      fetchAllUser();
      // Có thể thêm thông báo hoặc cập nhật UI ở đây
    } catch (err: any) {
      console.error("Lỗi xóa user:", err.message);
    }
  }

  async function resetPassword(userId: string) {
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Reset mật khẩu thất bại");
      }

      const data = await res.json();
      console.log(data.message);
      alert(data.message); // Hoặc dùng message.success của Antd
    } catch (err: any) {
      console.error("Lỗi reset mật khẩu:", err.message);
      alert(err.message);
    }
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (editing) {
        // Cập nhật user (PUT)
        // Lấy id từ editing, các field khác lấy từ values (form)
        const user = {
          id: editing.id,
          name: values.name,
          email: values.email,
          role: values.role,
        };

        const res = await fetch("/api/users", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Cập nhật thất bại");
        }

        message.success("Cập nhật thành công");
      } else {
        // Thêm mới user (POST)
        const now = new Date().toISOString();
        // Gửi dữ liệu từ form
        const newUser = {
          ...values,
          createdAt: now,
          updatedAt: now,
        };

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUser),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Thêm mới thất bại");
        }

        message.success("Thêm mới thành công");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchAllUser(); // Reload danh sách
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Đã xảy ra lỗi");
    }
  };

  useEffect(() => {
    fetchAllUser();
  }, []);
  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Vài trò",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: DataUser) => (
        <Space>
          <Button onClick={() => showModal(record)}>Sửa</Button>
          <Popconfirm
            title="Xác nhận xóa?"
            onConfirm={() => deleteUser(record.id)}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
          <Button onClick={() => resetPassword(record.id)} type="dashed">
            Reset mật khẩu
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4 items-center">
        <h1 className="text-2xl font-bold">Quản lý Manager</h1>
        <Button type="primary" onClick={() => showModal()}>
          Thêm Manager
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={managers}
        className="bg-white rounded shadow"
      />

      <Modal
        title={editing ? "Sửa Manager" : "Thêm Manager"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select>
              <Select.Option value="MANAGER">MANAGER</Select.Option>
              <Select.Option value="ADMIN">ADMIN</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

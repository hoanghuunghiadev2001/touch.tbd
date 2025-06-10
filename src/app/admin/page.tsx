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
import ModalLoading from "../component/modalLoading";

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
  const [loading, setLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchAllUser = async () => {
    setLoading(true);
    const res = await fetch("/api/users/all-user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      setLoading(false);
      const error = await res.json();
      messageApi.open({
        type: "error",
        content: error.error || "Tải danh sách thất bại",
      });
      throw new Error(error.error || "Failed to fetch user");
    }
    setLoading(false);
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
    setLoading(true);
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
        setLoading(false);
        messageApi.open({
          type: "error",
          content: error.error || "Xóa user thất bại",
        });
        throw new Error(error.error || "Xóa user thất bại");
      }
      setLoading(false);
      messageApi.open({
        type: "success",
        content: "Xóa thành công",
      });
      fetchAllUser();
      // Có thể thêm thông báo hoặc cập nhật UI ở đây
    } catch (err: any) {
      setLoading(false);
      messageApi.open({
        type: "error",
        content: "Lỗi xóa user:" + err.message,
      });
      console.error("Lỗi xóa user:", err.message);
    }
  }

  async function resetPassword(userId: string) {
    setLoading(true);
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
        setLoading(false);
        messageApi.open({
          type: "error",
          content: errorData.error || "Reset mật khẩu thất bại",
        });

        throw new Error(errorData.error || "Reset mật khẩu thất bại");
      }

      const data = await res.json();
      setLoading(false);
      messageApi.open({
        type: "success",
        content: "Reset mật khẩu thành công",
      });
    } catch (err: any) {
      setLoading(false);
      console.error("Lỗi reset mật khẩu:", err.message);
      messageApi.open({
        type: "error",
        content: err.message,
      });
    }
  }

  const handleOk = async () => {
    setLoading(true);
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
          setLoading(false);
          messageApi.open({
            type: "error",
            content: error.error || "Cập nhật thất bại",
          });
          throw new Error(error.error || "Cập nhật thất bại");
        }

        setLoading(false);
        messageApi.open({
          type: "success",
          content: "Cập nhật thành công",
        });
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
          setLoading(false);

          messageApi.open({
            type: "error",
            content: error.error || "Thêm mới thất bại",
          });
          throw new Error(error.error || "Thêm mới thất bại");
        }

        setLoading(false);
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchAllUser(); // Reload danh sách
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      messageApi.open({
        type: "error",
        content: err.message || "Đã xảy ra lỗi",
      });
      setLoading(false);
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
          <Button type="primary" onClick={() => showModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            onConfirm={() => deleteUser(record.id)}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
          <Popconfirm
            title="Xác nhận đổi mật khẩu?"
            onConfirm={() => resetPassword(record.id)}
          >
            <Button type="dashed">Reset mật khẩu</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <ModalLoading isOpen={loading} />
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

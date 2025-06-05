/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { DatePicker, Form, Modal } from "antd";

import React, { useEffect, useState } from "react";
import { Table, InputNumber, message, Button } from "antd";
import dayjs from "dayjs";
import { DownloadOutlined, SaveFilled, SaveOutlined } from "@ant-design/icons";

interface Employee {
  id: string;
  name: string;
}

interface KPIInput {
  employeeId: string;
  tripTarget?: number;
  revenueTarget?: number;
  amount?: number;
}

interface ModalAddKPIMonthProps {
  open: boolean;
  onclose: () => void;
  setOpenModalTarget: (value: boolean) => void;
}
const ModalAddKPIMonth = ({
  onclose,
  open,
  setOpenModalTarget,
}: ModalAddKPIMonthProps) => {
  const [formAdd] = Form.useForm();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const employeesData = result.data.map((item: any) => item.employee);
        setEmployees(employeesData);
      } else {
        setEmployees([]);
        message.error("Dữ liệu nhân viên không đúng định dạng");
      }
    } catch (error) {
      message.error("Lỗi lấy danh sách nhân viên");
    }
  };
  const onFinish = async (values: any) => {
    const kpiDate = values.date;
    const year = kpiDate.year();
    const month = kpiDate.month() + 1;

    const kpiList: KPIInput[] = (employees ?? []).map((emp) => ({
      employeeId: emp.id,
      tripTarget: values[`tripTarget_${emp.id}`],
      revenueTarget: values[`revenueTarget_${emp.id}`],
      amount: values[`amount_${emp.id}`],
    }));

    try {
      setLoading(true);
      const res = await fetch("/api/kpis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year, month, data: kpiList }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      message.success("Tạo chỉ tiêu tháng thành công");
    } catch (error: any) {
      message.error(error?.message || "Tạo chỉ tiêu thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <Modal
      centered
      open={open}
      onCancel={() => {
        formAdd.resetFields();
        onclose();
      }}
      footer={null}
      width={1000}
    >
      <h2 className="mb-4 text-xl font-semibold text-center">Thêm chỉ tiêu</h2>

      <Form
        form={formAdd}
        onFinish={onFinish}
        layout="horizontal"
        initialValues={{
          date: dayjs(), // ⬅️ Dùng ở đây thay vì defaultValue
        }}
      >
        <div className="flex justify-between">
          <Form.Item
            name="date"
            label="Chọn tháng"
            rules={[{ required: true, message: "Vui lòng chọn tháng" }]}
          >
            <DatePicker
              picker="month"
              allowClear={false}
              disabledDate={(current) => {
                return current && current < dayjs().startOf("month");
              }}
            />
          </Form.Item>
          <Button
            type="dashed"
            icon={<DownloadOutlined />}
            loading={loading}
            onClick={() => {
              setOpenModalTarget(true);
            }}
          >
            Import file excel
          </Button>
        </div>

        <Table
          dataSource={employees ?? []}
          rowKey="id"
          pagination={false}
          bordered
          scroll={{ y: "calc(100vh - 335px)" }}
          columns={[
            {
              title: "Tên nhân viên",
              dataIndex: "name",
            },
            {
              title: "Chỉ tiêu lượt xe",
              render: (_, record) => (
                <Form.Item
                  name={`tripTarget_${record.id}`}
                  style={{ margin: 0 }}
                >
                  <InputNumber type="number" min={0} placeholder="Chuyến đi" />
                </Form.Item>
              ),
            },
            {
              title: "Chỉ tiêu doanh thu (VNĐ)",
              render: (_, record) => (
                <Form.Item
                  name={`revenueTarget_${record.id}`}
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    type="number"
                    min={0}
                    placeholder="Doanh thu"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              ),
            },
          ]}
        />

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          style={{ marginTop: 16 }}
          icon={<SaveOutlined />}
        >
          Lưu chỉ tiêu
        </Button>
      </Form>
    </Modal>
  );
};
export default ModalAddKPIMonth;

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Form, Input, Button, Card, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ModalLoading from "../component/modalLoading";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mousemove", handleMouseMove);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Đăng nhập thất bại");
        message.error(data.error || "Đăng nhập thất bại");
      } else {
        localStorage.setItem("token", data.token);
        message.success("Đăng nhập thành công");
        router.push(data.role === "ADMIN" ? "/admin" : "/");
      }
    } catch (err) {
      setLoginError("Lỗi hệ thống");
      message.error("Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center min-h-screen relative"
    >
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm h-full z-0"
        style={{
          backgroundImage: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.65), transparent 50%), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "background-image 0.1s ease-out",
        }}
      ></div>

      <ModalLoading isOpen={loading} />

      <Card
        variant="borderless"
        className="relative z-10 max-w-md w-full rounded-3xl bg-white/80 shadow-2xl backdrop-blur-md"
      >
        <div className="text-center mb-3">
          <div className="flex justify-center relative w-full">
            <Image
              src="/images/logo-toyota.webp"
              alt="Logo Toyota"
              width={100}
              height={70}
              className="object-contain w-[100px] h-[70px]"
            />
            <div
              className="absolute inset-0 rounded-md"
              style={{
                background: "linear-gradient(90deg, #7e22ce 0%, #db2777 100%)",
                mixBlendMode: "overlay",
                pointerEvents: "none",
              }}
            />
          </div>
          <Typography.Title
            level={2}
            className="mt-2 !font-bold !text-[#4b0082]"
          >
            Đăng nhập
          </Typography.Title>
          <Typography.Text type="secondary">
            Vui lòng nhập thông tin tài khoản của bạn
          </Typography.Text>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email của bạn"
              size="large"
              className="rounded-xl"
              onChange={() => setLoginError(null)}
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
            ]}
          >
            <Input.Password
              onChange={() => setLoginError(null)}
              
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
              className="rounded-xl"
            />
          </Form.Item>

          {loginError && (
            <p className="text-center text-red-600 italic mb-1">{loginError}</p>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="rounded-xl font-semibold text-lg"
              style={{
                background: "linear-gradient(90deg, #7e22ce 0%, #db2777 100%)",
                border: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "linear-gradient(90deg, #db2777 0%, #7e22ce 100%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "linear-gradient(90deg, #7e22ce 0%, #db2777 100%)";
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Typography.Text className="block text-center mt-8 text-xs select-none !text-[#999999]">
          © {new Date().getFullYear()} KPI. Bản quyền thuộc về công ty
          <br /> TOYOTA BÌNH DƯƠNG.
        </Typography.Text>
      </Card>
    </div>
  );
}

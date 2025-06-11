/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { LockOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import { useEffect, useRef, useState } from "react";
import ModalLoading from "./modalLoading";
import { usePathname } from "next/navigation";
import ModalChangePass, {
  interfaceChangePassword,
} from "./modalChangePassEmployee";
import Clock from "./timeNow";
import { MenuProps } from "antd/lib";
import Draggable from "react-draggable";

export interface DataUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const Logout = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [modalChangePass, setModalchangePass] = useState<boolean>(false);
  const [dataUser, setDataUser] = useState<DataUser>();
  const pathname = usePathname(); // ✅ an toàn với SSR
  const nodeRef = useRef<HTMLDivElement>(null); // ✅ THÊM KIỂU DIV
  async function logout() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        window.location.href = "/login";
      } else {
        const data = await res.json();
        console.error("Logout failed:", data.error || data.message);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  async function changePassword(change: interfaceChangePassword) {
    try {
      const res = await fetch("/api/users/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: change.currentPassword,
          newPassword: change.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Đổi mật khẩu thất bại");
      }
      setModalchangePass(false);
      return data;
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      throw error;
    }
  }

  async function getUser() {
    if (pathname === "/login") return;

    try {
      const req = await fetch("/api/users/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await req.json();

      if (!req.ok) {
        throw new Error(data.error || "lỗi khi lấy user");
      }
      setDataUser(data);
      return data;
    } catch (error) {
      console.error("lỗi khi lấy user:", error);
      throw error;
    }
  }

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "Đổi mật khẩu",
      icon: <LockOutlined />,
      onClick: () => setModalchangePass(true),
    },
    {
      key: "2",
      label: "Đăng Xuất",
      icon: <LogoutOutlined />,
      onClick: logout,
    },
  ];

  useEffect(() => {
    getUser();
  }, [pathname]);

  // 🔒 Không hiển thị nút khi đang ở trang login
  if (pathname === "/login") return null;

  return (
    <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>}>
      <div
        ref={nodeRef}
        className=" absolute bottom-2 right-2 z-10 cursor-pointer shadow-2xl w-10 h-10 bg-[#999999] rounded-[50%]"
      >
        <Dropdown menu={{ items }}>
          <div
            className="flex items-center gap-3 justify-center w-full h-full"
            onClick={(e) => e.preventDefault()}
          >
            <UserOutlined className="text-[#4a4a6a] font-bold text-3xl" />
          </div>
        </Dropdown>
        <ModalLoading isOpen={loading} />
        <ModalChangePass
          handleChangPass={changePassword}
          onClose={() => {
            setModalchangePass(false);
          }}
          open={modalChangePass}
        />
      </div>
    </Draggable>
  );
};

export default Logout;

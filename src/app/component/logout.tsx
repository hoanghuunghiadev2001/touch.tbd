/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { LockOutlined, LogoutOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useState } from "react";
import ModalLoading from "./modalLoading";
import { usePathname } from "next/navigation";
import ModalChangePass, {
  interfaceChangePassword,
} from "./modalChangePassEmployee";
import Clock from "./timeNow";

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
    console.log(11111111111111);

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

  useEffect(() => {
    getUser();
  }, [pathname]);

  // 🔒 Không hiển thị nút khi đang ở trang login
  if (pathname === "/login") return null;

  return (
    <div className="flex justify-between pt-4 z-50 px-5 gap-3 items-center">
      <div>
        <ModalLoading isOpen={loading} />
        <ModalChangePass
          handleChangPass={changePassword}
          onClose={() => {
            setModalchangePass(false);
          }}
          open={modalChangePass}
        />
        <Clock />
      </div>
      <div className="flex items-center gap-4">
        <p className="italic font-medium text-[#6e6e6e]">
          Hi, {dataUser?.name}
        </p>
        <Button
          type="dashed"
          icon={<LockOutlined className="!font-medium" />}
          className=""
          loading={loading}
          onClick={() => setModalchangePass(true)}
        >
          Đổi mật khẩu
        </Button>
        <Button
          type="primary"
          icon={<LogoutOutlined className="!font-medium" />}
          className="!bg-red-600 !font-medium"
          loading={loading}
          onClick={logout}
        >
          Đăng xuất
        </Button>
      </div>
    </div>
  );
};

export default Logout;

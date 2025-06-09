"use client";
import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function getFormattedTime() {
      const now = new Date();

      // Lấy thứ
      const weekday = now.toLocaleDateString("vi-VN", { weekday: "long" });

      // Lấy ngày, tháng, năm
      const day = now.getDate().toString().padStart(2, "0");
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const year = now.getFullYear();

      // Lấy giờ, phút
      const hour = now.getHours().toString().padStart(2, "0");
      const minute = now.getMinutes().toString().padStart(2, "0");

      return `${capitalizeFirstLetter(
        weekday
      )}, ngày ${day} tháng ${month} năm ${year}, ${hour} giờ ${minute} phút`;
    }

    function capitalizeFirstLetter(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    setTime(getFormattedTime()); // cập nhật ngay khi mount
    const interval = setInterval(() => {
      setTime(getFormattedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div className="italic text-gray-500 font-bold">{time}</div>;
}

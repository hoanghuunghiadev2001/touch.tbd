/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Button, ConfigProvider } from "antd";
import vnVN from "antd/locale/vi_VN";
import "dayjs/locale/vi";
import dayjs from "dayjs";
import Logout from "./component/logout";

dayjs.locale("vi");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TOYOTA BÌNH DƯƠNG",
  description: "Phần mềm KPI bộ phận CVDV Toyota Bình Dương",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-[100vh]`}
      >
        <Logout />

        <ConfigProvider locale={vnVN}>{children}</ConfigProvider>
      </body>
    </html>
  );
}

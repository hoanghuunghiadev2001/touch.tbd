"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardReportTarget, {
  Daum,
  Root,
} from "@/app/component/dashboardReportTarget";

const DashboardPage = () => {
  const [data, setData] = useState<Daum[]>([]);

  useEffect(() => {
    axios.get<Root>("/api/targets?monthYear=2025-6").then((res) => {
      setData(res.data.data);
    });
  }, []);

  return (
    <div>
      <h2>Biểu đồ hiệu suất nhân viên</h2>
      <DashboardReportTarget data={data} />
    </div>
  );
};

export default DashboardPage;

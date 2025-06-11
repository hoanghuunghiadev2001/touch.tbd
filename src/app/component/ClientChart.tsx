/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dùng dynamic import để tránh SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Props {
  options: any;
  series: any;
  height?: number | string;
  type: "line" | "bar" | "area" | "donut" | "radialBar";
}

const ClientChart: React.FC<Props> = ({
  options,
  series,
  height = 300,
  type,
}) => {
  return (
    <Chart options={options} series={series} type={type} height={height} />
  );
};

export default ClientChart;

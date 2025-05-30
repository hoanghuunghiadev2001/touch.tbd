"use client"
import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function ExcelReader() {
  const [header, setHeader] = useState<string[]>([]);
  const [dataA9, setDataA9] = useState<string[]>([]);
  const [dataA17, setDataA17] = useState<string[]>([]);

  // Hàm lấy dữ liệu từ dòng, từ cột J trở đi, dừng khi gặp ô trống đầu tiên
  const getDataFromRow = (worksheet: XLSX.WorkSheet, rowNum: number): string[] => {
    const result: string[] = [];
    let colIndex = 9; // Cột J = 9 (A=1, B=2,... J=10 nhưng ở đây dùng base 0 +1, ta sẽ map lại)
    // Lấy max range để tránh chạy vô hạn
    const range = XLSX.utils.decode_range(worksheet['!ref']!);

    while (colIndex <= range.e.c) {
      const cellAddress = { c: colIndex, r: rowNum - 1 }; // 0-based index
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      const cell = worksheet[cellRef];
      const cellValue = cell ? cell.v : undefined;

      if (cellValue === undefined || cellValue === null || cellValue.toString().trim() === "") {
        break; // dừng khi gặp ô trống đầu tiên
      }

      result.push(cellValue.toString());
      colIndex++;
    }

    return result;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      const data = new Uint8Array(e.target.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      const headerNames = getDataFromRow(worksheet, 4); // lấy tên nhân viên từ cột J, dòng 4
      const dataRow9 = getDataFromRow(worksheet, 9);    // dữ liệu dòng 9
      const dataRow17 = getDataFromRow(worksheet, 17);  // dữ liệu dòng 17

      setHeader(headerNames);
      setDataA9(dataRow9);
      setDataA17(dataRow17);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <h2>Đọc Excel và lấy dữ liệu từ cột J trở đi, dừng khi ô trống</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFile} />

      <div style={{ marginTop: "20px" }}>
        <h3>Header (Tên nhân viên, dòng 4):</h3>
        <ul>{header.map((item, idx) => <li key={idx}>{item}</li>)}</ul>

        <h3>Dữ liệu dòng 9:</h3>
        <ul>{dataA9.map((item, idx) => <li key={idx}>{item}</li>)}</ul>

        <h3>Dữ liệu dòng 17:</h3>
        <ul>{dataA17.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

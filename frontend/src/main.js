import React, { useState } from "react";
import { Button, TextField } from "@mui/material";
import * as XLSX from "xlsx";

const ExcelDataViewer = () => {
  const [data, setData] = useState([]);
  const [startXray, setStartXray] = useState("");
  const [endXray, setEndXray] = useState("");
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      
      const masterlistSheet = workbook.Sheets["MASTERLIST"];
      const logInSheet = workbook.Sheets["LOG IN"];
      
      if (!masterlistSheet || !logInSheet) return;
      
      const masterlistData = XLSX.utils.sheet_to_json(masterlistSheet, { header: 1 });
      const headers = masterlistData[3]; // Header is at row index 3
      const rows = masterlistData.slice(4);
      
      const structuredData = rows.map((row) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });
        return obj;              
      });
      
      // Extract D7 and D9 values
      const d7Value = logInSheet["D7"] ? logInSheet["D7"].v : "";
      const d9Value = logInSheet["D9"] ? logInSheet["D9"].v : "";
      
      // Append additional columns
      const finalData = structuredData.map((item) => ({
        ...item,
        "D7 Data": d7Value,
        "D9 Data": d9Value,
      }));
      
      setData(finalData);
    };
    
    reader.readAsBinaryString(file);
  };

  const handlePrint = () => {
    const start = parseInt(startXray);
    const end = parseInt(endXray);
    if (isNaN(start) || isNaN(end) || start > end) {
      alert("Invalid X-Ray No. range");
      return;
    }

    const filteredData = data.filter((row) => {
      const xrayNo = parseInt(row["X-Ray No."]);
      return xrayNo >= start && xrayNo <= end;
    });
    
    if (filteredData.length === 0) {
      alert("No records found in the given range");
      return;
    }
    
    let printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .box { width: 80%; max-width: 800px; border: 1px solid #000; padding: 20px; margin: 20px auto; font-size: 18px; }
          .box h2 { margin: 0; font-size: 22px; }
          .box p { margin: 5px 0; }
        </style>
      </head>
      <body>
    `);
    
    filteredData.forEach((row) => {
      printWindow.document.write(`
        <div class="box">
          <h2>X-Ray No.: ${row["X-Ray No."]}</h2>
          <p><strong>Patient:</strong> ${row["Patient"]}</p>
          <p><strong>Age:</strong> ${row["Age"]}</p>
          <p><strong>Gender:</strong> ${row["Gender"]}</p>
         
          <p><strong>DATE:</strong> ${row["D7 Data"]}</p>
          <p><strong>COMPANY:</strong> ${row["D9 Data"]}</p>
        </div>
      `);
    });
    
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  return (
      <div style={{ padding: 20 }}>
        <h2>Excel Data Viewer & Printer</h2>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        <br /><br />
        <TextField label="Start X-Ray No." value={startXray} onChange={(e) => setStartXray(e.target.value)} />
        <TextField label="End X-Ray No." value={endXray} onChange={(e) => setEndXray(e.target.value)} />
        <br /><br />
        <Button variant="contained" color="primary" onClick={handlePrint}>Print Data</Button>
      </div>
  );
};

export default ExcelDataViewer;

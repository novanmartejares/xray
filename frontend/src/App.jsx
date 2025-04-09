import React, { useState } from "react";
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import * as XLSX from "xlsx";

const ExcelDataViewer = () => {
  const [data, setData] = useState([]);
  const [startXray, setStartXray] = useState("");
  const [endXray, setEndXray] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showPrintView, setShowPrintView] = useState(false);

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

      const d7Value = logInSheet["D7"] ? logInSheet["D7"].v : "";
      const d9Value = logInSheet["D9"] ? logInSheet["D9"].v : "";

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

    const filteredData = filteredRows.filter((row) => {
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

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exported");
    XLSX.writeFile(workbook, "filtered_data.xlsx");
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredRows = data
    .filter((row) => {
      const term = searchTerm.toLowerCase();
      return (
        row["Patient"]?.toLowerCase().includes(term) ||
        row["D9 Data"]?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRowStyle = (row) => {
    const style = {};
    const age = parseInt(row["Age"]);
    if (!isNaN(age) && age > 50) {
      style.backgroundColor = "#ffe6e6";
    }
    return style;
  };

  const getGenderChip = (gender) => {
    if (!gender) return "";
    const lower = gender.toLowerCase();
    return (
      <Chip
        label={gender}
        color={lower === "female" ? "secondary" : "primary"}
        size="small"
      />
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Excel Data Viewer & Printer</h2>

      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <br /><br />

      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Search (Patient or Company)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "30%" }}
        />
        <TextField
          label="Start X-Ray No."
          value={startXray}
          onChange={(e) => setStartXray(e.target.value)}
        />
        <TextField
          label="End X-Ray No."
          value={endXray}
          onChange={(e) => setEndXray(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handlePrint}>
          Print Data
        </Button>
        <Button variant="outlined" onClick={handleExportExcel}>
          Export to Excel
        </Button>
        <FormControlLabel
          control={
            <Switch
              checked={showPrintView}
              onChange={() => setShowPrintView(!showPrintView)}
            />
          }
          label="Toggle Print View"
        />
      </Stack>

      {filteredRows.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>{showPrintView ? "Print Preview" : "Data Table"}</h3>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {Object.keys(filteredRows[0]).map((header) => (
                    <TableCell
                      key={header}
                      onClick={() => handleSort(header)}
                      style={{ fontWeight: "bold", cursor: "pointer" }}
                    >
                      {header}
                      {sortConfig.key === header ? (sortConfig.direction === "asc" ? " 🔼" : " 🔽") : ""}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(showPrintView ? filteredRows : paginatedRows).map((row, idx) => (
                  <TableRow key={idx} style={getRowStyle(row)}>
                    {Object.entries(row).map(([key, val], i) => (
                      <TableCell key={i}>
                        {key === "Gender" ? getGenderChip(val) : val}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!showPrintView && (
            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelDataViewer;

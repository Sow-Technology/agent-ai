"use client";

import html2canvas from "html2canvas";
import * as ExcelJS from "exceljs";

/**
 * Capture element as base64 PNG
 */
async function captureElementAsBase64(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#0a0a0f", // Dark background matching theme
    scale: 2, // Higher quality
    logging: false,
    useCORS: true,
  });
  
  // Return base64 without the data URL prefix
  return canvas.toDataURL("image/png").split(",")[1];
}

/**
 * Export data as XLSX file with embedded chart screenshot
 */
export async function exportChartWithData(
  chartElement: HTMLElement | null,
  data: Record<string, any>[],
  baseFilename: string
): Promise<{ success: boolean; error?: string }> {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return { success: false, error: "No data to export" };
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${baseFilename}_${timestamp}`;

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Dashboard Export";
    workbook.created = new Date();

    // Create Data Sheet
    const dataSheet = workbook.addWorksheet("Data");
    
    // Add headers with styling
    const headers = Object.keys(data[0]);
    const headerRow = dataSheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" }, // Primary color
      };
      cell.alignment = { horizontal: "center" };
    });

    // Add data rows
    data.forEach((row) => {
      const values = headers.map((h) => row[h] ?? "");
      dataSheet.addRow(values);
    });

    // Auto-fit columns
    dataSheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? String(cell.value).length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Add chart screenshot if element provided
    if (chartElement) {
      try {
        const chartSheet = workbook.addWorksheet("Chart");
        
        // Add some padding rows
        chartSheet.addRow(["Chart Screenshot"]).font = { bold: true, size: 14 };
        chartSheet.addRow([]);
        
        const base64Image = await captureElementAsBase64(chartElement);
        
        const imageId = workbook.addImage({
          base64: base64Image,
          extension: "png",
        });

        // Add image using string-based cell range (more compatible)
        chartSheet.addImage(imageId, "A3:K23" as any);

        // Set column widths for proper display
        for (let i = 1; i <= 10; i++) {
          chartSheet.getColumn(i).width = 15;
        }

        // Add export timestamp at the bottom
        chartSheet.getCell("A24").value = `Exported on ${new Date().toLocaleString()}`;
        chartSheet.getCell("A24").font = { italic: true, color: { argb: "FF666666" } };
      } catch (imgError) {
        console.warn("Could not add chart image:", imgError);
        // Continue without image
      }
    }

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Export failed:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Export data as CSV file (legacy fallback)
 */
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export entire dashboard with all charts as screenshots into a single XLSX file
 */
export async function exportDashboardWithAllCharts(
  chartRefs: { name: string; element: HTMLElement | null; data?: Record<string, any>[] }[],
  summaryData: { label: string; value: string | number }[],
  baseFilename: string = "dashboard_export"
): Promise<{ success: boolean; error?: string }> {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${baseFilename}_${timestamp}`;

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Dashboard Export";
    workbook.created = new Date();

    // 1. Create Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.addRow(["Dashboard Report"]).font = { bold: true, size: 16 };
    summarySheet.addRow([`Generated: ${new Date().toLocaleString()}`]).font = { italic: true, color: { argb: "FF666666" } };
    summarySheet.addRow([]);
    
    // Add summary KPIs
    const summaryHeaderRow = summarySheet.addRow(["Metric", "Value"]);
    summaryHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    });
    
    summaryData.forEach(({ label, value }) => {
      summarySheet.addRow([label, value]);
    });
    
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 20;

    // 2. Create Charts Sheet with all chart screenshots
    const chartsSheet = workbook.addWorksheet("Charts");
    chartsSheet.addRow(["Dashboard Charts"]).font = { bold: true, size: 16 };
    chartsSheet.addRow([]);
    
    let currentRow = 3;
    
    for (const chartRef of chartRefs) {
      if (chartRef.element) {
        try {
          // Add chart title
          chartsSheet.getCell(`A${currentRow}`).value = chartRef.name;
          chartsSheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
          currentRow += 1;
          
          const base64Image = await captureElementAsBase64(chartRef.element);
          const imageId = workbook.addImage({
            base64: base64Image,
            extension: "png",
          });
          
          // Add image - each chart takes ~15 rows
          chartsSheet.addImage(imageId, `A${currentRow}:J${currentRow + 12}` as any);
          currentRow += 15;
        } catch (imgError) {
          console.warn(`Could not capture ${chartRef.name}:`, imgError);
        }
      }
    }
    
    // Set column widths
    for (let i = 1; i <= 10; i++) {
      chartsSheet.getColumn(i).width = 12;
    }

    // 3. Create individual data sheets for charts that have data
    for (const chartRef of chartRefs) {
      if (chartRef.data && chartRef.data.length > 0) {
        // Clean sheet name (Excel limits to 31 chars, no special chars)
        const sheetName = chartRef.name.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 28);
        const dataSheet = workbook.addWorksheet(sheetName);
        
        const headers = Object.keys(chartRef.data[0]);
        const headerRow = dataSheet.addRow(headers);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
        });
        
        chartRef.data.forEach((row) => {
          dataSheet.addRow(headers.map((h) => row[h] ?? ""));
        });
        
        dataSheet.columns.forEach((column) => {
          let maxLength = 10;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const cellLength = cell.value ? String(cell.value).length : 0;
            if (cellLength > maxLength) maxLength = cellLength;
          });
          column.width = Math.min(maxLength + 2, 40);
        });
      }
    }

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Dashboard export failed:", error);
    return { success: false, error: String(error) };
  }
}

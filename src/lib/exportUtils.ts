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
 * Audit data interface for export
 */
export interface AuditExportData {
  employeeId: string;
  campaign: string;
  callCategory: string;
  agentName: string;
  auditId: string;
  callDuration: string;
  auditDate: string;
  auditedBy: string;
  passFail: string;
  auditDuration: string;
  startTime: string;
  endTime: string;
  overallScore: number;
  fatalStatus: string;
  fatalCount: number;
  parameterScores: Record<string, number | string>;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * Summary metrics for the export
 */
export interface ExportSummaryMetrics {
  reportPeriod: string;
  totalAudits: number;
  passRate: number;
  averageScore: number;
  fatalCount: number;
  ztpCount: number;
  aiAudits: number;
  manualAudits: number;
}

/**
 * Export audit data as a professional XLSX file with Summary, Data, and Charts sheets
 */
export async function exportAuditDataAsXLSX(
  audits: AuditExportData[],
  summaryMetrics: ExportSummaryMetrics,
  chartRefs: { name: string; element: HTMLElement | null }[] = [],
  options: {
    includeTokens?: boolean;
    filename?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  if (!audits || audits.length === 0) {
    return { success: false, error: "No data to export" };
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = options.filename || `QA_Audit_Report_${timestamp}`;

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "QAI Dashboard";
    workbook.created = new Date();

    // ===== SHEET 1: SUMMARY =====
    const summarySheet = workbook.addWorksheet("Summary");
    
    // Title
    summarySheet.mergeCells("A1:D1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = "QA Audit Report - Summary";
    titleCell.font = { bold: true, size: 18, color: { argb: "FF1E3A5F" } };
    titleCell.alignment = { horizontal: "center" };
    
    // Generated timestamp
    summarySheet.mergeCells("A2:D2");
    const timestampCell = summarySheet.getCell("A2");
    timestampCell.value = `Generated: ${new Date().toLocaleString()}`;
    timestampCell.font = { italic: true, size: 10, color: { argb: "FF666666" } };
    timestampCell.alignment = { horizontal: "center" };
    
    summarySheet.addRow([]);
    
    // Summary KPIs header
    const kpiHeaderRow = summarySheet.addRow(["Metric", "Value"]);
    kpiHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    
    // Summary data
    const summaryRows = [
      ["Report Period", summaryMetrics.reportPeriod],
      ["Total Audits", summaryMetrics.totalAudits],
      ["Pass Rate", `${summaryMetrics.passRate.toFixed(1)}%`],
      ["Average Score", `${summaryMetrics.averageScore.toFixed(2)}%`],
      ["Fatal Count", summaryMetrics.fatalCount],
      ["ZTP Triggered", summaryMetrics.ztpCount],
      ["AI Audits", summaryMetrics.aiAudits],
      ["Manual Audits", summaryMetrics.manualAudits],
    ];
    
    summaryRows.forEach(([metric, value], index) => {
      const row = summarySheet.addRow([metric, value]);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if (index % 2 === 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
        }
      });
    });
    
    summarySheet.getColumn(1).width = 20;
    summarySheet.getColumn(2).width = 25;

    // ===== SHEET 2: AUDIT DATA =====
    const dataSheet = workbook.addWorksheet("Audit Data");
    
    // Collect all unique parameter names
    const allParameterNames = new Set<string>();
    audits.forEach((audit) => {
      Object.keys(audit.parameterScores || {}).forEach((param) => {
        allParameterNames.add(param);
      });
    });
    const parameterNamesList = Array.from(allParameterNames);
    
    // Build headers
    const headers = [
      "Employee ID",
      "Process/Campaign",
      "Call Category",
      "Associate Name",
      "Audit ID",
      "Call Duration",
      "Audit Date",
      "QA/Audited By",
      "Pass/Fail",
      "Audit Duration",
      "Start Time",
      "End Time",
      "Overall Score",
      "Fatal Status",
      "Fatal Count",
      ...parameterNamesList,
    ];
    
    if (options.includeTokens) {
      headers.push("Input Tokens", "Output Tokens", "Total Tokens");
    }
    
    // Add header row with styling
    const headerRow = dataSheet.addRow(headers);
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
    });
    headerRow.height = 30;
    
    // Add data rows
    audits.forEach((audit, rowIndex) => {
      const parameterScores = parameterNamesList.map(
        (param) => audit.parameterScores[param] ?? ""
      );
      
      const rowData = [
        audit.employeeId,
        audit.campaign,
        audit.callCategory,
        audit.agentName,
        audit.auditId,
        audit.callDuration,
        audit.auditDate,
        audit.auditedBy,
        audit.passFail,
        audit.auditDuration,
        audit.startTime,
        audit.endTime,
        audit.overallScore,
        audit.fatalStatus,
        audit.fatalCount,
        ...parameterScores,
      ];
      
      if (options.includeTokens) {
        rowData.push(
          audit.tokenUsage?.inputTokens || 0,
          audit.tokenUsage?.outputTokens || 0,
          audit.tokenUsage?.totalTokens || 0
        );
      }
      
      const row = dataSheet.addRow(rowData);
      
      // Alternate row colors for readability
      if (rowIndex % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
        });
      }
      
      // Style cells
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
        cell.alignment = { vertical: "middle" };
        
        // Color-code Pass/Fail
        if (colNumber === 9) { // Pass/Fail column
          if (cell.value === "Pass") {
            cell.font = { color: { argb: "FF059669" }, bold: true };
          } else {
            cell.font = { color: { argb: "FFDC2626" }, bold: true };
          }
        }
        
        // Color-code Fatal Status
        if (colNumber === 14) { // Fatal Status column
          if (cell.value === "Fatal") {
            cell.font = { color: { argb: "FFDC2626" }, bold: true };
          } else if (cell.value === "ZTP") {
            cell.font = { color: { argb: "FFEA580C" }, bold: true };
          }
        }
      });
    });
    
    // Auto-fit columns
    dataSheet.columns.forEach((column, index) => {
      let maxLength = headers[index]?.length || 10;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value ? String(cell.value).length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 40);
    });
    
    // Freeze header row
    dataSheet.views = [{ state: "frozen", ySplit: 1 }];

    // ===== SHEET 3: CHARTS (if chart refs provided) =====
    if (chartRefs.length > 0) {
      const chartsSheet = workbook.addWorksheet("Charts");
      
      chartsSheet.mergeCells("A1:J1");
      const chartsTitleCell = chartsSheet.getCell("A1");
      chartsTitleCell.value = "Dashboard Charts";
      chartsTitleCell.font = { bold: true, size: 16 };
      
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
            chartsSheet.getCell(`A${currentRow}`).value = `[Could not capture ${chartRef.name}]`;
            currentRow += 2;
          }
        }
      }
      
      // Set column widths
      for (let i = 1; i <= 10; i++) {
        chartsSheet.getColumn(i).width = 12;
      }
    }

    // ===== GENERATE AND DOWNLOAD =====
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

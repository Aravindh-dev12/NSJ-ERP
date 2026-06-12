import * as XLSX from "xlsx";

function formatDateForFilename(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function exportToExcel(options: {
  formName: string; // used for sheet name and filename
  headers: string[]; // human-readable column headers
  dataRow: Array<string | number | null | undefined>;
  includeFooterTimestamp?: boolean;
  filename?: string; // optional custom filename
}) {
  const { formName, headers, dataRow, includeFooterTimestamp, filename } =
    options;
  const wb = XLSX.utils.book_new();

  const aoa: Array<Array<string | number | null>> = [];
  aoa.push(headers);
  aoa.push(dataRow.map((v) => (v === undefined ? null : v)));

  if (includeFooterTimestamp) {
    aoa.push([]);
    const now = new Date();
    aoa.push([`Exported on: ${now.toLocaleString()}`]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // optional: set sheet name to a short value (Excel limits 31 chars)
  const sheetName = formName.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const finalFilename =
    filename ||
    `${formName.replace(/\s+/g, "_")}_${formatDateForFilename(new Date())}.xlsx`;

  // writeFile will trigger download in the browser
  try {
    XLSX.writeFile(wb, finalFilename);
    return { ok: true, filename: finalFilename };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function exportRowsToExcel(options: {
  formName: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
  includeFooterTimestamp?: boolean;
}) {
  const { formName, headers, rows, includeFooterTimestamp } = options;
  const wb = XLSX.utils.book_new();

  const aoa: Array<Array<string | number | null>> = [];
  aoa.push(headers);
  for (const r of rows) {
    aoa.push(r.map((v) => (v === undefined ? null : v)));
  }

  if (includeFooterTimestamp) {
    aoa.push([]);
    const now = new Date();
    aoa.push([`Exported on: ${now.toLocaleString()}`]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-fit column widths using max string length per column (approx)
  const cols: { wch: number }[] = [];
  for (let c = 0; c < headers.length; c++) {
    let max = headers[c] ? String(headers[c]).length : 10;
    for (let r = 0; r < rows.length; r++) {
      const cell = rows[r][c];
      if (cell !== undefined && cell !== null) {
        const len = String(cell).length;
        if (len > max) max = len;
      }
    }
    // add some padding
    cols.push({ wch: Math.min(Math.max(max + 2, 10), 50) });
  }
  ws["!cols"] = cols;

  const sheetName = formName.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `${formName.replace(/\s+/g, "_")}_List_${formatDateForFilename(new Date())}.xlsx`;
  try {
    XLSX.writeFile(wb, filename);
    return { ok: true, filename };
  } catch (err) {
    return { ok: false, error: err };
  }
}

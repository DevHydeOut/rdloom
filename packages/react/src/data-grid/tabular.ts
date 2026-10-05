// Turning grid cells into text and back: the clipboard format (tab-separated,
// what spreadsheets copy and paste), CSV, and a minimal .xlsx writer.

const FORMULA_START = /^[=+\-@\t\r]/;

/** One field, quoted the way spreadsheets expect when it holds a delimiter, quote or line break. */
const quote = (text: string, delimiter: string) =>
  text.includes(delimiter) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;

/** Tab-separated text, as copied from and pasted into Excel and Google Sheets. */
export function toTsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map((cell) => quote(cell, "\t")).join("\t")).join("\n");
}

/** Reads tab-separated text, honouring quoted fields that contain tabs or line breaks. */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"' && field === "") inQuotes = true;
    else if (ch === "\t") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  // A trailing newline ends the last row; it doesn't start another.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export type ExportValue = string | number | boolean | Date | null | undefined;

const asText = (value: ExportValue) => (value == null ? "" : value instanceof Date ? value.toISOString() : String(value));

/**
 * CSV with a header row. Text that a spreadsheet would run as a formula
 * (=, +, -, @) is prefixed with an apostrophe unless `sanitize` is false.
 * Numbers are written as they are, so a negative number stays a number.
 */
export function toCsv(headers: readonly string[], rows: readonly (readonly ExportValue[])[], sanitize = true): string {
  const cell = (value: ExportValue) => {
    let text = asText(value);
    if (sanitize && typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
    return quote(text, ",");
  };
  const head = headers.map((h) => quote(h, ",")).join(",");
  return [head, ...rows.map((row) => row.map(cell).join(","))].join("\r\n");
}

// --- .xlsx -----------------------------------------------------------------
// An .xlsx file is a zip of a few XML parts. Writing one needs no library: the
// zip can store its entries uncompressed, and every cell is a literal value.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** A zip with every entry stored, not compressed. */
export function zip(files: readonly { name: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array(30 + name.length + file.data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // names are UTF-8
    lv.setUint32(14, crc, true);
    lv.setUint32(18, file.data.length, true);
    lv.setUint32(22, file.data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(file.data, 30 + name.length);
    locals.push(local);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, file.data.length, true);
    cv.setUint32(24, file.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const xml = (text: string) =>
  text
    // Control characters other than tab and line breaks are not allowed in XML at all.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** A1-style name for a zero-based column index: 0 → A, 26 → AA. */
const columnName = (index: number) => {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
};

const sheetName = (name: string) => name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Sheet1";

/** A workbook with one sheet: a header row, then the rows. Text stays text and numbers stay numbers. */
export function toXlsx(name: string, headers: readonly string[], rows: readonly (readonly ExportValue[])[]): Uint8Array {
  const encoder = new TextEncoder();
  const cell = (value: ExportValue, r: number, c: number) => {
    const ref = `${columnName(c)}${r + 1}`;
    if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
    if (typeof value === "boolean") return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
    const text = asText(value);
    if (text === "") return "";
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(text)}</t></is></c>`;
  };
  const all = [headers as readonly ExportValue[], ...rows];
  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>` +
    all.map((row, r) => `<row r="${r + 1}">${row.map((v, c) => cell(v, r, c)).join("")}</row>`).join("") +
    `</sheetData></worksheet>`;
  const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;
  const files = [
    {
      name: "[Content_Types].xml",
      text:
        `${header}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      text:
        `${header}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      text:
        `${header}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${xml(sheetName(name))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      text:
        `${header}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    },
    { name: "xl/worksheets/sheet1.xml", text: sheet },
  ];
  return zip(files.map((f) => ({ name: f.name, data: encoder.encode(f.text) })));
}

/** Hands a file to the browser's download. A no-op outside a browser. */
export function download(content: string | Uint8Array, fileName: string, mime: string) {
  if (typeof document === "undefined") return;
  // A byte-order mark makes Excel read UTF-8 CSV correctly.
  const parts = typeof content === "string" ? ["﻿", content] : [content as BlobPart];
  const url = URL.createObjectURL(new Blob(parts, { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 32 * 1024 * 1024;
const MAX_ROWS = 10000;
const MAX_COLUMNS = 128;
const INVALID_FILE = "Não foi possível ler este arquivo XLSX. Verifique se ele está íntegro e sem senha.";

// Inspect only the ZIP size metadata before passing the file to SheetJS.
function checkArchive(bytes) {
  const zip = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid = () => new Error(INVALID_FILE);
  if (zip.byteLength < 22 || zip.getUint32(0, true) !== 0x04034b50) throw invalid();

  let end = zip.byteLength - 4;
  const searchStart = Math.max(0, zip.byteLength - 22 - 65535);
  while (end >= searchStart && zip.getUint32(end, true) !== 0x06054b50) end--;
  if (end < searchStart || end + 22 > zip.byteLength
      || end + 22 + zip.getUint16(end + 20, true) !== zip.byteLength) {
    throw invalid();
  }

  const entryCount = zip.getUint16(end + 10, true);
  const directoryStart = zip.getUint32(end + 16, true);
  const directorySize = zip.getUint32(end + 12, true);
  if (entryCount === 0 || entryCount === 65535 || directoryStart + directorySize !== end
      || zip.getUint32(end + 4, true) !== 0 || zip.getUint16(end + 8, true) !== entryCount) {
    throw invalid();
  }

  let entry = directoryStart;
  let expandedSize = 0;
  for (let index = 0; index < entryCount; index++) {
    if (entry + 46 > end || zip.getUint32(entry, true) !== 0x02014b50) throw invalid();
    const localHeader = zip.getUint32(entry + 42, true);
    if (localHeader + 30 > directoryStart || zip.getUint32(localHeader, true) !== 0x04034b50) {
      throw invalid();
    }
    // SheetJS uses the local header for its decompression buffer allocation.
    expandedSize += Math.max(zip.getUint32(entry + 24, true), zip.getUint32(localHeader + 22, true));
    if (expandedSize > MAX_EXPANDED_BYTES) {
      throw new Error("O conteúdo descompactado da planilha excede o limite de 32 MiB.");
    }
    entry += 46 + zip.getUint16(entry + 28, true)
      + zip.getUint16(entry + 30, true) + zip.getUint16(entry + 32, true);
  }
  if (entry !== end) throw invalid();
}

export function readWorkbook(buffer) {
  const xlsx = globalThis.XLSX;
  if (!xlsx?.read) throw new Error("O leitor de arquivos XLSX não foi carregado.");
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  if (!(bytes instanceof Uint8Array)) throw new Error(INVALID_FILE);
  if (bytes.byteLength > MAX_FILE_BYTES) throw new Error("O arquivo XLSX excede o limite de 5 MiB.");
  checkArchive(bytes);

  let parsed;
  try {
    parsed = xlsx.read(bytes, {
      type: "array",
      dense: true,
      sheetRows: MAX_ROWS + 1,
      cellDates: false,
      cellFormula: false,
      cellHTML: false,
      cellText: false,
    });
  } catch {
    throw new Error(INVALID_FILE);
  }
  if (parsed.bookType !== "xlsx") throw new Error(INVALID_FILE);

  const sheetNames = parsed.SheetNames.filter((name, index) => {
    const sheet = parsed.Sheets[name];
    return sheet && !sheet["!type"] && !parsed.Workbook?.Sheets?.[index]?.Hidden;
  });
  if (!sheetNames.length) throw new Error("O arquivo não contém abas de dados visíveis.");

  return {
    sheetNames,
    date1904: Boolean(parsed.Workbook?.WBProps?.date1904),
    sheets: parsed.Sheets,
  };
}

export function readSheet(workbook, sheetName) {
  if (!workbook.sheetNames.includes(sheetName)) throw new Error("Selecione uma aba de dados visível.");
  const sheet = workbook.sheets[sheetName];
  const usedRange = sheet["!fullref"] ?? sheet["!ref"];
  if (!usedRange) return [];

  const { e: end } = globalThis.XLSX.utils.decode_range(usedRange);
  const rowCount = end.r + 1;
  const columnCount = end.c + 1;
  if (rowCount > MAX_ROWS || columnCount > MAX_COLUMNS) {
    throw new Error("A aba excede o limite de 10.000 linhas ou 128 colunas.");
  }
  const data = sheet["!data"] ?? [];
  // Start at A1 so blank rows before the header and gaps between columns retain their positions.
  return Array.from({ length: rowCount }, (_, row) => {
    const cells = data[row] ?? [];
    return Array.from({ length: columnCount }, (_, column) => {
      const cell = cells[column];
      return cell?.t === "e" ? "#ERRO" : (cell?.v ?? null);
    });
  });
}

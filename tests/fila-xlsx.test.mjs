import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { readSheet, readWorkbook } from "../site/fila/xlsx.mjs";

const require = createRequire(import.meta.url);
const XLSX = require("../site/fila/vendor/xlsx.mini.min.js");
globalThis.XLSX = XLSX;

function asXlsx(book) {
  return XLSX.write(book, { bookType: "xlsx", type: "array", compression: true });
}

function workbookWith(sheet) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Operação");
  return book;
}

test("carrega XLSX com abas visíveis, posições originais e datas do sistema 1904", () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Data", "Entradas", null, "Conclusões"],
    [null],
    [44871, 9, null, 2],
  ], { origin: "B3" });
  sheet.B5.z = "dd/mm/yyyy";
  const book = workbookWith(sheet);
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Outros dados"]]), "Outra aba");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Oculta"]]), "Oculta");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Muito oculta"]]), "Muito oculta");
  XLSX.utils.book_set_sheet_visibility(book, "Oculta", XLSX.utils.consts.SHEET_HIDDEN);
  XLSX.utils.book_set_sheet_visibility(book, "Muito oculta", XLSX.utils.consts.SHEET_VERY_HIDDEN);
  book.Workbook.WBProps = { date1904: true };

  const imported = readWorkbook(asXlsx(book));
  assert.equal(imported.date1904, true);
  assert.deepEqual(imported.sheetNames, ["Operação", "Outra aba"]);
  assert.deepEqual(readSheet(imported, "Operação"), [
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, "Data", "Entradas", null, "Conclusões"],
    [null, null, null, null, null],
    [null, 44871, 9, null, 2],
  ]);
  assert.deepEqual(readSheet(imported, "Outra aba"), [["Outros dados"]]);
  assert.throws(() => readSheet(imported, "Oculta"), /aba de dados visível/);
});

test("preserva texto literal e usa somente valores já gravados em células com fórmulas", () => {
  const text = '<img src="https://example.invalid/pixel" onerror="alert(1)">';
  const formulaText = '=HYPERLINK("https://example.invalid/","texto")';
  const sheet = XLSX.utils.aoa_to_sheet([[text, formulaText, 46333, true, null, null, 0]]);
  sheet.A1.l = { Target: "https://example.invalid/" };
  sheet.C1.z = "dd/mm/yyyy";
  sheet.E1 = { t: "n", f: "[1]Planilha!A1", v: 7 };
  sheet.F1 = { t: "z", f: 'WEBSERVICE("https://example.invalid/")' };
  sheet.G1 = { t: "e", v: 42 };

  const imported = readWorkbook(new Uint8Array(asXlsx(workbookWith(sheet))));
  assert.equal(imported.date1904, false);
  assert.deepEqual(readSheet(imported, "Operação"), [[text, formulaText, 46333, true, 7, null, "#ERRO"]]);
});

test("sinaliza conteúdo inválido e arquivos compactados ou expandidos acima dos limites", () => {
  assert.throws(() => readWorkbook(new TextEncoder().encode("Data,Entradas,Conclusões")), /ler este arquivo XLSX/);
  assert.throws(() => readWorkbook(new ArrayBuffer(5 * 1024 * 1024 + 1)), /5 MiB/);
  const valid = asXlsx(workbookWith(XLSX.utils.aoa_to_sheet([["Dados"]])));
  assert.throws(() => readWorkbook(valid.slice(0, -10)), /ler este arquivo XLSX/);
  const oversized = valid.slice(0);
  // Set the declared expanded size in the first local header without inflating it.
  new DataView(oversized).setUint32(22, 32 * 1024 * 1024 + 1, true);
  assert.throws(() => readWorkbook(oversized), /conteúdo descompactado/);
});

test("recusa abas que extrapolam os limites antes de criar a grade", () => {
  const sheet = { A1: { t: "s", v: "Data" }, A10002: { t: "n", v: 1 }, "!ref": "A1:A10002" };
  const wide = XLSX.utils.aoa_to_sheet([Array(129).fill(1)]);
  const book = workbookWith(sheet);
  XLSX.utils.book_append_sheet(book, wide, "Colunas");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([]), "Vazia");

  const imported = readWorkbook(asXlsx(book));
  assert.throws(() => readSheet(imported, "Operação"), /10.000 linhas/);
  assert.throws(() => readSheet(imported, "Colunas"), /128 colunas/);
  assert.deepEqual(readSheet(imported, "Vazia"), []);
});

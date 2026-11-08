import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeHistory, forecastQueue, parseCount, parseCsv, parseDay } from '../site/fila/core.mjs';

const columns = { date: 0, arrivals: 1, completed: 2, initialBacklog: 10 };
const header = ['Data', 'Entradas', 'Conclusões'];

test('CSV detects semicolons after a preamble and handles quotes, BOM and line endings', () => {
  const csv = '\uFEFFRelatório, equipe A\r\nData;Entradas;Conclusões;Notas\r\n06/11/2026;8;5;"texto ""citado"";\r\noutra linha"\r\n';
  assert.deepEqual(parseCsv(csv), [
    ['Relatório, equipe A'],
    [...header, 'Notas'],
    ['06/11/2026', '8', '5', 'texto "citado";\r\noutra linha'],
  ]);
});

test('CSV recognizes comma and tab delimiters, blank rows and Excel separator directives', () => {
  assert.deepEqual(parseCsv('a,b,c\n\n1,2,'), [['a', 'b', 'c'], [''], ['1', '2', '']]);
  assert.deepEqual(parseCsv('a\tb\tc\n1\t2\t3'), [['a', 'b', 'c'], ['1', '2', '3']]);
  assert.deepEqual(parseCsv('sep=;\r\na;b;c\r\n1;2;3'), [['sep=;'], ['a', 'b', 'c'], ['1', '2', '3']]);
  assert.throws(() => parseCsv('a;b;c\n"1;2;3'), /aspas/);
});

test('dates normalize strict calendar strings and both Excel date systems', () => {
  assert.equal(parseDay(' 6/11/2026 '), '2026-11-06');
  assert.equal(parseDay('2024-02-29'), '2024-02-29');
  assert.equal(parseDay('2026-02-29'), null);
  assert.equal(parseDay('31/04/2026'), null);
  assert.equal(parseDay('2026-11-06T00:00:00Z'), null);
  assert.equal(parseDay(new Date('2026-11-06T03:00:00Z')), '2026-11-06');
  assert.equal(parseDay(59), '1900-02-28');
  assert.equal(parseDay(60), null);
  assert.equal(parseDay(61.75), '1900-03-01');
  assert.equal(parseDay(0, true), '1904-01-01');
  assert.equal(parseDay(1, true), '1904-01-02');
});

test('counts require nonnegative safe integers', () => {
  assert.equal(parseCount(' 002 '), 2);
  assert.equal(parseCount(0), 0);
  for (const value of ['', null, true, '1,2', '2e3', 2.1, -1, Infinity, '9007199254740993']) {
    assert.equal(parseCount(value), null);
  }
});

test('history maps columns, sorts chronologically and warns about gaps', () => {
  const rows = [
    ['Resumo de operações'], ['Concluídas', 'Dia', 'Recebidas'],
    [7, '09/11/2026', 2], [], [5, '2026-11-06', 8],
  ];
  const result = analyzeHistory(rows, { ...columns, headerRow: 1, date: 1, arrivals: 2, completed: 0 });
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0].message, /2 dias sem registro/);
  assert.equal(result.warnings[0].row, 3);
  assert.deepEqual(result.records, [
    { date: '2026-11-06', arrivals: 8, completed: 5, backlog: 13, row: 5 },
    { date: '2026-11-09', arrivals: 2, completed: 7, backlog: 8, row: 3 },
  ]);
  assert.equal(result.lastDate, '2026-11-09');
  assert.equal(result.backlog, 8);
  assert.equal(result.totalArrivals, 10);
  assert.equal(result.totalCompleted, 12);
});

test('history blocks duplicates, blank or invalid fields and impossible completions', () => {
  const result = analyzeHistory([
    header,
    ['06/11/2026', 4, 2],
    ['2026-11-06', 8, 6],
    ['', '', -1],
  ], columns);
  assert.deepEqual(result.records, []);
  assert.equal(result.backlog, null);
  assert.equal(result.errors.length, 4);
  assert.match(result.errors[0].message, /repetida/);
  assert.deepEqual(result.errors.map(error => error.row), [3, 4, 4, 4]);

  const impossible = analyzeHistory([header, ['06/11/2026', 1, 12]], columns);
  assert.match(impossible.errors[0].message, /superam a fila/);
  assert.equal(impossible.lastDate, null);
  assert.match(analyzeHistory([header], columns).errors[0].message, /ao menos um dia/);
});

test('forecast reproduces the worked example and stops service at available work', () => {
  const projection = forecastQueue({
    lastDate: '2026-11-04', backlog: 60, dailyArrivals: 120, dailyCapacity: 150, deadline: '2026-11-07',
  });
  assert.equal(projection.clearsOn, '2026-11-06');
  assert.equal(projection.backlogAtDeadline, 0);
  assert.equal(projection.requiredDailyCompletions, 140);
  assert.deepEqual(projection.records.map(({ completed, backlog }) => [completed, backlog]), [[150, 30], [150, 0], [120, 0]]);
});

test('forecast counts only selected days, rounds required capacity up, and reports unmet deadlines', () => {
  const values = { lastDate: '2026-11-06', backlog: 51, dailyArrivals: 5, dailyCapacity: 12, workdaysOnly: true };
  const projection = forecastQueue({ ...values, deadline: '2026-11-10' });
  assert.deepEqual(projection.records.map(record => record.date), ['2026-11-09', '2026-11-10']);
  assert.equal(projection.days, 2);
  assert.equal(projection.requiredDailyCompletions, 31);
  assert.equal(projection.backlogAtDeadline, 37);
  assert.equal(projection.clearsOn, null);
  assert.throws(() => forecastQueue({ ...values, deadline: '2026-11-08' }), /ao menos um dia útil/);
  assert.throws(() => forecastQueue({ ...values, deadline: values.lastDate }), /prazo posterior/);
  assert.throws(() => forecastQueue({ ...values, deadline: '2028-11-06' }), /até 366 dias/);
});

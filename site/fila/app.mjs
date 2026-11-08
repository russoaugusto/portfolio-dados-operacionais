import { analyzeHistory, forecastQueue, parseCsv } from './core.mjs';
import { readSheet, readWorkbook } from './xlsx.mjs';

const byId = id => document.getElementById(id);
const historyForm = byId('history-form');
const scenarioForm = byId('scenario-form');
const sheetSelect = byId('sheet');
const headerInput = byId('header-row');
const openingInput = byId('opening');
const fileInput = byId('file');
const columnFields = [
  ['date-col', ['data', 'dia', 'date']],
  ['arrivals-col', ['entradas', 'entrada', 'demanda', 'recebidas', 'solicitacoes recebidas', 'arrivals']],
  ['completed-col', ['conclusoes', 'concluidas', 'concluidos', 'atendidas', 'finalizadas', 'solicitacoes concluidas', 'completed']],
];
const number = new Intl.NumberFormat('pt-BR');
const signedNumber = new Intl.NumberFormat('pt-BR', { signDisplay: 'exceptZero' });
const maxFileSize = 5 * 1024 * 1024;
const svgNamespace = 'http://www.w3.org/2000/svg';

let workbook = null;
let rows = [];
let history = null;
let importVersion = 0;

function formatDay(day) {
  return day.split('-').reverse().join('/');
}

function addDays(day, amount) {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().split('T')[0];
}

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ');
}

function columnName(index) {
  let label = '';
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    label = String.fromCharCode(65 + (value - 1) % 26) + label;
  }
  return label;
}

function defaultHeader() {
  const recognized = rows.slice(0, 30).findIndex(row =>
    columnFields.every(([, names]) => row.some(value => names.includes(normalizeHeader(value)))));
  if (recognized >= 0) return recognized;
  const firstLabeledRow = rows.findIndex(row => row.filter(value => normalizeHeader(value)).length >= 3);
  return Math.max(0, firstLabeledRow);
}

function showSourceStatus(message, error = false) {
  const status = byId('source-status');
  status.textContent = message;
  status.classList.toggle('notice-error', error);
  status.hidden = !message;
}

function showIssues(id, issues, title) {
  const notice = byId(id);
  notice.replaceChildren();
  notice.hidden = !issues.length;
  if (!issues.length) return;

  const heading = document.createElement('strong');
  heading.textContent = title;
  const list = document.createElement('ul');
  for (const issue of issues.slice(0, 8)) {
    const entry = document.createElement('li');
    const message = issue.message.replace(/\b\d{4}-\d{2}-\d{2}\b/g, formatDay);
    entry.textContent = issue.row ? `Linha ${issue.row} · ${message}` : message;
    list.append(entry);
  }
  if (issues.length > 8) {
    const more = document.createElement('li');
    more.textContent = `Total de ocorrências encontradas · ${number.format(issues.length)}`;
    list.append(more);
  }
  notice.append(heading, list);
}

function clearProjection() {
  byId('projection').hidden = true;
  byId('scenario-error').hidden = true;
}

function clearHistory() {
  history = null;
  byId('history').hidden = true;
  byId('scenario').hidden = true;
  showIssues('history-errors', [], '');
  clearProjection();
}

function updateColumns() {
  clearHistory();
  const header = rows[headerInput.valueAsNumber - 1] ?? [];
  const headers = header.map(normalizeHeader);
  for (const [id, names] of columnFields) {
    const select = byId(id);
    select.replaceChildren(new Option('Selecione a coluna', ''));
    header.forEach((value, index) => {
      const text = String(value ?? '').trim().slice(0, 120);
      const label = columnName(index);
      select.add(new Option(text ? `${label} · ${text}` : `Coluna ${label}`, String(index)));
    });
    const match = headers.findIndex(value => names.includes(value));
    select.value = match >= 0 ? String(match) : '';
  }
}

function setRows(data, opening = '') {
  rows = data;
  headerInput.max = String(Math.max(1, rows.length - 1));
  headerInput.value = String(Math.min(defaultHeader() + 1, Number(headerInput.max)));
  openingInput.value = opening;
  updateColumns();
}

function showMapping(source, moveFocus = true) {
  byId('intro').hidden = true;
  byId('mapping').hidden = false;
  byId('source-name').textContent = source;
  if (moveFocus) byId('mapping-title').focus();
}

function decodeCsv(buffer) {
  const prefix = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
  if (prefix[0] === 0xff && prefix[1] === 0xfe) return new TextDecoder('utf-16le').decode(buffer);
  if (prefix[0] === 0xfe && prefix[1] === 0xff) return new TextDecoder('utf-16be').decode(buffer);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

function readSelectedSheet() {
  try {
    setRows(readSheet(workbook, sheetSelect.value));
    showSourceStatus('');
  } catch (error) {
    setRows([]);
    showSourceStatus(error.message, true);
  }
}

async function openFile(file) {
  const version = ++importVersion;
  clearHistory();
  workbook = null;
  byId('mapping').hidden = true;
  byId('intro').hidden = false;
  byId('sheet-field').hidden = true;
  showSourceStatus('Lendo a planilha…');
  try {
    if (!file.size || file.size > maxFileSize) throw new Error('Escolha um arquivo com conteúdo de até 5 MB.');
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'csv') throw new Error('Escolha um arquivo Excel (.xlsx) ou CSV (.csv).');
    const buffer = await file.arrayBuffer();
    if (version !== importVersion) return;

    if (extension === 'xlsx') {
      workbook = readWorkbook(buffer);
      sheetSelect.replaceChildren(...workbook.sheetNames.map(name => new Option(name, name)));
      byId('sheet-field').hidden = workbook.sheetNames.length === 1;
      readSelectedSheet();
    } else {
      const data = parseCsv(decodeCsv(buffer));
      if (data.length > 10_000 || data.some(row => row.length > 128)) {
        throw new Error('Use uma planilha com até 10 mil linhas e 128 colunas.');
      }
      if (!data.some(row => row.length >= 3)) throw new Error('O CSV precisa ter colunas de data, entradas e conclusões.');
      setRows(data);
      showSourceStatus('');
    }
    showMapping(file.name);
  } catch (error) {
    if (version === importVersion) showSourceStatus(error.message, true);
  }
}

function renderStats(id, items) {
  const cards = items.map(([label, value], index) => {
    const card = document.createElement('div');
    card.className = index === 0 ? 'stat is-key' : 'stat';
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = typeof value === 'number' ? number.format(value) : value;
    card.append(term, detail);
    return card;
  });
  byId(id).replaceChildren(...cards);
}

function renderTable(id, values) {
  const fragment = document.createDocumentFragment();
  for (const row of values) {
    const tr = document.createElement('tr');
    row.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) cell.scope = 'row';
      cell.textContent = typeof value === 'number' ? number.format(value) : value;
      tr.append(cell);
    });
    fragment.append(tr);
  }
  byId(id).replaceChildren(fragment);
}

function svgElement(tag, attributes, label) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (label !== undefined) element.textContent = label;
  return element;
}

function renderChart(id, records) {
  const width = 760;
  const height = 190;
  const max = Math.max(1, ...records.map(record => record.backlog));
  const left = Math.max(62, number.format(max).length * 8 + 16);
  const right = 712;
  const top = 16;
  const bottom = 148;
  const x = index => records.length === 1 ? (left + right) / 2 : left + index * (right - left) / (records.length - 1);
  const y = value => bottom - (bottom - top) * value / max;
  const svg = svgElement('svg', { viewBox: `0 0 ${width} ${height}` });

  for (const tick of new Set([0, Math.round(max / 2), max])) {
    svg.append(
      svgElement('line', { x1: left, x2: right, y1: y(tick), y2: y(tick), class: 'guide' }),
      svgElement('text', { x: left - 8, y: y(tick) + 5, 'text-anchor': 'end' }, number.format(tick)),
    );
  }
  const points = records.map((record, index) => `${x(index)},${y(record.backlog)}`);
  svg.append(svgElement('polyline', { points: points.join(' '), class: 'trend' }));
  const last = records.length - 1;
  for (const index of new Set([0, last])) {
    const record = records[index];
    svg.append(
      svgElement('circle', { cx: x(index), cy: y(record.backlog), r: 4, class: 'trend-dot' }),
      svgElement('text', { x: x(index), y: bottom + 28, 'text-anchor': 'middle' }, formatDay(record.date).slice(0, 5)),
    );
  }
  byId(id).replaceChildren(svg);
}

function renderHistory(result, opening, isExample) {
  const { records, lastDate, backlog, warnings, totalArrivals } = result;
  const withOpenings = records.map((record, index) => ({
    ...record,
    opening: index ? records[index - 1].backlog : Number(opening),
  }));
  const peak = records.reduce((high, row) => row.backlog > high.backlog ? row : high);
  const growing = withOpenings.filter(row => row.backlog > row.opening);
  const first = records[0].date;
  const period = first === lastDate
    ? `Movimento de ${formatDay(first)}`
    : `${formatDay(first)} a ${formatDay(lastDate)} · ${number.format(records.length)} dias informados`;
  byId('history-period').textContent = isExample ? `Exemplo fictício · ${period}` : period;

  showIssues('history-warnings', warnings, 'O cálculo usa só as datas registradas. Confira se os dias ausentes tiveram movimento.');
  renderStats('history-stats', [['Fila no último dia', backlog], ['Maior fila no fechamento', peak.backlog], ['Dias em que a fila cresceu', growing.length]]);
  renderChart('history-chart', records);
  byId('history-insight').textContent = growing.length
    ? `O maior saldo de fechamento foi de ${number.format(peak.backlog)} em ${formatDay(peak.date)}.`
    : 'A fila ficou estável ou diminuiu em todos os dias informados.';
  byId('history-details').open = false;
  renderTable('history-rows', withOpenings.map(row => [
    formatDay(row.date), row.opening, row.arrivals, row.completed, row.backlog,
    signedNumber.format(row.backlog - row.opening),
  ]));

  scenarioForm.reset();
  byId('scenario-start').textContent = `A projeção parte do saldo de ${number.format(backlog)} em ${formatDay(lastDate)}.`;
  byId('arrivals-note').hidden = isExample;
  byId('daily-arrivals').value = isExample ? '120' : String(Math.round(totalArrivals / records.length));
  byId('daily-capacity').value = isExample ? '150' : '';
  byId('deadline').min = addDays(lastDate, 1);
  byId('deadline').max = addDays(lastDate, 366);
  byId('deadline').value = addDays(lastDate, isExample ? 2 : 7);
  byId('history').hidden = false;
  byId('scenario').hidden = false;
}

function analyze(isExample = false) {
  clearHistory();
  const [date, arrivals, completed] = columnFields.map(([id]) => {
    const value = byId(id).value;
    return value === '' ? -1 : Number(value);
  });
  const initialBacklog = openingInput.value;
  const result = analyzeHistory(rows, {
    date, arrivals, completed, initialBacklog, headerRow: headerInput.valueAsNumber - 1,
    date1904: workbook?.date1904 ?? false,
  });
  if (result.errors.length) {
    showIssues('history-errors', result.errors, 'Revise os dados e os campos indicados abaixo.');
    return;
  }
  history = result;
  renderHistory(result, initialBacklog, isExample);
  if (isExample) simulate();
  byId('history-title').focus();
}

function simulate() {
  clearProjection();
  if (!history) return;
  const deadline = byId('deadline').value;
  const workdaysOnly = byId('weekdays').checked;
  let result;
  try {
    result = forecastQueue({
      deadline, workdaysOnly, backlog: history.backlog, lastDate: history.lastDate,
      dailyArrivals: byId('daily-arrivals').value, dailyCapacity: byId('daily-capacity').value,
    });
  } catch (error) {
    const notice = byId('scenario-error');
    notice.textContent = error.message;
    notice.hidden = false;
    return;
  }

  const { records, clearsOn, requiredDailyCompletions, backlogAtDeadline, days } = result;
  byId('projection-finding').textContent = clearsOn
    ? `Neste cenário, a fila chega a zero em ${formatDay(clearsOn)}.`
    : `Neste cenário, ainda restam ${number.format(backlogAtDeadline)} pendências em ${formatDay(deadline)}.`;
  byId('projection-finding').classList.toggle('notice-warning', !clearsOn);
  renderStats('projection-stats', [
    ['Capacidade mínima por dia para zerar no prazo', requiredDailyCompletions],
    ['Fila na data-limite', backlogAtDeadline],
    [workdaysOnly ? 'Dias de segunda a sexta simulados' : 'Dias corridos simulados', days],
  ]);
  renderChart('projection-chart', records);
  byId('projection-details').open = false;
  renderTable('projection-rows', records.map((row, index) => [
    formatDay(row.date), index ? records[index - 1].backlog : history.backlog,
    row.arrivals, row.completed, row.backlog,
  ]));
  byId('projection').hidden = false;
}

byId('choose-file').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) void openFile(fileInput.files[0]);
  fileInput.value = '';
});
byId('example').addEventListener('click', () => {
  importVersion += 1;
  workbook = null;
  byId('sheet-field').hidden = true;
  showSourceStatus('');
  setRows([
    ['Data', 'Entradas', 'Conclusões'],
    ['19/10/2026', 120, 100],
    ['20/10/2026', 110, 105],
    ['21/10/2026', 105, 110],
  ], '40');
  showMapping('Exemplo com dados fictícios', false);
  analyze(true);
});
sheetSelect.addEventListener('change', readSelectedSheet);
headerInput.addEventListener('input', updateColumns);
for (const [id] of columnFields) byId(id).addEventListener('change', clearHistory);
openingInput.addEventListener('input', clearHistory);
historyForm.addEventListener('submit', event => {
  event.preventDefault();
  analyze();
});
scenarioForm.addEventListener('input', clearProjection);
scenarioForm.addEventListener('submit', event => {
  event.preventDefault();
  simulate();
});

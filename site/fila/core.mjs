const DAY_MS = 86_400_000;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isBlank(value) {
  return value == null || (typeof value === 'string' && !value.trim());
}

function readDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  let afterQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        afterQuote = true;
      } else {
        value += char;
      }
      continue;
    }

    if (char === delimiter || char === '\r' || char === '\n') {
      row.push(value);
      value = '';
      afterQuote = false;
      if (char !== delimiter) {
        rows.push(row);
        row = [];
        if (char === '\r' && text[index + 1] === '\n') index += 1;
      }
    } else if (afterQuote || (char === '"' && value)) {
      return null;
    } else if (char === '"') {
      quoted = true;
    } else {
      value += char;
    }
  }

  if (quoted) return null;
  if (row.length || value || afterQuote) rows.push([...row, value]);
  return rows;
}

export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, '');
  const directive = /^sep=([,;\t])(?:\r\n|\r|\n|$)/i.exec(text);
  if (directive) {
    const rows = readDelimited(text.slice(directive[0].length), directive[1]);
    if (rows) return [[`sep=${directive[1]}`], ...rows];
    throw new Error('O CSV tem aspas sem fechamento ou campos entre aspas fora do padrão.');
  }

  let bestRows = null;
  let bestFrequency = 0;
  let bestWidth = 0;

  // Use the most common multi-column row so a short preamble can be ignored.
  for (const delimiter of [';', ',', '\t']) {
    const rows = readDelimited(text, delimiter);
    if (!rows) continue;
    bestRows ??= rows;
    const frequencies = new Map();
    for (const row of rows) {
      if (row.length < 2 || row.every(isBlank)) continue;
      const frequency = (frequencies.get(row.length) ?? 0) + 1;
      frequencies.set(row.length, frequency);
      if (frequency > bestFrequency || (frequency === bestFrequency && row.length > bestWidth)) {
        bestRows = rows;
        bestFrequency = frequency;
        bestWidth = row.length;
      }
    }
  }

  if (!bestRows) throw new Error('O CSV tem aspas sem fechamento ou campos entre aspas fora do padrão.');
  return bestRows;
}

function isoDay(timestamp) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  const day = date.toISOString().split('T')[0];
  return ISO_DAY.test(day) && !day.startsWith('0000') ? day : null;
}

function timestamp(day) {
  return Date.parse(`${day}T00:00:00Z`);
}

export function parseDay(value, date1904 = false) {
  if (value instanceof Date) return isoDay(value.getTime());

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    const serial = Math.floor(value);
    if (date1904) return isoDay(Date.UTC(1904, 0, 1) + serial * DAY_MS);
    // Excel's 1900 system reserves serial 60 for the nonexistent 29/02/1900.
    if (serial === 60) return null;
    const days = serial > 60 ? serial - 1 : serial;
    return isoDay(Date.UTC(1899, 11, 31) + days * DAY_MS);
  }

  if (typeof value !== 'string') return null;
  let day = value.trim();
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(day);
  if (local) {
    const [, date, month, year] = local;
    day = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
  }
  return ISO_DAY.test(day) && isoDay(timestamp(day)) === day ? day : null;
}

export function parseCount(value) {
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) value = Number(value.trim());
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function analyzeHistory(rows, { headerRow = 0, date, arrivals, completed, initialBacklog, date1904 = false }) {
  const result = {
    records: [], errors: [], warnings: [], lastDate: null, backlog: null, totalArrivals: null, totalCompleted: null,
  };
  const { errors, warnings } = result;
  const header = rows[headerRow];
  const columns = [date, arrivals, completed];
  let backlog = parseCount(initialBacklog);

  if (!Number.isInteger(headerRow) || headerRow < 0 || !Array.isArray(header)) {
    errors.push({ row: null, message: 'Selecione a linha de cabeçalho da planilha.' });
  } else if (new Set(columns).size !== 3 || columns.some(index => !Number.isInteger(index) || index < 0 || index >= header.length)) {
    errors.push({ row: null, message: 'Selecione três colunas distintas para data, entradas e conclusões.' });
  }
  if (backlog === null) errors.push({ row: null, message: 'Informe um saldo inicial inteiro e maior ou igual a zero.' });
  if (errors.length) return result;

  const records = [];
  const seen = new Map();

  for (let index = headerRow + 1; index < rows.length; index += 1) {
    const cells = rows[index];
    if (!cells || cells.every(isBlank)) continue;
    const row = index + 1;
    const day = parseDay(cells[date], date1904);
    const incoming = parseCount(cells[arrivals]);
    const done = parseCount(cells[completed]);

    if (!day) {
      errors.push({ row, message: 'A data está vazia ou inválida. Use DD/MM/AAAA ou AAAA-MM-DD.' });
    } else if (seen.has(day)) {
      errors.push({ row, message: `Data repetida (linha ${seen.get(day)}). Mantenha um total por data.` });
    } else {
      seen.set(day, row);
    }
    if (incoming === null) errors.push({ row, message: 'As entradas precisam ser um número inteiro maior ou igual a zero.' });
    if (done === null) errors.push({ row, message: 'As conclusões precisam ser um número inteiro maior ou igual a zero.' });
    if (day && incoming !== null && done !== null) records.push({ date: day, arrivals: incoming, completed: done, row });
  }

  if (errors.length) return result;
  if (!records.length) {
    errors.push({ row: null, message: 'Inclua ao menos um dia de dados abaixo do cabeçalho.' });
    return result;
  }

  records.sort((left, right) => left.date.localeCompare(right.date));
  let lastDate = null;
  let totalArrivals = 0;
  let totalCompleted = 0;
  for (const record of records) {
    const { date: day, arrivals: incoming, completed: done, row } = record;
    if (lastDate) {
      const gap = (timestamp(day) - timestamp(lastDate)) / DAY_MS - 1;
      if (gap > 0) {
        const span = gap === 1 ? '1 dia sem registro' : `${gap} dias sem registro`;
        warnings.push({ row, message: `Entre ${lastDate} e ${day}: ${span}. Confira se houve movimentação nesse período.` });
      }
    }
    const available = backlog + incoming;
    totalArrivals += incoming;
    totalCompleted += done;
    if (![available, totalArrivals, totalCompleted].every(Number.isSafeInteger)) {
      errors.push({ row, message: 'O total excede o limite de precisão numérica.' });
      return result;
    }
    if (done > available) {
      errors.push({ row, message: 'As conclusões superam a fila disponível. Confira o saldo inicial e os dados dessa data.' });
      return result;
    }
    backlog = available - done;
    record.backlog = backlog;
    lastDate = day;
  }

  return { ...result, records, lastDate, backlog, totalArrivals, totalCompleted };
}

export function forecastQueue({ lastDate, backlog, dailyArrivals, dailyCapacity, deadline, workdaysOnly = false }) {
  const startDay = parseDay(lastDate);
  const endDay = parseDay(deadline);
  const balance = parseCount(backlog);
  const arrivals = parseCount(dailyArrivals);
  const capacity = parseCount(dailyCapacity);

  if (!startDay || !endDay || endDay <= startDay) throw new Error('Escolha um prazo posterior ao último dia da planilha.');
  if ([balance, arrivals, capacity].includes(null)) throw new Error('Use números inteiros a partir de zero para a demanda e a capacidade.');
  const start = timestamp(startDay);
  const end = timestamp(endDay);
  if ((end - start) / DAY_MS > 366) throw new Error('Escolha um prazo de até 366 dias após o último dia da planilha.');

  const records = [];
  let remaining = balance;
  let clearsOn = null;
  for (let time = start + DAY_MS; time <= end; time += DAY_MS) {
    const weekday = new Date(time).getUTCDay();
    if (workdaysOnly && (weekday === 0 || weekday === 6)) continue;

    const available = remaining + arrivals;
    if (!Number.isSafeInteger(available)) throw new Error('O saldo projetado excede o limite de precisão numérica.');
    const date = isoDay(time);
    const completed = Math.min(available, capacity);
    remaining = available - completed;
    if (remaining === 0) clearsOn ??= date;
    records.push({ date, arrivals, completed, backlog: remaining });
  }

  const days = records.length;
  if (!days) throw new Error('Escolha um prazo que inclua ao menos um dia útil após o último dia da planilha.');
  const requiredDailyCompletions = arrivals + Math.ceil(balance / days);
  if (!Number.isSafeInteger(requiredDailyCompletions)) throw new Error('A capacidade mínima excede o limite de precisão numérica.');
  return { records, requiredDailyCompletions, days, clearsOn, backlogAtDeadline: remaining };
}

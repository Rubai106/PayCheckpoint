/** Minimal RFC-4180-style CSV reader for the project's dependency-free evaluation tools. */
export function parseCsv(input) {
  const text = String(input ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"' && field.length === 0) { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  if (quoted) throw new Error('Malformed CSV: unterminated quoted field.');
  if (field.length || row.length) {
    row.push(field);
    if (row.some(value => value !== '')) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows.shift().map(value => value.trim());
  if (headers.some(value => !value)) throw new Error('Malformed CSV: empty column name.');
  if (new Set(headers).size !== headers.length) throw new Error('Malformed CSV: duplicate column name.');
  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`Malformed CSV: row ${index + 2} has ${values.length} cells; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, cell) => [header, values[cell] ?? '']));
  });
}

export function toCsv(rows, headers) {
  const quote = value => {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(','), ...rows.map(row => headers.map(header => quote(row[header])).join(','))].join('\n') + '\n';
}

export function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

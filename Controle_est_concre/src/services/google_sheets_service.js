function normalizeCP(cpVal) {
  if (!cpVal) return null;
  const cpStr = String(cpVal).trim().replace(/^'/, '');
  if (cpStr === '1' || cpStr === '2') return Number(cpStr);
  if (cpStr.includes('Feb 01 2026') || cpStr.includes('01/02/2026') || cpStr.startsWith('Sun Feb 01')) return 1;
  if (cpStr.includes('Feb 02 2026') || cpStr.includes('02/02/2026') || cpStr.startsWith('Mon Feb 02')) return 2;
  const parsed = Number.parseInt(cpStr, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(s.replace(/\s*\([^)]*\)\s*$/, ''));
  if (Number.isNaN(d.getTime())) return null;
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSheetRow(row) {
  return {
    data_moldagem: normalizeDate(row.data_moldagem || row.Data_Moldagem),
    data_ruptura: normalizeDate(row.data_ruptura || row.Data_Ruptura),
    traco_id: String(row.traco_id || row['Traço_ID'] || row.Traco_ID || '').trim(),
    idade_dias: toNumber(row.idade_dias || row.Idade_dias),
    cp: normalizeCP(row.cp || row.CP),
    mpa: toNumber(row.mpa || row.MPA),
  };
}

function matchesFilters(row, filters) {
  if (!row.data_moldagem) return false;
  if (filters.ano && Number(row.data_moldagem.slice(0, 4)) !== filters.ano) return false;
  if (filters.mes && Number(row.data_moldagem.slice(5, 7)) !== filters.mes) return false;
  if (filters.data_inicio && row.data_moldagem < filters.data_inicio) return false;
  if (filters.data_fim && row.data_moldagem > filters.data_fim) return false;
  return true;
}

async function fetchGoogleSheetsRows(filters, settings) {
  if (!settings.apiUrl) {
    throw new Error('Google Sheets fallback URL is not configured');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), settings.timeoutMs);
  try {
    const separator = settings.apiUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${settings.apiUrl}${separator}t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Google Sheets HTTP ${response.status}`);
    }
    const parsed = await response.json();
    const rows = (parsed.rows || [])
      .map(normalizeSheetRow)
      .filter((row) => row.traco_id && row.idade_dias && row.cp && row.mpa !== null)
      .filter((row) => matchesFilters(row, filters))
      .sort((a, b) => String(b.data_moldagem).localeCompare(String(a.data_moldagem)));
    return rows.slice(filters.offset, filters.offset + filters.limit + 1);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchGoogleSheetsRows, normalizeSheetRow };

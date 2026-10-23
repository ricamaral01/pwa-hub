const fs = require('fs');
const path = require('path');
const { log } = require('../core/logger');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadState(statePath) {
  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      synced: new Set(Array.isArray(parsed.synced) ? parsed.synced : []),
      attempts: parsed.attempts && typeof parsed.attempts === 'object' ? parsed.attempts : {},
    };
  } catch (err) {
    return { synced: new Set(), attempts: {} };
  }
}

function saveState(statePath, state) {
  const dir = path.dirname(statePath);
  fs.mkdirSync(dir, { recursive: true });
  const payload = {
    synced: Array.from(state.synced),
    attempts: state.attempts,
    updated_at: new Date().toISOString(),
  };
  const tmpPath = `${statePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload));
  fs.renameSync(tmpPath, statePath);
}

async function fetchSheetRows(exportUrl, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const separator = exportUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${exportUrl}${separator}t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Sheet export HTTP ${response.status}`);
    }
    const parsed = await response.json();
    return Array.isArray(parsed.rows) ? parsed.rows : [];
  } finally {
    clearTimeout(timer);
  }
}

function toPayload(row) {
  return {
    id: row.id,
    source: 'sheet-reconciliation',
    timestamp: row.timestamp,
    traco_id: row.traco_id,
    data_moldagem: row.data_moldagem,
    hora_moldagem: row.hora_moldagem,
    idade_dias: row.idade_dias,
    cp: row.cp,
    data_ruptura: row.data_ruptura,
    mpa: row.mpa,
    status_meta: row.status_meta,
    meta_min: row.meta_min,
    meta_max: row.meta_max,
    responsavel: row.responsavel,
    qr_raw: row.qr_raw,
  };
}

async function postRow(targetUrl, row, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPayload(row)),
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch (err) { /* non-JSON body */ }
    if (response.ok && json && json.ok) {
      return { ok: true };
    }
    return { ok: false, status: response.status, error: (json && json.error) || text };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

const ATTEMPTS_WARN_THRESHOLD = 10;

async function runReconciliation(settings, requestId) {
  if (!settings.enabled) {
    return { skipped: true, reason: 'disabled' };
  }
  if (!settings.exportUrl) {
    log('WARN', 'sheet_reconciliation_misconfigured', { request_id: requestId, reason: 'exportUrl not set' });
    return { skipped: true, reason: 'no_export_url' };
  }

  const statePath = path.isAbsolute(settings.statePath)
    ? settings.statePath
    : path.join(process.cwd(), settings.statePath);

  let rows;
  try {
    rows = await fetchSheetRows(settings.exportUrl, settings.timeoutMs);
  } catch (err) {
    log('ERROR', 'sheet_reconciliation_fetch_failed', { request_id: requestId, error: err.message });
    return { skipped: true, reason: 'fetch_failed', error: err.message };
  }

  const state = loadState(statePath);
  const pending = rows.filter((r) => r && r.id && !state.synced.has(r.id));

  let syncedCount = 0;
  let stillPendingCount = 0;

  for (const row of pending) {
    const result = await postRow(settings.targetUrl, row, settings.timeoutMs);
    if (result.ok) {
      state.synced.add(row.id);
      delete state.attempts[row.id];
      syncedCount++;
    } else {
      const attempts = (state.attempts[row.id] || 0) + 1;
      state.attempts[row.id] = attempts;
      stillPendingCount++;
      if (attempts === ATTEMPTS_WARN_THRESHOLD) {
        log('WARN', 'sheet_reconciliation_row_stuck', {
          request_id: requestId,
          row_id: row.id,
          traco_id: row.traco_id,
          attempts,
          last_error: result.error,
        });
      }
    }
    if (settings.requestDelayMs > 0) {
      await sleep(settings.requestDelayMs);
    }
  }

  saveState(statePath, state);

  if (syncedCount > 0 || stillPendingCount > 0) {
    log('INFO', 'sheet_reconciliation_cycle_completed', {
      request_id: requestId,
      total_rows_in_sheet: rows.length,
      newly_synced: syncedCount,
      still_pending: stillPendingCount,
      known_synced_total: state.synced.size,
    });
  }

  return { skipped: false, syncedCount, stillPendingCount, totalRows: rows.length };
}

module.exports = { runReconciliation, loadState, saveState, toPayload };

const { randomUUID } = require('crypto');
const { config } = require('../core/config');
const { runReconciliation } = require('../services/sheet_reconciliation_service');
const { log } = require('../core/logger');

let running = true;
let timer = null;

async function runCycle() {
  if (!running) return;

  try {
    await runReconciliation(config.sheetReconciliation, randomUUID());
  } catch (err) {
    log('ERROR', 'sheet_reconciliation_cycle_failed', { error: err.message });
  }

  if (running) {
    timer = setTimeout(runCycle, config.sheetReconciliation.pollingIntervalMs);
  }
}

function handleShutdown(signal) {
  log('INFO', 'sheet_reconciliation_shutdown_received', { signal });
  running = false;
  if (timer) clearTimeout(timer);
  process.exit(0);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

log('INFO', 'sheet_reconciliation_worker_started', {
  enabled: config.sheetReconciliation.enabled,
  polling_interval_ms: config.sheetReconciliation.pollingIntervalMs,
});
runCycle();

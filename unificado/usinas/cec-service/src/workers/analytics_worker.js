const { processPendingJobs } = require('../services/analytics_service');
const { closePool } = require('../core/database');
const { log } = require('../core/logger');

const POLLING_INTERVAL_MS = Number(process.env.WORKER_POLLING_INTERVAL_MS || 15000);
let running = true;
let timer = null;

async function runWorker() {
  if (!running) return;

  try {
    const processedCount = await processPendingJobs();
    if (processedCount > 0) {
      log('INFO', 'worker_processed_jobs', { count: processedCount });
    }
  } catch (err) {
    log('ERROR', 'worker_loop_error', { error: err.message });
  }

  if (running) {
    timer = setTimeout(runWorker, POLLING_INTERVAL_MS);
  }
}

function handleShutdown(signal) {
  log('INFO', 'worker_shutdown_received', { signal });
  running = false;
  if (timer) clearTimeout(timer);

  // Allow pending queries to finish and close pool
  closePool()
    .then(() => {
      log('INFO', 'worker_shutdown_completed');
      process.exit(0);
    })
    .catch((err) => {
      log('ERROR', 'worker_shutdown_failed', { error: err.message });
      process.exit(1);
    });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

log('INFO', 'worker_started', { polling_interval_ms: POLLING_INTERVAL_MS });
runWorker();

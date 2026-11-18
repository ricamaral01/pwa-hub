import { request } from './api';

// Only reads may be cancelled or timed out. Writes keep their existing
// idempotency and offline semantics so an ambiguous response is not replayed.
export async function taskRead<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = window.setTimeout(cancel, 15000);
  try {
    return await request<T>(path, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted)
      throw new Error('A conexão demorou a responder. Tente atualizar novamente.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

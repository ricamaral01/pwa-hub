import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de IndexedDB (Dexie usa IndexedDB que não existe no jsdom)
vi.mock('@/db/schema', () => ({
  db: {
    deviceConfig: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    activeSession: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    activeAppointment: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    appointmentQuantities: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    activeStop: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    queue: {
      where: vi.fn().mockReturnValue({
        anyOf: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(0),
        }),
        equals: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      add: vi.fn().mockResolvedValue(1),
      update: vi.fn().mockResolvedValue(1),
    },
    conflicts: {
      add: vi.fn().mockResolvedValue(1),
    },
  },
}));

// Mock de dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => unknown) => {
    try {
      return fn();
    } catch {
      return undefined;
    }
  },
}));

// Mock de navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

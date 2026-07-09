const MIGRATION_FLAG = 'zenshin-v1.3-initialized';
const LEGACY_KEYS = [
  'zenshin-students',
  'zenshin-trials',
  'zenshin-ledger',
  'zenshin-audit',
  'zenshin-timeline',
  'zenshin-session'
];

export function initializeClientStorage(): void {
  if (typeof window === 'undefined' || localStorage.getItem(MIGRATION_FLAG)) {
    return;
  }

  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }

  localStorage.setItem(MIGRATION_FLAG, 'true');
}

export function loadFromStorage<T>(key: string, initial: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }

  try {
    return JSON.parse(data) as T;
  } catch {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}
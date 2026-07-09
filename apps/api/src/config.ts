function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getRequiredEnv(name: string): string {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  return readEnv(name);
}

export function assertRequiredEnv(names: string[]): void {
  for (const name of names) {
    getRequiredEnv(name);
  }
}

export function getCorsOrigins(): string[] | undefined {
  const value = readEnv('CORS_ORIGIN');

  if (!value) {
    return undefined;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
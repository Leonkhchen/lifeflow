export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function ensureNonEmpty(value: string, field: string): void {
  if (!value || !value.trim()) throw new Error(`${field} must be a non-empty string`);
}

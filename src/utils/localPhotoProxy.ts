// Deprecated: local photo proxy removed; keep no-op exports to avoid runtime import errors
export async function ensurePhotoProxyServer(): Promise<string> {
  return 'http://127.0.0.1:0';
}

export function createEphemeralPhotoUrl(
  _baseUrl: string,
  _employeeId: string,
  _size: string,
  _ttlMs: number = 60_000
): { url: string; token: string; expiresAt: number } {
  return { url: '', token: '', expiresAt: Date.now() };
}

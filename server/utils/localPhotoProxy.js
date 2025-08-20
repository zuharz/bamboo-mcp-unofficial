// Deprecated: local photo proxy removed; keep no-op exports to avoid runtime import errors
export async function ensurePhotoProxyServer() {
    return 'http://127.0.0.1:0';
}
export function createEphemeralPhotoUrl(_baseUrl, _employeeId, _size, _ttlMs = 60_000) {
    return { url: '', token: '', expiresAt: Date.now() };
}

function resolveBase(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  // In the browser, default to '/api' so requests route through same-origin or server reverse proxy
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const ssrBackend = (process.env.ASCENSION_BACKEND_URL || 'http://127.0.0.1:9008').trim().replace(/\/+$/, '');
  return ssrBackend.endsWith('/api') ? ssrBackend : `${ssrBackend}/api`;
}

export const API_BASE = resolveBase();

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const cleanPath = '/' + path.replace(/^\/+/, '');
  const url = `${API_BASE}${cleanPath}`;
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...(!options.body || options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const body: any = await response.json().catch(() => ({ detail: 'The server returned an unreadable response.' }));
  if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : JSON.stringify(body));
  return body;
}

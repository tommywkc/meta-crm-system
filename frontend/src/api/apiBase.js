function normalizeBaseUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return 'http://localhost:4000';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '');
  }
  // Common misconfig in CI: missing protocol (e.g. myapp.azurewebsites.net)
  return `https://${trimmed}`.replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);

export function apiUrl(pathname) {
  if (!pathname) return API_BASE_URL;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${API_BASE_URL}${path}`;
}

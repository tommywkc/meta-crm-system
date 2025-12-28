export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');

export function apiUrl(pathname) {
  if (!pathname) return API_BASE_URL;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${API_BASE_URL}${path}`;
}

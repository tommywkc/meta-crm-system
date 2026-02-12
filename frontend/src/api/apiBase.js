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

// Generic request helper
export async function apiRequest(pathname, method = 'GET', body = null, params = null, isFormData = false) {
  const url = new URL(apiUrl(pathname));
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
    });
  }

  const options = { method, credentials: 'include', headers: {} };
  if (body) {
    if (isFormData) {
      options.body = body; // fetch will set multipart boundary
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  const res = await fetch(url.toString(), options);
  if (!res.ok) {
    let message;
    try {
      const err = await res.json();
      message = err?.message || err?.error;
    } catch (e) {
      message = res.statusText;
    }
    throw new Error(message || 'Request failed');
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

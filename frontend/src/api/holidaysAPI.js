import { apiUrl } from './apiBase';

export async function handleListHolidays(limit = 2000, offset = 0) {
  try {
    const response = await fetch(apiUrl(`/api/holidays?limit=${limit}&offset=${offset}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.message || '無法載入假期資料';
      throw new Error(message);
    }

    return payload;
  } catch (err) {
    console.error('List holidays error:', err);
    throw err;
  }
}

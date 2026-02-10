import { apiUrl } from './apiBase';

export async function handleListWaitlist(session_id) {
  try {
    const params = new URLSearchParams();
    if (session_id) params.append('session_id', session_id);

    const response = await fetch(apiUrl(`/api/waitlist${params.toString() ? `?${params.toString()}` : ''}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      let message = '取得候補清單失敗';
      try {
        const err = await response.json();
        if (err?.message) message = err.message;
      } catch (e) {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    const payload = await response.json();
    return payload;
  } catch (err) {
    console.error('Fetch waitlist error:', err);
    throw err;
  }
}

export async function handleApplyWaitlist(data) {
  try {
    const response = await fetch(apiUrl('/api/waitlist/apply'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let message = '加入候補失敗';
      try {
        const err = await response.json();
        if (err?.message) message = err.message;
      } catch (e) {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    const payload = await response.json();
    return payload;
  } catch (err) {
    console.error('Apply waitlist error:', err);
    throw err;
  }
}

export async function handleUpdateWaitlistRank(data) {
  try {
    const response = await fetch(apiUrl('/api/waitlist/rank'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let message = '更新排名失敗';
      try {
        const err = await response.json();
        if (err?.message) message = err.message;
      } catch (e) {
        message = response.statusText || message;
      }
      throw new Error(message);
    }

    const payload = await response.json();
    return payload;
  } catch (err) {
    console.error('Update waitlist rank error:', err);
    throw err;
  }
}

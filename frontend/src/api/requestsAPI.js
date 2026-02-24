import { apiUrl } from './apiBase';

export async function handleSubmitRequest(data) {
  try {
    console.log('Submitting request...', data);
    const response = await fetch(apiUrl('/api/requests'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.message || '申請提交失敗';
      throw new Error(message);
    }

    console.log('Request submitted:', payload);
    return payload;
  } catch (err) {
    console.error('Request submit error:', err);
    throw err;
  }
}

export async function handleListRequests() {
  try {
    console.log('Fetching requests list...');
    const response = await fetch(apiUrl('/api/requests'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.message || '無法載入申請列表';
      throw new Error(message);
    }

    console.log('Requests list loaded:', payload);
    return payload;
  } catch (err) {
    console.error('List requests error:', err);
    throw err;
  }
}

export async function handleGetRequestById(requestId) {
  try {
    const response = await fetch(apiUrl(`/api/requests/${requestId}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.message || '無法載入申請詳情';
      throw new Error(message);
    }

    return payload;
  } catch (err) {
    console.error(`Get request detail error for ${requestId}:`, err);
    throw err;
  }
}
//TODO: Handle session changes
export async function handleUpdateRequestById(request_id, data) {
  try {
    console.log(`Attempting to update request ${request_id}...`, data);

    const response = await fetch(apiUrl(`/api/requests/${request_id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      try {
        const err = await response.json();
        throw new Error(err?.message || `無法更新申請 ${request_id}`);
      } catch (e) {
        throw new Error(response.statusText || `無法更新申請 ${request_id}`);
      }
    }

    const payload = await response.json();
    console.log(`Request ${request_id} update response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Update request error for ${request_id}:`, err);
    throw err;
  }
}

export async function handleCancelRequestById(request_id) {
  try {
    const response = await fetch(apiUrl(`/api/requests/${request_id}/cancel`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.message || `無法取消申請 ${request_id}`;
      throw new Error(message);
    }

    return payload;
  } catch (err) {
    console.error(`Cancel request error for ${request_id}:`, err);
    throw err;
  }
}

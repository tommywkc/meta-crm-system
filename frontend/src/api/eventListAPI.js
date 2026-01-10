import { apiUrl } from './apiBase';

export async function handleCreateEvent(data) {
  try {
    console.log('Attempting to create event...', data);
    const response = await fetch(apiUrl('/api/events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
      body: JSON.stringify(data),
    });
    // 與原本 createEvent 相同：不特別檢查狀態碼，直接嘗試解析 JSON
    const payload = await response.json();
    console.log('Event creation response:', payload);
    return payload;
  } catch (err) {
    console.error('Event creation error:', err);
    throw err;
  }
}

export async function handleListEvents() {
    try {
        console.log('Attempting to fetch event list...');
      const response = await fetch(apiUrl('/api/events'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // allow cookies to be sent across origins
      });
      // 與原本 listEvents 相同：直接解析 JSON
      const payload = await response.json();
        console.log('Event list response:', payload);
        return payload;
    } catch (err) {
        console.error('Fetch event list error:', err);
        throw err;
    }
}

export async function handleGetById(event_id) {
  try {
    console.log(`Attempting to fetch event ${event_id}...`);
    console.log(`Fetching event ${event_id} from backend`);
    const res = await fetch(apiUrl(`/api/events/${event_id}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
    });
    if (!res.ok) {
      // 優先使用後端回傳的 message，其次根據狀態碼給友善預設文字
      let message;
      try {
        const err = await res.json();
        message = err && err.message;
      } catch (e) {
        // 若不是 JSON 或沒有 body，就忽略，改用下面的預設
      }

      if (!message) {
        if (res.status === 403) {
          // 後端對非 OPEN 活動的預期訊息
          message = '暫時未能瀏覽未開放活動';
        } else {
          message = res.statusText || `Failed to fetch event ${event_id}`;
        }
      }

      throw new Error(message);
    }
    const payload = await res.json();
    console.log(`Event ${event_id} response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch event ${event_id} error:`, err);
    throw err;
  }
}

export async function handleUpdateById(event_id, data) {
  try {
    console.log(`Attempting to update customer ${event_id}...`, data);
    console.log(`Updating event ${event_id} on backend`, data);
    const res = await fetch(apiUrl(`/api/events/${event_id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      // try to read backend error message
      try {
        const err = await res.json();
        throw new Error(err.message || `Failed to update event ${event_id}`);
      } catch (e) {
        throw new Error(res.statusText || `Failed to update event ${event_id}`);
      }
    }
    const payload = await res.json();
    console.log(`Customer ${event_id} update response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Update customer ${event_id} error:`, err);
    throw err;
  }
}

export async function handleDeleteById(event_id) {
  try {
    console.log(`Attempting to delete customer ${event_id}...`);
    console.log(`Deleting event ${event_id} on backend`);
    const res = await fetch(apiUrl(`/api/events/${event_id}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
    });
    if (!res.ok) {
      // try to read backend error message
      try {
        const err = await res.json();
        throw new Error(err.message || `Failed to delete event ${event_id}`);
      } catch (e) {
        throw new Error(res.statusText || `Failed to delete event ${event_id}`);
      }
    }
    const payload = await res.json();
    console.log(`Customer ${event_id} deletion response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Delete customer ${event_id} error:`, err);
    throw err;
  }
}
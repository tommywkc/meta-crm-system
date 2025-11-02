export async function createEvent(data) {
  const response = await fetch('http://localhost:4000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function handleCreateEvent(data) {
  try {
    console.log('Attempting to create event...', data);
    const payload = await createEvent(data);
    console.log('Event creation response:', payload);
    return payload;
  } catch (err) {
    console.error('Event creation error:', err);
    throw err;
  }
}


export async function listEvents() {
    const response = await fetch('http://localhost:4000/api/events', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
}

export async function handleListEvents() {
    try {
        console.log('Attempting to fetch event list...');
        const payload = await listEvents();
        console.log('Event list response:', payload);
        return payload;
    } catch (err) {
        console.error('Fetch event list error:', err);
        throw err;
    }
}



export async function getEventById(event_id) {
  console.log(`Fetching event ${event_id} from backend`);
  const res = await fetch(`http://localhost:4000/api/events/${event_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || `Failed to fetch event ${event_id}`);
    } catch (e) {
      throw new Error(res.statusText || `Failed to fetch event ${event_id}`);
    }
  }
  return await res.json();
}



export async function handleGetById(event_id) {
  try {
      console.log(`Attempting to fetch event ${event_id}...`);
      const payload = await getEventById(event_id);
      console.log(`Event ${event_id} response:`, payload);
      return payload;
    } catch (err) {
      console.error(`Fetch event ${event_id} error:`, err);
      throw err;
    }
}


export async function updateEventById(event_id, data) {
  console.log(`Updating event ${event_id} on backend`, data);
  const res = await fetch(`http://localhost:4000/api/events/${event_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || `Failed to update event ${event_id}`);
    } catch (e) {
      throw new Error(res.statusText || `Failed to update event ${event_id}`);
    }
  }
  return await res.json();
}

export async function handleUpdateById(event_id, data) {
  try {
    console.log(`Attempting to update customer ${event_id}...`, data);
    const payload = await updateEventById(event_id, data);
    console.log(`Customer ${event_id} update response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Update customer ${event_id} error:`, err);
    throw err;
  }
}


export async function deleteEventById(event_id) {
  console.log(`Deleting event ${event_id} on backend`);
  const res = await fetch(`http://localhost:4000/api/events/${event_id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || `Failed to delete event ${event_id}`);
    } catch (e) {
      throw new Error(res.statusText || `Failed to delete event ${event_id}`);
    }
  }
  return await res.json();
}

export async function handleDeleteById(event_id) {
  try {
    console.log(`Attempting to delete customer ${event_id}...`);
    const payload = await deleteEventById(event_id);
    console.log(`Customer ${event_id} deletion response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Delete customer ${event_id} error:`, err);
    throw err;
  }
}
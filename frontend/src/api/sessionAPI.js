export async function createSession(data) {
  const response = await fetch('http://localhost:4000/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // allow cookies to be sent across origins
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function handleCreateSession(data) {
  try {
    console.log('Attempting to create session...', data);
    const payload = await createSession(data);
    console.log('Session creation response:', payload);
    return payload;
  } catch (err) {
    console.error('Session creation error:', err);
    throw err;
  }
}

export async function listSessionsByEventId(event_id) {
  const response = await fetch(`http://localhost:4000/api/events/${event_id}/sessions`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions for event ${event_id}`);
  }
  return response.json();
}

export async function handleListSessionsByEventId(event_id) {
  try {
    console.log(`Attempting to fetch sessions for event ${event_id}...`);
    const payload = await listSessionsByEventId(event_id);
    console.log(`Sessions for event ${event_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch sessions error for event ${event_id}:`, err);
    throw err;
  }
}

export async function getSessionById(session_id) {
  const response = await fetch(`http://localhost:4000/api/sessions/${session_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch session ${session_id}`);
  }
  return response.json();
}

export async function handleGetSessionById(session_id) {
  try {
    console.log(`Attempting to fetch session ${session_id}...`);
    const payload = await getSessionById(session_id);
    console.log(`Session ${session_id} data:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch session error for ${session_id}:`, err);
    throw err;
  }
}

export async function updateSession(session_id, data) {
  const response = await fetch(`http://localhost:4000/api/sessions/${session_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function handleUpdateSession(session_id, data) {
  try {
    console.log(`Attempting to update session ${session_id}...`, data);
    const payload = await updateSession(session_id, data);
    console.log(`Session ${session_id} update response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Session ${session_id} update error:`, err);
    throw err;
  }
}

export async function deleteSession(session_id) {
  const response = await fetch(`http://localhost:4000/api/sessions/${session_id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return response.json();
}

export async function handleDeleteSession(session_id) {
  try {
    console.log(`Attempting to delete session ${session_id}...`);
    const payload = await deleteSession(session_id);
    console.log(`Session ${session_id} deletion response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Session ${session_id} deletion error:`, err);
    throw err;
  }
}



// --- Session registrations (場次報名) ---

export async function createSessionRegistration(data) {
  const response = await fetch('http://localhost:4000/api/session-registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let message = '場次報名失敗';
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch (e) {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
  return response.json();
}

export async function handleCreateSessionRegistration(data) {
  try {
    console.log('Attempting to create session registration...', data);
    const payload = await createSessionRegistration(data);
    console.log('Session registration response:', payload);
    return payload;
  } catch (err) {
    console.error('Session registration error:', err);
    throw err;
  }
}


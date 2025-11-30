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

export async function getSessionsByEventId(event_id) {
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

export async function handleGetSessionsByEventId(event_id) {
  try {
    console.log(`Attempting to fetch sessions for event ${event_id}...`);
    const payload = await getSessionsByEventId(event_id);
    console.log(`Sessions for event ${event_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch sessions error for event ${event_id}:`, err);
    throw err;
  }
}
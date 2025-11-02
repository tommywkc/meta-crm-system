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
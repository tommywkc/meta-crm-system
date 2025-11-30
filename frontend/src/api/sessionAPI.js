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
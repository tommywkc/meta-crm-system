export async function createEnrollment(data) {
  console.log('Creating enrollment on backend', data);
  const res = await fetch(`http://localhost:4000/api/enrollments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', 
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let errorMessage = '報名失敗';
    try {
      const err = await res.json();
      if (err.message) {
        errorMessage = err.message;
      }
    } catch (e) {
      errorMessage = res.statusText || '報名失敗';
    }
    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function handleCreateEnrollment(data) {
  try {
    console.log('Attempting to create enrollment...', data);
    const payload = await createEnrollment(data);
    console.log('Enrollment creation response:', payload);
    return payload;
  } catch (err) {
    console.error('Enrollment creation error:', err);
    throw err;
  }
}

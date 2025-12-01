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


export async function checkEnrollment(event_id, user_id) { 
  const response = await fetch(`http://localhost:4000/api/enrollments/check?event_id=${event_id}&user_id=${user_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to check enrollment for event ${event_id} and user ${user_id}`);
  }
  return response.json();
}

export async function handleCheckEnrollment(event_id, user_id) {
  try {
    console.log(`Attempting to check enrollment for event ${event_id} and user ${user_id}...`);
    const payload = await checkEnrollment(event_id, user_id);
    console.log(`Enrollment check result for event ${event_id} and user ${user_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Enrollment check error for event ${event_id} and user ${user_id}:`, err);
    throw err;
  }
}
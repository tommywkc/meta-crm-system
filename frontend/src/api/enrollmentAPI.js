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

export async function listConfirmEnrollmentByUser(user_id, limit = 100, offset = 0) {
  const response = await fetch(`http://localhost:4000/api/enrollments/confirmed?user_id=${user_id}&limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to list confirmed enrollments for user ${user_id}`);
  }
  return response.json();
}

export async function handleConfirmEnrollmentByUser(user_id, limit = 100, offset = 0) {
  try {
    console.log(`Attempting to confirm enrollment for user ${user_id}...`);
    const payload = await listConfirmEnrollmentByUser(user_id);
    console.log(`Enrollment confirmation response for user ${user_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Enrollment confirmation error for user ${user_id}:`, err);
    throw err;
  }
}

// List event_ids that the current logged-in user has enrolled (PENDING or CONFIRMED)
export async function listMyActiveEnrolledEvents() {
  const response = await fetch('http://localhost:4000/api/enrollments/my-events/active', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to list active enrolled events for current user');
  }
  return response.json();
}

export async function handleListMyActiveEnrolledEvents() {
  try {
    console.log('Attempting to list active enrolled events for current user...');
    const payload = await listMyActiveEnrolledEvents();
    console.log('Active enrolled events response for current user:', payload);
    return payload;
  } catch (err) {
    console.error('List active enrolled events error for current user:', err);
    throw err;
  }
}

// List confirmed-enrolled users for a specific event (for session enrollment member selection)
export async function listConfirmedUsersByEvent(event_id) {
  const response = await fetch(`http://localhost:4000/api/enrollments/confirmed-users?event_id=${event_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to list confirmed users for event ${event_id}`);
  }
  return response.json();
}

export async function handleListConfirmedUsersByEvent(event_id) {
  try {
    console.log(`Attempting to list confirmed users for event ${event_id}...`);
    const payload = await listConfirmedUsersByEvent(event_id);
    console.log(`Confirmed users response for event ${event_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`List confirmed users error for event ${event_id}:`, err);
    throw err;
  }
}
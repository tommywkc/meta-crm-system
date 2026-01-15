import { apiUrl } from './apiBase';

export async function handleCreateEnrollment(data) {
  try {
    console.log('Attempting to create enrollment...', data);
    const res = await fetch(apiUrl('/api/enrollments'), {
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
    const payload = await res.json();
    console.log('Enrollment creation response:', payload);
    return payload;
  } catch (err) {
    console.error('Enrollment creation error:', err);
    throw err;
  }
}

export async function handleCheckEnrollment(event_id, user_id) {
  try {
    console.log(`Attempting to check enrollment for event ${event_id} and user ${user_id}...`);
    const response = await fetch(apiUrl(`/api/enrollments/check?event_id=${event_id}&user_id=${user_id}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to check enrollment for event ${event_id} and user ${user_id}`);
    }
    const payload = await response.json();
    console.log(`Enrollment check result for event ${event_id} and user ${user_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Enrollment check error for event ${event_id} and user ${user_id}:`, err);
    throw err;
  }
}

export async function handleConfirmEnrollmentByUser(user_id, limit = 100, offset = 0) {
  try {
    console.log(`Attempting to confirm enrollment for user ${user_id}...`);
    const response = await fetch(apiUrl(`/api/enrollments/confirmed?user_id=${user_id}&limit=${limit}&offset=${offset}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to list confirmed enrollments for user ${user_id}`);
    }
    const payload = await response.json();
    console.log(`Enrollment confirmation response for user ${user_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Enrollment confirmation error for user ${user_id}:`, err);
    throw err;
  }
}

// List event_ids that the current logged-in user has enrolled (PENDING or CONFIRMED)
export async function handleListMyActiveEnrolledEvents() {
  try {
    console.log('Attempting to list active enrolled events for current user...');
    const response = await fetch(apiUrl('/api/enrollments/my-events/active'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to list active enrolled events for current user');
    }
    const payload = await response.json();
    console.log('Active enrolled events response for current user:', payload);
    return payload;
  } catch (err) {
    console.error('List active enrolled events error for current user:', err);
    throw err;
  }
}

// List confirmed-enrolled users for a specific event (for session enrollment member selection)
export async function handleListConfirmedUsersByEvent(event_id) {
  try {
    console.log(`Attempting to list confirmed users for event ${event_id}...`);
    const response = await fetch(apiUrl(`/api/enrollments/confirmed-users?event_id=${event_id}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to list confirmed users for event ${event_id}`);
    }
    const payload = await response.json();
    console.log(`Confirmed users response for event ${event_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`List confirmed users error for event ${event_id}:`, err);
    throw err;
  }
}
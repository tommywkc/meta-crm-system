import { apiUrl } from './apiBase';

export async function handleCreateSession(data) {
  try {
    console.log('Attempting to create session...', data);

    const response = await fetch(apiUrl('/api/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
      body: JSON.stringify(data),
    });

    const payload = await response.json();
    console.log('Session creation response:', payload);
    return payload;
  } catch (err) {
    console.error('Session creation error:', err);
    throw err;
  }
}

export async function handleListSessionsByEventId(event_id) {
  try {
    console.log(`Attempting to fetch sessions for event ${event_id}...`);

    const response = await fetch(apiUrl(`/api/events/${event_id}/sessions`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions for event ${event_id}`);
    }

    const payload = await response.json();
    console.log(`Sessions for event ${event_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch sessions error for event ${event_id}:`, err);
    throw err;
  }
}

export async function handleGetSessionById(session_id) {
  try {
    console.log(`Attempting to fetch session ${session_id}...`);

    const response = await fetch(apiUrl(`/api/sessions/${session_id}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch session ${session_id}`);
    }

    const payload = await response.json();
    console.log(`Session ${session_id} data:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch session error for ${session_id}:`, err);
    throw err;
  }
}

export async function handleUpdateSession(session_id, data) {
  try {
    console.log(`Attempting to update session ${session_id}...`, data);

    const response = await fetch(apiUrl(`/api/sessions/${session_id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const payload = await response.json();
    console.log(`Session ${session_id} update response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Session ${session_id} update error:`, err);
    throw err;
  }
}

export async function handleDeleteSession(session_id) {
  try {
    console.log(`Attempting to delete session ${session_id}...`);

    const response = await fetch(apiUrl(`/api/sessions/${session_id}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const payload = await response.json();
    console.log(`Session ${session_id} deletion response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Session ${session_id} deletion error:`, err);
    throw err;
  }
}



// --- Session registrations (場次報名) ---

export async function handleCreateSessionRegistration(data) {
  try {
    console.log('Attempting to create session registration...', data);

    const response = await fetch(apiUrl('/api/session-registrations'), {
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

    const payload = await response.json();
    console.log('Session registration response:', payload);
    return payload;
  } catch (err) {
    console.error('Session registration error:', err);
    throw err;
  }
}

// --- Upcoming sessions for current user ---

export async function handleListMyUpcomingSessions(limit = 5, offset = 0) {
  try {
    console.log('Attempting to fetch my upcoming sessions...');

    const response = await fetch(apiUrl(`/api/my-sessions/upcoming?limit=${limit}&offset=${offset}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch upcoming sessions');
    }

    const payload = await response.json();
    console.log('My upcoming sessions:', payload);
    return payload;
  } catch (err) {
    console.error('Fetch my upcoming sessions error:', err);
    throw err;
  }
}

// --- Enrolled upcoming sessions list (role-based: member sees own, others see all) ---

export async function handleListEnrolledUpcomingSessions(limit = 100, offset = 0, q = '', eventId) {
  try {
    console.log('Attempting to fetch enrolled upcoming sessions list...', { limit, offset, q });

    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);
    if (q && q.trim()) params.append('q', q);
    if (eventId) params.append('event_id', eventId);

    const response = await fetch(apiUrl(`/api/session-registrations/enrolled-upcoming?${params.toString()}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch enrolled upcoming sessions list');
    }

    const payload = await response.json();
    console.log('Enrolled upcoming sessions list:', payload);
    return payload;
  } catch (err) {
    console.error('Fetch enrolled upcoming sessions list error:', err);
    throw err;
  }
}

// --- Sessions by year for current user (for calendar) ---

export async function handleListMySessionsByYear(year) {
  try {
    console.log('Attempting to fetch my sessions for year...', year);

    const response = await fetch(apiUrl(`/api/my-sessions/by-year?year=${year}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sessions by year');
    }

    const payload = await response.json();
    console.log('My sessions for year result:', payload);
    return payload;
  } catch (err) {
    console.error('Fetch my sessions by year error:', err);
    throw err;
  }
}

// --- Sessions for specific user (admin/staff) ---
export async function handleListUserUpcomingSessions(user_id, limit = 5) {
  try {
    console.log(`Attempting to fetch upcoming sessions for user ${user_id}...`);
    const response = await fetch(apiUrl(`/api/session-registrations/user/${user_id}/upcoming?limit=${limit}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch upcoming sessions for user ${user_id}`);
    }

    const payload = await response.json();
    console.log(`Upcoming sessions for user ${user_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch upcoming sessions for user ${user_id} error:`, err);
    throw err;
  }
}

export async function handleListUserSessionsByYear(user_id, year) {
  try {
    console.log(`Attempting to fetch sessions for user ${user_id} year ${year}...`);
    const response = await fetch(apiUrl(`/api/session-registrations/user/${user_id}/sessions-by-year?year=${year}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions by year for user ${user_id}`);
    }

    const payload = await response.json();
    console.log(`Sessions for user ${user_id} year ${year}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch sessions by year for user ${user_id} error:`, err);
    throw err;
  }
}

// --- Registered sessions for current user by event ---

export async function handleListMyRegisteredSessionsByEvent(event_id) {
  try {
    console.log(`Attempting to fetch my registered sessions for event ${event_id}...`);

    const response = await fetch(apiUrl(`/api/my-sessions/registered-by-event?event_id=${event_id}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch registered sessions for event ${event_id}`);
    }

    const payload = await response.json();
    console.log(`My registered sessions for event ${event_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch my registered sessions by event error for event ${event_id}:`, err);
    throw err;
  }
}

// --- Attendees list for a specific session ---

export async function handleListSessionAttendees(session_id) {
  try {
    console.log(`Attempting to fetch attendees for session ${session_id}...`);

    const response = await fetch(apiUrl(`/api/session-registrations/by-session?session_id=${session_id}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch attendees for session ${session_id}`);
    }

    const payload = await response.json();
    console.log(`Attendees for session ${session_id}:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch attendees error for session ${session_id}:`, err);
    throw err;
  }
}

export async function handleDeleteSessionRegistration(registration_id) {
  try {
    console.log(`Attempting to delete session registration ${registration_id}...`);
    const response = await fetch(apiUrl(`/api/session-registrations/${registration_id}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session registration ${registration_id}`);
    }

    const payload = await response.json();
    console.log(`Delete session registration ${registration_id} result:`, payload);
    return payload;
  } catch (err) {
    console.error(`Delete session registration error for ${registration_id}:`, err);
    throw err;
  }
}

// --- Check-in / Cancel check-in (attendance) ---
export async function handleCheckinRegistration(registration_id, options = {}) {
  try {
    const response = await fetch(apiUrl(`/api/session-registrations/${registration_id}/checkin`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      let message = '簽到失敗';
      let errPayload = null;
      try {
        errPayload = await response.json();
        if (errPayload?.message) message = errPayload.message;
      } catch (e) {}
      const error = new Error(message);
      error.status = response.status;
      error.payload = errPayload;
      throw error;
    }

    const payload = await response.json();
    return payload;
  } catch (err) {
    console.error('Check-in error:', err);
    throw err;
  }
}

export async function handleCancelCheckinRegistration(registration_id) {
  try {
    const response = await fetch(apiUrl(`/api/session-registrations/${registration_id}/checkin`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      let message = '取消簽到失敗';
      let errPayload = null;
      try {
        errPayload = await response.json();
        if (errPayload?.message) message = errPayload.message;
      } catch (e) {}
      const error = new Error(message);
      error.status = response.status;
      error.payload = errPayload;
      throw error;
    }

    const payload = await response.json();
    return payload;
  } catch (err) {
    console.error('Cancel check-in error:', err);
    throw err;
  }
}

// --- Get latest attendance for a registration ---
export async function handleGetRegistrationAttendance(registration_id) {
  try {
    const response = await fetch(apiUrl(`/api/session-registrations/${registration_id}/attendance`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const error = new Error(err?.message || '無法取得簽到紀錄');
      error.status = response.status;
      error.payload = err;
      throw error;
    }

    const payload = await response.json();
    return payload.attendance;
  } catch (err) {
    console.error('Get registration attendance error:', err);
    throw err;
  }
}


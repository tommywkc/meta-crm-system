// Create a single event session
export function createSession(sessionData) {
  return fetch('http://localhost:4000/api/event-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // allow cookies to be sent across origins
    body: JSON.stringify(sessionData),
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => {
        throw new Error(err.message || 'Failed to create session');
      });
    }
    return res.json();
  });
}

export function handleCreateSession(sessionData) {
  return createSession(sessionData)
    .then((payload) => {
      console.log('Session creation response:', payload);
      return payload;
    })
    .catch((err) => {
      console.error('Session creation error:', err);
      throw err;
    });
}

// Bulk create event sessions
export function bulkCreateSessions(event_id, sessions) {
  return fetch('http://localhost:4000/api/event-sessions/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ event_id, sessions }),
  }).then(async (res) => {
    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err.message || 'Failed to bulk create sessions');
      } catch (e) {
        throw new Error(res.statusText || 'Failed to bulk create sessions');
      }
    }
    return res.json();
  });
}

// Helper: create event first, then create its sessions
// eventData: event fields; sessions: array of { session_name, datetime_start, datetime_end, description? }
export async function createEventThenSessions(eventData, sessions = []) {
  const { handleCreateEvent } = await import('./eventListAPI');
  // 1) create event
  const eventRes = await handleCreateEvent(eventData);
  const createdEvent = eventRes?.event;
  if (!createdEvent?.event_id) {
    throw new Error('Event creation failed: missing event_id');
  }
  const event_id = createdEvent.event_id;

  // 2) create sessions if provided
  if (Array.isArray(sessions) && sessions.length > 0) {
    // ensure each session has datetime_start and datetime_end
    const normalized = sessions.map((s) => ({
      event_id,
      session_name: s.session_name,
      description: s.description ?? null,
      datetime_start: s.datetime_start,
      datetime_end: s.datetime_end,
    }));
    const bulkRes = await bulkCreateSessions(event_id, normalized);
    return { event: createdEvent, sessions: bulkRes.sessions };
  }

  return { event: createdEvent, sessions: [] };
}
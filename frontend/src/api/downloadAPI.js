import { apiUrl } from './apiBase';

// Get all events for download page
export async function fetchEventsForDownload() {
  try {
    const response = await fetch(apiUrl('/api/events-for-download'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Get sessions for a specific event
export async function fetchSessionsByEvent(eventId) {
  try {
    const response = await fetch(apiUrl(`/api/events/${eventId}/sessions`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.sessions || [];
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
}

// Get attendance list for a specific session
export async function fetchAttendanceList(sessionId) {
  try {
    const response = await fetch(apiUrl(`/api/sessions/${sessionId}/attendance-list`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance list: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching attendance list:', error);
    throw error;
  }
}

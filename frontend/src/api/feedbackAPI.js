import { apiUrl } from './apiBase';

export async function handleCreateFeedback(feedbackData) {
  try {
    console.log('Attempting to submit feedback...', feedbackData);
    const res = await fetch(apiUrl('/api/feedback'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(feedbackData),
    });
    if (!res.ok) {
      // try to read backend error message
      try {
        const err = await res.json();
        throw new Error(err.message || 'Failed to submit feedback');
      } catch (e) {
        throw new Error(res.statusText || 'Failed to submit feedback');
      }
    }
    const payload = await res.json();
    console.log('Feedback submission successful:', payload);
    return payload;
  } catch (err) {
    console.error('Feedback submission error:', err);
    throw err;
  }
}

export async function handleListFeedbacks({ limit = 100, offset = 0 } = {}) {
  try {
  console.log('Attempting to fetch feedback list...', { limit, offset });
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (offset) params.append('offset', offset);

    const res = await fetch(apiUrl(`/api/feedbacks?${params.toString()}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch feedback list');
      } catch (e) {
        throw new Error(res.statusText || 'Failed to fetch feedback list');
      }
    }

    const payload = await res.json();
    console.log('Feedback list response:', payload);
    return payload;
  } catch (err) {
    console.error('Fetch feedback list error:', err);
    throw err;
  }
}
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
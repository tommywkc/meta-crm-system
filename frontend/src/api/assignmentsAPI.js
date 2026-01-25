import { apiUrl } from './apiBase';

export async function handleListAssignments(eventId) {
  const response = await fetch(apiUrl(`/api/events/${eventId}/assignments`), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to list assignments');
  }
  return await response.json();
}

export async function handleCreateAssignment(data) {
  const response = await fetch(apiUrl('/api/assignments'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to create assignment');
  }
  return await response.json();
}

export async function handleUpdateAssignment(id, data) {
  const response = await fetch(apiUrl(`/api/assignments/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to update assignment');
  }
  return await response.json();
}

export async function handleDeleteAssignment(id) {
  const response = await fetch(apiUrl(`/api/assignments/${id}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to delete assignment');
  }
  return await response.json();
}

import { apiUrl } from './apiBase';

export async function handleListStudentWorks() {
  try {
    const response = await fetch(apiUrl('/api/student-works'), {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const payload = await response.json();
    return payload; // { success: true, works: [] }
  } catch (err) {
    console.error('Fetch student works error:', err);
    throw err;
  }
}

export async function handleCreateStudentWork(formData) {
  try {
    // Note: Do NOT set Content-Type header when sending FormData with fetch.
    // The browser sets it automatically with the correct boundary.
    const response = await fetch(apiUrl('/api/student-works'), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Upload failed');
    }
    return payload; // { success: true, work: {} }
  } catch (err) {
    console.error('Create student work error:', err);
    throw err;
  }
}

export async function handleDeleteStudentWork(workId) {
  try {
    const response = await fetch(apiUrl(`/api/student-works/${workId}`), {
      method: 'DELETE',
      credentials: 'include',
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Delete failed');
    }
    return payload; // { success: true, message: 'Deleted successfully' }
  } catch (err) {
    console.error('Delete student work error:', err);
    throw err;
  }
}

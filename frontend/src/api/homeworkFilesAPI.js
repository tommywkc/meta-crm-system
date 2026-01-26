import { apiUrl } from './apiBase';

export async function handleListHomeworkFiles(eventId, assignmentId) {
  const response = await fetch(apiUrl(`/api/homework/files?eventId=${eventId}&assignmentId=${assignmentId}`), {
    method: 'GET',
    credentials: 'include'
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || '載入功課檔案失敗');
  }
  return payload;
}

export async function handleUploadHomeworkFile(eventId, assignmentId, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('assignmentId', assignmentId);
  formData.append('eventId', eventId);

  const response = await fetch(apiUrl('/api/homework/upload'), {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || '上傳失敗');
  }
  return payload;
}

export async function handleDeleteHomeworkFile(fileName) {
  const encodedName = encodeURIComponent(fileName);
  // Use query param to avoid issues when filename contains slashes that break path params
  const response = await fetch(apiUrl(`/api/homework/file?fileName=${encodedName}`), {
    method: 'DELETE',
    credentials: 'include'
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || '刪除失敗');
  }
  return payload;
}

export async function handleGetAssignmentSubmissions(eventId, assignmentId) {
  const response = await fetch(apiUrl(`/api/homework/admin/submissions?eventId=${eventId}&assignmentId=${assignmentId}`), {
    method: 'GET',
    credentials: 'include'
  });
  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error || '獲取提交清單失敗');
  }
  return payload;
}

export async function handleGradeSubmission({ assignmentId, userId, score, feedback }) {
  const response = await fetch(apiUrl('/api/homework/admin/grade'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ assignmentId, userId, score, feedback })
  });
  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error || '批改失敗');
  }
  return payload;
}

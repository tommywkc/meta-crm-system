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
  const response = await fetch(apiUrl(`/api/homework/file/${encodedName}`), {
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

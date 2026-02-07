import { apiUrl } from './apiBase';

export async function handleUploadCertificate({ eventId, userId, paymentId, file }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('eventId', eventId);
  formData.append('userId', userId);
  if (paymentId) {
    formData.append('paymentId', paymentId);
  }

  const response = await fetch(apiUrl('/api/certificates/upload'), {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || '上傳證書失敗');
  }
  return payload;
}

export async function handleDeleteCertificate({ eventId, userId, paymentId }) {
  const response = await fetch(apiUrl('/api/certificates/delete'), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ eventId, userId, paymentId })
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || '刪除證書失敗');
  }
  return payload;
}

export async function handleListMyCertificateFiles() {
  const response = await fetch(apiUrl('/api/certificates/my-files'), {
    method: 'GET',
    credentials: 'include'
  });
  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error || '載入證書清單失敗');
  }
  return payload;
}

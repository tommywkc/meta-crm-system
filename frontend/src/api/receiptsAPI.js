import { apiUrl } from './apiBase';

export async function handleUploadReceipt({ eventId, userId, paymentId, file }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('eventId', eventId);
  formData.append('userId', userId);
  if (paymentId) {
    formData.append('paymentId', paymentId);
  }

  const response = await fetch(apiUrl('/api/receipts/upload'), {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || '上傳收據失敗');
  }
  return payload;
}

export async function handleListMyReceiptFiles() {
  const response = await fetch(apiUrl('/api/receipts/my-files'), {
    method: 'GET',
    credentials: 'include'
  });
  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error || '載入收據清單失敗');
  }
  return payload;
}

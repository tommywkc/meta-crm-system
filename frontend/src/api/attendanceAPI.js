import { apiUrl } from './apiBase';

// 單一高階函式：送出簽到請求並處理錯誤與日誌
export async function handleScanAttendance(data) {
  try {
    console.log('Attempting to record attendance...', data);

    const response = await fetch(apiUrl('/api/attendance/scan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    // 統一錯誤處理風格，先嘗試讀取後端的 message
    if (!response.ok) {
      let message = '簽到失敗，請稍後再試';
      let errPayload = null;
      try {
        errPayload = await response.json();
        if (errPayload && errPayload.message) {
          message = errPayload.message;
        }
      } catch (e) {
        message = response.statusText || message;
      }

      const error = new Error(message);
      error.status = response.status;
      error.payload = errPayload;
      throw error;
    }

    const payload = await response.json();
    console.log('Attendance scan response:', payload);
    return payload;
  } catch (err) {
    console.error('Attendance scan error:', err);
    throw err;
  }
}

export async function handleQuickRegistrationAttendance(data) {
  try {
    console.log('Attempting to record quick registration attendance...', data);

    const response = await fetch(apiUrl('/api/attendance/scan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let message = '簽到失敗，請稍後再試';
      let errPayload = null;
      try {
        errPayload = await response.json();
        if (errPayload && errPayload.message) {
          message = errPayload.message;
        }
      } catch (e) {
        message = response.statusText || message;
      }

      const error = new Error(message);
      error.status = response.status;
      error.payload = errPayload;
      throw error;
    }

    const payload = await response.json();
    console.log('Quick registration attendance response:', payload);
    return payload;
  } catch (err) {
    console.error('Manual attendance error:', err);
    throw err;
  }
}

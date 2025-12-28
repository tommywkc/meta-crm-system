import { apiUrl } from './apiBase';

// Low-level API call for attendance scan
export async function scanAttendance(data) {
  const response = await fetch(apiUrl('/api/attendance/scan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  // 統一錯誤處理風格，先嘗試讀取後端的 message
  if (!response.ok) {
    let message = '簽到失敗，請稍後再試';
    try {
      const err = await response.json();
      if (err && err.message) {
        message = err.message;
      }
    } catch (e) {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

// High-level handler with log, same style as other *handle* functions
export async function handleScanAttendance(data) {
  try {
    console.log('Attempting to record attendance...', data);
    const payload = await scanAttendance(data);
    console.log('Attendance scan response:', payload);
    return payload;
  } catch (err) {
    console.error('Attendance scan error:', err);
    throw err;
  }
}

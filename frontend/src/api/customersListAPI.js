export async function listUsers(limit, offset) {
  console.log('Fetching customers list from backend');
  const res = await fetch('http://localhost:4000/api/customers', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || 'Failed to fetch customers list');
    } catch (e) {
      throw new Error(res.statusText || 'Failed to fetch customers list');
    }
  }
  return await res.json();
}

export async function handleList(limit, offset) {
  try {
    console.log('Attempting to fetch customers list...');
    const payload = await listUsers(limit, offset);
    console.log('Customers list response:', payload);
    return payload;
  } catch (err) {
    console.error('Fetch customers list error:', err);
    throw err;
  }
}
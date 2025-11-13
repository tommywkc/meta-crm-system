// 取得當前用戶的完整資料（包含 qr_token）
export async function getUserProfile() {
  console.log('Fetching user profile...');
  const res = await fetch('http://localhost:4000/api/user/profile', {
    method: 'GET',
    credentials: 'include', // 讓 cookie 能跨域
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch user profile' }));
    throw new Error(err.message || 'Failed to fetch user profile');
  }
  
  const data = await res.json();
  console.log('User profile fetched:', data);
  return data;
}

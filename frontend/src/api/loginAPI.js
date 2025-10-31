import API_BASE_URL from '../config/api';

export async function login({ username, password }) {
  console.log('Sending login request to backend');
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    } catch (e) {
      throw new Error(res.statusText || 'Login failed');
    }
  }
  return await res.json();
}

// 注意：此函式會呼叫 AuthContext 的 login 方法，並在成功時根據 role 導向。
export async function handleLogin(e, { username, password, navigate, setError, authLogin }) {
  console.log('handleLogin called with:', { username }); // 確認函數被呼叫
  
  if (e && typeof e.preventDefault === 'function') {
    console.log('Preventing default form submission');
    e.preventDefault();
  }
  
  if (setError) setError(null);

  try {
    console.log('Attempting login...');
    // 直接使用 AuthContext 的 login 方法，它會自動更新狀態
    const payload = await authLogin(username, password);
    console.log('Login response:', payload);
    const user = payload.user || payload;

    const role = (user.role || '').toUpperCase();
    if (role === 'ADMIN') {
      navigate('/admin');
    } else if (role === 'SALES' || role === 'LEADER') {
      navigate('/sales');
    } else {
      navigate('/member');
    }

    return user;
  } catch (err) {
    console.error('Login error:', err);
    if (setError) setError(err.message || 'Login failed');
    throw err;
  }
}
export async function login({ username, password }) {
  console.log('Sending login request to backend');
  const res = await fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // allow cookies to be sent across origins
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    // try to read backend error message
    try {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    } catch (e) {
      throw new Error(res.statusText || 'Login failed');
    }
  }
  return await res.json();
}

// Note: this function calls AuthContext's login method and redirects based on role on success.
export async function handleLogin(e, { username, password, navigate, setError, authLogin }) {
  console.log('handleLogin called with:', { username }); // 確認函數被呼叫
  // confirm the function is called
  
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
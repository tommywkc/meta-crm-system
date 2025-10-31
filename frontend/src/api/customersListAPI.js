import API_BASE_URL from '../config/api';

export async function listUsers(limit, offset) {
  console.log('Fetching customers list from backend');
  const res = await fetch(`${API_BASE_URL}/api/customers`, {
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

export async function getUserById(user_id) {
  console.log(`Fetching customer ${user_id} from backend`);
  const res = await fetch(`${API_BASE_URL}/api/customers/${user_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || `Failed to fetch customer ${user_id}`);
    } catch (e) {
      throw new Error(res.statusText || `Failed to fetch customer ${user_id}`);
    }
  }
  return await res.json();
}

export async function handleGetById(user_id) {
  try {
    console.log(`Attempting to fetch customer ${user_id}...`);
    const payload = await getUserById(user_id);
    console.log(`Customer ${user_id} response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch customer ${user_id} error:`, err);
    throw err;
  }
}

export async function updateUserById(user_id, data) {
  console.log(`Updating customer ${user_id} on backend`, data);
  const res = await fetch(`${API_BASE_URL}/api/customers/${user_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || `Failed to update customer ${user_id}`);
    } catch (e) {
      throw new Error(res.statusText || `Failed to update customer ${user_id}`);
    }
  }
  return await res.json();
}

export async function handleUpdateById(user_id, data) {
  try {
    console.log(`Attempting to update customer ${user_id}...`, data);
    const payload = await updateUserById(user_id, data);
    console.log(`Customer ${user_id} update response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Update customer ${user_id} error:`, err);
    throw err;
  }
}
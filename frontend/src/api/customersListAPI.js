import { useNavigate } from 'react-router-dom';

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

export async function getUserById(user_id) {
  console.log(`Fetching customer ${user_id} from backend`);
  const res = await fetch(`http://localhost:4000/api/customers/${user_id}`, {
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
  const res = await fetch(`http://localhost:4000/api/customers/${user_id}`, {
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

export async function createUser(data) {
  console.log('Creating new customer on backend', data);
  const res = await fetch('http://localhost:4000/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create customer');
    } catch (e) {
      throw new Error(res.statusText || 'Failed to create customer');
    }
  }
  return await res.json();
}

export async function handleCreate(data) {
  try {
    console.log('Attempting to create new customer...', data);
    const payload = await createUser(data);
    console.log('New customer creation response:', payload);
    return payload;
  } catch (err) {
    console.error('Create customer error:', err);
    throw err;
  }
}

export async function deleteUserById(user_id) {
  console.log(`Deleting customer ${user_id} on backend`);
  const res = await fetch(`http://localhost:4000/api/customers/${user_id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 讓 cookie 能跨域
  });
  if (!res.ok) {
    // 嘗試讀取後端錯誤訊息
    try {
      const err = await res.json();
      throw new Error(err.message || `Failed to delete customer ${user_id}`);
    } catch (e) {
      throw new Error(res.statusText || `Failed to delete customer ${user_id}`);
    }
  }
  return await res.json();
}

export async function handleDeleteById(user_id) {
  try {
    console.log(`Attempting to delete customer ${user_id}...`);
    const payload = await deleteUserById(user_id);
    console.log(`Customer ${user_id} deletion response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Delete customer ${user_id} error:`, err);
    throw err;
  }
}


//handle get user detail in myqrcode


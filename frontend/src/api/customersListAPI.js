import { useNavigate } from 'react-router-dom';

export async function listUsers(limit = 100, offset = 0, q = '') {
  console.log('Fetching customers list from backend', { limit, offset, q });
  const params = new URLSearchParams();
  params.append('limit', limit);
  params.append('offset', offset);
  if (q && q.trim()) params.append('q', q);
  const res = await fetch(`http://localhost:4000/api/customers?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // allow cookies to be sent across origins
  });
  if (!res.ok) {
    // try to read backend error message
    try {
      const err = await res.json();
      throw new Error(err.message || 'Failed to fetch customers list');
    } catch (e) {
      throw new Error(res.statusText || 'Failed to fetch customers list');
    }
  }
  return await res.json();
}

export async function handleList(limit = 100, offset = 0, q = '') {
  try {
    console.log('Attempting to fetch customers list...', { limit, offset, q });
    const payload = await listUsers(limit, offset, q);
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
    credentials: 'include', // allow cookies to be sent across origins
  });
  if (!res.ok) {
    // try to read backend error message
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
    credentials: 'include', // allow cookies to be sent across origins
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    // try to read backend error message
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
    credentials: 'include', // allow cookies to be sent across origins
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    // try to read backend error message
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
    credentials: 'include', // allow cookies to be sent across origins
  });
  if (!res.ok) {
    // try to read backend error message
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


//handle get user detail in scan
export async function getUserByQRToken(qr_token) { 
  console.log(`Fetching customer detail by QR token from backend`);
  const res = await fetch(`http://localhost:4000/api/customers/scan/${encodeURIComponent(qr_token)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // allow cookies to be sent across origins
  });
  if (!res.ok) {
    // try to read backend error message
    try {
      const err = await res.json();
      throw new Error(err.message || `Failed to fetch customer detail by QR token`);
    } catch (e) {
      throw new Error(res.statusText || `Failed to fetch customer detail by QR token`);
    }
  }
  return await res.json();
}

export async function handleGetUserByQRToken(qr_token) {
  try {
    console.log(`Attempting to fetch customer detail by QR token...`);
    const payload = await getUserByQRToken(qr_token);
    console.log(`Customer detail by QR token response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch customer detail by QR token error:`, err);
    throw err;
  }
}

export async function findUserByRole(role) {
  console.log(`Fetching customers with role ${role} from backend`);
  const res = await fetch(`http://localhost:4000/api/customers/role/${encodeURIComponent(role)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // allow cookies to be sent across origins
  });
  if (!res.ok) {
    // try to read backend error message
    try {
      const err = await res.json();
      throw new Error(err.message || `Failed to fetch customers with role ${role}`);
    } catch (e) {
      throw new Error(res.statusText || `Failed to fetch customers with role ${role}`);
    }
  }
  return await res.json();
}

export async function handleFindUserByRole(role) {
  try {
    console.log(`Attempting to fetch customers with role ${role}...`);
    const payload = await findUserByRole(role);
    console.log(`Customers with role ${role} response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch customers with role ${role} error:`, err);
    throw err;
  }
}

// Fetch customers that match ANY of the provided roles.
// Since backend doesn't expose a multi-role filter route, we fetch the list and filter client-side.
export async function handleFindUsersByRoles(roles = []) {
  try {
    const normalized = (roles || []).map(r => String(r).toUpperCase());
    console.log('Attempting to fetch customers with roles:', normalized);
    const payload = await handleList(1000, 0);
    const all = payload?.customers || [];
    const roleSet = new Set(normalized);
    const filtered = all.filter(u => roleSet.has(String(u.role).toUpperCase()))
                        .sort((a, b) => Number(a.user_id) - Number(b.user_id));
    const result = { customers: filtered };
    console.log('Multi-role filter result count:', result.customers.length);
    return result;
  } catch (err) {
    console.error('Fetch customers by roles error:', err);
    throw err;
  }
}

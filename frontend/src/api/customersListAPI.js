import { apiUrl } from './apiBase';

async function readBackendErrorMessage(res) {
  try {
    const err = await res.json();
    return err && err.message ? err.message : null;
  } catch (e) {
    return null;
  }
}

export async function handleList(limit = 100, offset = 0, q = '', sortBy = 'user_id', sortOrder = 'asc') {
  try {
    console.log('Attempting to fetch customers list...', { limit, offset, q, sortBy, sortOrder }); 
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);
    if (q && q.trim()) params.append('q', q);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    const res = await fetch(apiUrl(`/api/customers?${params.toString()}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
    });
    if (!res.ok) {
      const message = await readBackendErrorMessage(res);
      throw new Error(message || res.statusText || 'Failed to fetch customers list');
    }
    const payload = await res.json();
    console.log('Customers list response:', payload);
    return payload;
  } catch (err) {
    console.error('Fetch customers list error:', err);
    throw err;
  }
}

export async function handleGetById(user_id) {
  try {
    console.log(`Attempting to fetch customer ${user_id}...`);
    const res = await fetch(apiUrl(`/api/customers/${user_id}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
    });
    if (!res.ok) {
      const message = await readBackendErrorMessage(res);
      throw new Error(message || res.statusText || `Failed to fetch customer ${user_id}`);
    }
    const payload = await res.json();
    console.log(`Customer ${user_id} response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch customer ${user_id} error:`, err);
    throw err;
  }
}

export async function handleUpdateById(user_id, data) {
  try {
    console.log(`Attempting to update customer ${user_id}...`, data);
    const res = await fetch(apiUrl(`/api/customers/${user_id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const message = await readBackendErrorMessage(res);
      throw new Error(message || res.statusText || `Failed to update customer ${user_id}`);
    }
    const payload = await res.json();
    console.log(`Customer ${user_id} update response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Update customer ${user_id} error:`, err);
    throw err;
  }
}

export async function handleCreate(data) {
  try {
    console.log('Attempting to create new customer...', data);
    const res = await fetch(apiUrl('/api/customers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const message = await readBackendErrorMessage(res);
      throw new Error(message || res.statusText || 'Failed to create customer');
    }
    const payload = await res.json();
    console.log('New customer creation response:', payload);
    return payload;
  } catch (err) {
    console.error('Create customer error:', err);
    throw err;
  }
}

export async function handleDeleteById(user_id) {
  try {
    console.log(`Attempting to delete customer ${user_id}...`);
    const res = await fetch(apiUrl(`/api/customers/${user_id}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
    });
    if (!res.ok) {
      const message = await readBackendErrorMessage(res);
      throw new Error(message || res.statusText || `Failed to delete customer ${user_id}`);
    }
    const payload = await res.json();
    console.log(`Customer ${user_id} deletion response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Delete customer ${user_id} error:`, err);
    throw err;
  }
}


//handle get user detail in scan
export async function handleGetUserByQRToken(qr_token) {
  try {
    console.log(`Attempting to fetch customer detail by QR token...`);
    const res = await fetch(apiUrl(`/api/customers/scan/${encodeURIComponent(qr_token)}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
    });
    if (!res.ok) {
      const message = await readBackendErrorMessage(res);
      throw new Error(message || res.statusText || `Failed to fetch customer detail by QR token`);
    }
    const payload = await res.json();
    console.log(`Customer detail by QR token response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch customer detail by QR token error:`, err);
    throw err;
  }
}

export async function handleFindUserByRole(role) {
  try {
    console.log(`Attempting to fetch customers with role ${role}...`);
    const res = await fetch(apiUrl(`/api/customers/role/${encodeURIComponent(role)}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow cookies to be sent across origins
    });
    if (!res.ok) {
      const message = await readBackendErrorMessage(res);
      throw new Error(message || res.statusText || `Failed to fetch customers with role ${role}`);
    }
    const payload = await res.json();
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

export async function listPaymentByUserId(user_id, { limit, offset, q, method, status } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (offset) params.append('offset', offset);
  if (q) params.append('q', q);
  if (method) {
    if (Array.isArray(method)) method.forEach(m => params.append('method', m));
    else if (String(method).includes(',')) String(method).split(',').map(s=>s.trim()).forEach(s => params.append('method', s));
    else params.append('method', method);
  }
  if (status) {
    // status can be array or comma-joined
    if (Array.isArray(status)) status.forEach(s => params.append('status', s));
    else if (String(status).includes(',')) String(status).split(',').map(s=>s.trim()).forEach(s => params.append('status', s));
    else params.append('status', status);
  }
  const url = `http://localhost:4000/api/users/${user_id}/payments` + (params.toString() ? `?${params.toString()}` : '');
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
        // Try parse JSON error first
        if (contentType.includes('application/json')) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.message || 'Failed to fetch payments');
        }
        // Fallback to text (likely HTML error/redirect)
        const text = await res.text();
        throw new Error(`Failed to fetch payments: ${res.status} ${res.statusText} ${text.slice(0, 120)}`);
    }
    if (contentType.includes('application/json')) {
        return res.json();
    }
    // Non-JSON successful response (unexpected) — surface a clear error
    const text = await res.text();
    throw new Error(`Unexpected non-JSON response for payments: ${text.slice(0, 120)}`);
}

export async function handleListPaymentByUserId(user_id) {
  try {
    console.log(`Attempting to fetch payments for user ${user_id}...`);
    // allow passing pagination and search options
    const options = arguments[1] || {};
    const payload = await listPaymentByUserId(user_id, options);
    console.log(`Payments for user ${user_id} response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch payments error for user ${user_id}:`, err);
    throw err;
  }
}


export async function listAllPayment(limit, offset, q, method, status) {
  console.log('Fetching payments list from backend');
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (offset) params.append('offset', offset);
  if (q) params.append('q', q);
  if (method) {
    if (Array.isArray(method)) method.forEach(m => params.append('method', m));
    else if (String(method).includes(',')) String(method).split(',').map(s=>s.trim()).forEach(s => params.append('method', s));
    else params.append('method', method);
  }
  if (status) {
    if (Array.isArray(status)) status.forEach(s => params.append('status', s));
    else if (String(status).includes(',')) String(status).split(',').map(s=>s.trim()).forEach(s => params.append('status', s));
    else params.append('status', status);
  }
  const url = 'http://localhost:4000/api/payments' + (params.toString() ? `?${params.toString()}` : '');
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // allow cookies to be sent across origins
  });
  if (!res.ok) {
    // try to read backend error message
    try {
      const err = await res.json();
      throw new Error(err.message || 'Failed to fetch payments list');
    } catch (e) {
      throw new Error(res.statusText || 'Failed to fetch payments list');
    }
  }
  return await res.json();
}

export async function handleListAllPayment(limit, offset) {
  try {
    console.log('Attempting to fetch payments list...');
    const q = arguments[2] || '';
    const method = arguments[3] || undefined;
    const status = arguments[4] || undefined;
    const payload = await listAllPayment(limit, offset, q, method, status);
    console.log('Payments list response:', payload);
    return payload;
  } catch (err) {
    console.error('Fetch payments list error:', err);
    throw err;
  }
}

export async function getPaymentById(payment_id) {
  const res = await fetch(`http://localhost:4000/api/payments/${payment_id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch payment ${payment_id}`);
  }
  return res.json();
}

export async function handleGetPaymentById(payment_id) {
  try {
    console.log(`Attempting to fetch payment ${payment_id}...`);
    const payload = await getPaymentById(payment_id);
    console.log(`Payment ${payment_id} data:`, payload);
    return payload;
  } catch (err) {
    console.error(`Fetch payment error for ${payment_id}:`, err);
    throw err;
  }
}


export async function updatePaymentById(payment_id, data) {
  const response = await fetch(`http://localhost:4000/api/payments/${payment_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // allow cookies to be sent across origins
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    // try to read backend error message
    try {
      const err = await response.json();
      throw new Error(err.message || `Failed to update payment ${payment_id}`);
    } catch (e) {
      throw new Error(response.statusText || `Failed to update payment ${payment_id}`);
    }
  }
  return response.json();
}

export async function handleUpdatePaymentById(payment_id, data) {
  try {
    console.log(`Attempting to update payment ${payment_id} with data:`, data);
    const payload = await updatePaymentById(payment_id, data);
    console.log(`Payment ${payment_id} update response:`, payload);
    return payload;
  } catch (err) {
    console.error(`Update payment error for ${payment_id}:`, err);
    throw err;
  }
}
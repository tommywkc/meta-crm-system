export async function listPaymentByUserId(user_id) {
    const res = await fetch(`http://localhost:4000/api/users/${user_id}/payments`, {
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
        const payload = await listPaymentByUserId(user_id);
        console.log(`Payments for user ${user_id} response:`, payload);
        return payload;
    } catch (err) {
        console.error(`Fetch payments error for user ${user_id}:`, err);
        throw err;
    }
}


export async function listAllPayment(limit, offset) {
  console.log('Fetching payments list from backend');
  const res = await fetch('http://localhost:4000/api/payments', {
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
    const payload = await listAllPayment(limit, offset);
    console.log('Payments list response:', payload);
    return payload;
  } catch (err) {
    console.error('Fetch payments list error:', err);
    throw err;
  }
}
import { apiUrl } from './apiBase';

/**
 * Fetches sales KPI data from the backend.
 * @param {object} params - The parameters for the KPI query.
 * @param {number} params.year - The year to fetch data for.
 * @param {number} params.month - The month to fetch data for.
 * @returns {Promise<object>} The KPI data.
 */
export const fetchSalesKpi = ({ year, month }) => {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  if (month) params.append('month', month);

  return fetch(apiUrl(`/api/kpi/sales?${params.toString()}`), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(async (res) => {
    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch KPI');
      } catch (e) {
        throw new Error(res.statusText || 'Failed to fetch KPI');
      }
    }
    return res.json();
  });
};

/**
 * Fetches admin KPI data (team + per-staff) from the backend.
 * @param {object} params
 * @param {number} params.year
 * @param {number} params.month
 * @param {number} [params.userId]
 */
export const fetchAdminKpi = ({ year, month, userId } = {}) => {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  if (month) params.append('month', month);
  if (userId) params.append('userId', userId);

  const qs = params.toString();
  const url = qs ? `/api/kpi/admin?${qs}` : '/api/kpi/admin';

  return fetch(apiUrl(url), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(async (res) => {
    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch KPI');
      } catch (e) {
        throw new Error(res.statusText || 'Failed to fetch KPI');
      }
    }
    return res.json();
  });
};

/**
 * Saves KPI target for admin (GROUP or PERSONAL).
 * @param {object} payload
 * @param {number} payload.year
 * @param {number} payload.month
 * @param {'GROUP'|'PERSONAL'} payload.scope
 * @param {number} [payload.userId]
 * @param {object} payload.targets
 */
export const saveAdminKpiTarget = ({ year, month, scope, userId, targets } = {}) => {
  return fetch(apiUrl('/api/kpi/admin/targets'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ year, month, scope, userId, targets })
  }).then(async (res) => {
    if (!res.ok) {
      try {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save KPI target');
      } catch (e) {
        throw new Error(res.statusText || 'Failed to save KPI target');
      }
    }
    return res.json();
  });
};

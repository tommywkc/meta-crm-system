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

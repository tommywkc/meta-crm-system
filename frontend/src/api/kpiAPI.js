import { apiRequest } from './apiBase';

// GET /api/kpi/sales?year=&month=
export async function fetchSalesKpi({ year, month } = {}) {
  const params = {};
  if (year) params.year = year;
  if (month) params.month = month;
  // Backend route is mounted under /api, so call /api/kpi/sales
  return apiRequest('/api/kpi/sales', 'GET', null, params);
}

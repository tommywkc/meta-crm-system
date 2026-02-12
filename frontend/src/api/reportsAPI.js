import { apiRequest } from './apiBase';

export const fetchAllCustomers = (params) => apiRequest('/api/reports/all-customers', 'GET', null, params);

export const fetchCosts = (params) => apiRequest('/api/reports/costs', 'GET', null, params);

export const createCost = (payload) => {
	const form = new FormData();
	Object.entries(payload).forEach(([k, v]) => {
		if (v !== undefined && v !== null && v !== '') form.append(k, v);
	});
	return apiRequest('/api/reports/costs', 'POST', form, null, true);
};

export const deleteCost = (id) => apiRequest(`/api/reports/costs/${id}`, 'DELETE');

export const fetchCourseCustomers = (params) => apiRequest('/api/reports/course-customers', 'GET', null, params);

export const fetchUnpaidCustomers = (params) => apiRequest('/api/reports/unpaid-customers', 'GET', null, params);

export const fetchFinancial = (params) => apiRequest('/api/reports/financial', 'GET', null, params);

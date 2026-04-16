import axios from 'axios';
import { apiUrl } from './apiBase';

export const getPromotions = async (eventId, month, general) => {
    const params = new URLSearchParams();
    if (general) params.append('general', 'true');
    else if (eventId) params.append('eventId', eventId);
    if (month) params.append('month', month);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await axios.get(apiUrl(`/api/expenses/promotions${qs}`), { withCredentials: true });
    return response.data;
};

export const createPromotion = async (data) => {
    const response = await axios.post(apiUrl('/api/expenses/promotions'), data, {
        withCredentials: true
    });
    return response.data;
};

export const deletePromotion = async (id) => {
    const response = await axios.delete(apiUrl(`/api/expenses/promotions/${id}`), { withCredentials: true });
    return response.data;
};

export const getMiscExpenses = async (eventId, month, general) => {
    const params = new URLSearchParams();
    if (general) params.append('general', 'true');
    else if (eventId) params.append('eventId', eventId);
    if (month) params.append('month', month);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await axios.get(apiUrl(`/api/expenses/misc${qs}`), { withCredentials: true });
    return response.data;
};

export const createMiscExpense = async (data) => {
    const response = await axios.post(apiUrl('/api/expenses/misc'), data, {
        withCredentials: true
    });
    return response.data;
};

export const deleteMiscExpense = async (id) => {
    const response = await axios.delete(apiUrl(`/api/expenses/misc/${id}`), { withCredentials: true });
    return response.data;
};

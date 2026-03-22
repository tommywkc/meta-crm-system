import axios from 'axios';
import { apiUrl } from './apiBase';

export const getPromotions = async (eventId, month) => {
    let query = '';
    if (eventId) query += `?eventId=${eventId}`;
    if (month) query += query ? `&month=${month}` : `?month=${month}`;
    
    const response = await axios.get(apiUrl(`/api/expenses/promotions${query}`), { withCredentials: true });
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

export const getMiscExpenses = async (eventId, month) => {
    let query = '';
    if (eventId) query += `?eventId=${eventId}`;
    if (month) query += query ? `&month=${month}` : `?month=${month}`;
    
    const response = await axios.get(apiUrl(`/api/expenses/misc${query}`), { withCredentials: true });
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

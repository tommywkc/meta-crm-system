import axios from 'axios';
import { apiUrl } from './apiBase';

export const getPromotions = async (eventId, month) => {
    let query = '';
    if (eventId) query += `?eventId=${eventId}`;
    if (month) query += query ? `&month=${month}` : `?month=${month}`;
    
    const response = await axios.get(apiUrl(`/api/expenses/promotions${query}`), { withCredentials: true });
    return response.data;
};

export const createPromotion = async (formData) => {
    const response = await axios.post(apiUrl('/api/expenses/promotions'), formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
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

export const createMiscExpense = async (formData) => {
    const response = await axios.post(apiUrl('/api/expenses/misc'), formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteMiscExpense = async (id) => {
    const response = await axios.delete(apiUrl(`/api/expenses/misc/${id}`), { withCredentials: true });
    return response.data;
};

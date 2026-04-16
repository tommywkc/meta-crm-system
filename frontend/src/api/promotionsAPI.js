// Service to handle monthly promotions API calls
import axios from 'axios';
import { apiUrl } from './apiBase';

export const getPromotions = async () => {
  const response = await axios.get(apiUrl('/api/reports/promotions'), { withCredentials: true });
  return response.data;
};

export const createPromotion = async (formData) => {
  const response = await axios.post(apiUrl('/api/reports/promotions'), formData, { 
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deletePromotion = async (id) => {
  const response = await axios.delete(apiUrl(`/api/reports/promotions/${id}`), { withCredentials: true });
  return response.data;
};

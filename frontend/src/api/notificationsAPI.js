import { apiUrl } from './apiBase';

// Fetch notifications for the current user
export const getNotifications = async (limit = 50, offset = 0) => {
  try {
    const response = await fetch(apiUrl(`/api/notifications/user?limit=${limit}&offset=${offset}`), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

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

export const getUnreadCount = async () => {
    try {
        const response = await fetch(apiUrl(`/api/notifications/unread-count`), {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Failed to get count");
        return await response.json(); // { count: ... }
    } catch(e) {
        console.error("Unread count error", e);
        return { count: 0 };
    }
}

export const markAllAsRead = async () => {
    try {
        const response = await fetch(apiUrl(`/api/notifications/mark-read-all`), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Failed to mark read");
        return await response.json();
    } catch(e) {
        console.error("Mark read error", e);
        return { success: false };
    }
}

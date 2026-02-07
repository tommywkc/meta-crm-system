import { apiUrl } from "./apiBase";

// List all banners
export const handleListBanners = async () => {
  try {
    const response = await fetch(apiUrl('/api/banners'), {
      method: "GET",
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error("List banners API error", error);
    throw error;
  }
};

// Create (Upload) a new banner
export const handleCreateBanner = async (formData) => {
  try {
    const response = await fetch(apiUrl('/api/banners'), {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Create banner API error", error);
    throw error;
  }
};

// Delete a banner
export const handleDeleteBanner = async (id, blobName) => {
  try {
    // We might need blobName query param if ID is missing or special case
    const url = apiUrl(`/api/banners/${id}?blobName=${encodeURIComponent(blobName || '')}`);
    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error("Delete banner API error", error);
    throw error;
  }
};

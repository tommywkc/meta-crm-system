export const formatForDisplay = (isoString) => {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Map event status from English to Chinese display
export const getStatusDisplay = (status) => {
  const statusMap = {
    'SCHEDULED': '已排程',
    'CANCELLED': '已取消',
    'OPEN': '開放中'
  };
  return statusMap[status] || status;
};

// Map event type from English to Chinese display
export const getTypeDisplay = (type) => {
  const typeMap = {
    'CLASS': '課程',
    'SEMINAR': '講座'
  };
  return typeMap[type] || type;
};
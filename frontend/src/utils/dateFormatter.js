export const formatForDisplay = (isoString) => {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Format ISO datetime with date and time for display
export const formatDateTimeForDisplay = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

// Format ISO datetime to time (HH:mm) only
export const formatTimeForDisplay = (isoString) => {
	if (!isoString) return '';
	const date = new Date(isoString);
	const hh = String(date.getHours()).padStart(2, '0');
	const min = String(date.getMinutes()).padStart(2, '0');
	return `${hh}:${min}`;
};

// Format a Date object into a canonical YYYY-MM-DD key string
export const formatDateKey = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

// Combine date object and time string into ISO datetime string
export const toISODateTime = (dateObj, timeStr) => {
  // dateObj: Date (only date portion used), timeStr: "HH:mm"
  // Returns ISO string in local time (no timezone conversion on backend expected)
  if (!dateObj || !timeStr) return null;
  const [hh, mm] = timeStr.split(':').map((v) => parseInt(v, 10));
  const d = new Date(dateObj);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.toISOString();
};
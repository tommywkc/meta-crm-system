const pad = (value) => String(value).padStart(2, '0');

const buildDateTimeString = (isoString, includeSeconds = false) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  const timePart = includeSeconds ? `${hh}:${min}:${ss}` : `${hh}:${min}`;
  return `${dd}/${mm}/${yyyy} ${timePart}`;
};

export const formatForDisplay = (isoString) => {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  if (Number.isNaN(dateObj.getTime())) return '';
  const dd = pad(dateObj.getDate());
  const mm = pad(dateObj.getMonth() + 1);
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Format ISO datetime with date and time for display
export const formatDateTimeForDisplay = (isoString) => buildDateTimeString(isoString, false);

export const formatDateTimeWithSecondsForDisplay = (isoString) => buildDateTimeString(isoString, true);

// Format ISO datetime to time (HH:mm) only (local time)
export const formatTimeForDisplay = (isoString) => {
	if (!isoString) return '';
	const date = new Date(isoString);
	const hh = String(date.getHours()).padStart(2, '0');
	const min = String(date.getMinutes()).padStart(2, '0');
	return `${hh}:${min}`;
};

// Format ISO datetime to time (HH:mm) in Hong Kong timezone (Asia/Hong_Kong)
export const formatTimeForDisplayInHK = (isoString) => {
  if (!isoString) return '';
  try {
    // Use Intl to format in the Asia/Hong_Kong timezone
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Hong_Kong' };
    // Use en-GB to get 24-hour format consistently
    return new Intl.DateTimeFormat('en-GB', opts).format(new Date(isoString));
  } catch (e) {
    // fallback to local format
    return formatTimeForDisplay(isoString);
  }
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

// Convert a Date (local) into a timezone-neutral ISO-like string (no Z suffix)
export const toLocalISOString = (dateInput) => {
  if (!dateInput) return null;
  const dateObj = dateInput instanceof Date ? new Date(dateInput.getTime()) : new Date(dateInput);
  if (Number.isNaN(dateObj.getTime())) {
    return null;
  }

  const yyyy = dateObj.getFullYear();
  const mm = pad(dateObj.getMonth() + 1);
  const dd = pad(dateObj.getDate());
  const hh = pad(dateObj.getHours());
  const min = pad(dateObj.getMinutes());
  const ss = pad(dateObj.getSeconds());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
};

// Combine date object and time string into a timezone-neutral ISO datetime string
export const toISODateTime = (dateObj, timeStr) => {
  if (!dateObj || !timeStr) return null;

  const [rawHours, rawMinutes] = timeStr.split(':');
  const hours = Number.parseInt(rawHours, 10);
  const minutes = Number.parseInt(rawMinutes, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const localDate = new Date(dateObj);
  localDate.setHours(hours, minutes, 0, 0);

  return toLocalISOString(localDate);
};
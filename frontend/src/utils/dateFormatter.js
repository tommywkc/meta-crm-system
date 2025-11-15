export const formatForDisplay = (isoString) => {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
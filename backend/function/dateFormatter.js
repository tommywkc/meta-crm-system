const formatDateTime = (dbTimeString) => {
  // Time format conversion logic
  if (!dbTimeString) return '';
  const dateObj = new Date(dbTimeString);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const min = String(dateObj.getMinutes()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
};



module.exports = { formatDateTime };
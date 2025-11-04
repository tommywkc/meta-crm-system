function emptyToNull(inputObj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(inputObj)) {
    if (value === '' || value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = value;
    }
  }
  console.log('資料請求:', sanitized);
  return sanitized;
}

module.exports = { emptyToNull };
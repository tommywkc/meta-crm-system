function formatDateTimeHK(value) {
  if (!value) return '未定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`;
}

function formatTimeHK(value) {
  if (!value) return '未定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(d);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.hour}:${map.minute}`;
}

function formatDateHK(value) {
  if (!value) return '未定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatDateTimeRangeHK(startValue, endValue) {
  if (!startValue) return '未定';
  if (!endValue) return formatDateTimeHK(startValue);

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${formatDateTimeHK(startValue)}至${formatDateTimeHK(endValue)}`;
  }

  const startDate = formatDateHK(startValue);
  const endDate = formatDateHK(endValue);
  const startTime = formatTimeHK(startValue);
  const endTime = formatTimeHK(endValue);

  if (startDate === endDate) return `${startDate} ${startTime}-${endTime}`;
  return `${startDate} ${startTime}至${endDate} ${endTime}`;
}

function formatRemainingOnly(remaining) {
  const r = remaining == null ? null : Number(remaining);
  if (Number.isFinite(r)) return `${r}`;
  return '未知';
}

module.exports = {
  formatDateTimeHK,
  formatDateTimeRangeHK,
  formatDateHK,
  formatRemainingOnly,
};

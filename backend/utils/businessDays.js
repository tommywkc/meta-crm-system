const toDateOnly = (value) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const buildHolidaySet = (holidays = []) => {
  const set = new Set();
  holidays.forEach((holiday) => {
    if (!holiday?.holiday_date) return;
    const dateKey = new Date(holiday.holiday_date).toISOString().slice(0, 10);
    set.add(dateKey);
  });
  return set;
};

const countBusinessDays = (startDate, endDate, holidaySet) => {
  if (!startDate || !endDate) return 0;
  if (endDate < startDate) return 0;
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!start || !end) return 0;

  let count = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= end) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;
    const dateKey = cursor.toISOString().slice(0, 10);
    const isHoliday = holidaySet?.has(dateKey);
    if (!isWeekend && !isHoliday) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

const addBusinessDays = (startDate, businessDays, holidaySet) => {
  const date = new Date(startDate.getTime());
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    const dateKey = date.toISOString().slice(0, 10);
    const isHoliday = holidaySet?.has(dateKey);
    if (!isWeekend && !isHoliday) {
      added += 1;
    }
  }
  return date;
};

module.exports = {
  toDateOnly,
  buildHolidaySet,
  countBusinessDays,
  addBusinessDays,
};

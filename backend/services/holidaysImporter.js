const fetch = require('node-fetch');
const { createHoliday, findByDate, updateById } = require('../dao/holidaysDao');

function parseYyyyMmDd(str) {
  if (!str || typeof str !== 'string' || str.length < 8) return null;
  const y = str.slice(0, 4);
  const m = str.slice(4, 6);
  const d = str.slice(6, 8);
  return `${y}-${m}-${d}`; // ISO date string (yyyy-mm-dd)
}

// Fetch HK holidays from 1823 API and upsert into HOLIDAYS table
async function importHolidays({ url = 'https://www.1823.gov.hk/common/ical/tc.json' } = {}) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch holidays failed: ${res.status} ${res.statusText} ${text}`);
  }
  const data = await res.json();

  const vcal = Array.isArray(data?.vcalendar) ? data.vcalendar[0] : null;
  const events = Array.isArray(vcal?.vevent) ? vcal.vevent : [];

  let inserted = 0;
  let updated = 0;
  const errors = [];

  for (const ev of events) {
    try {
      const dtstartVal = Array.isArray(ev?.dtstart) ? ev.dtstart[0] : ev?.dtstart;
      const dtendVal = Array.isArray(ev?.dtend) ? ev.dtend[0] : ev?.dtend;
      const startDate = parseYyyyMmDd(dtstartVal);
      const endDateExclusive = parseYyyyMmDd(dtendVal);
      const name_tc = ev?.summary || '';
      const uid = ev?.uid || null;

      if (!startDate || !name_tc) continue;

      // Determine date(s) to import. If dtend exists and > start, import range [start, dtend - 1 day]
      const datesToInsert = [];
      if (endDateExclusive) {
        const start = new Date(startDate + 'T00:00:00Z');
        const endEx = new Date(endDateExclusive + 'T00:00:00Z');
        for (let d = new Date(start); d < endEx; d.setUTCDate(d.getUTCDate() + 1)) {
          const yyyy = d.getUTCFullYear();
          const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(d.getUTCDate()).padStart(2, '0');
          datesToInsert.push(`${yyyy}-${mm}-${dd}`);
        }
      } else {
        datesToInsert.push(startDate);
      }

      for (const holiday_date of datesToInsert) {
        const existing = await findByDate(holiday_date);
        if (existing) {
          const needUpdate = (existing.name_tc !== name_tc) || (existing.uid !== uid);
          if (needUpdate) {
            await updateById(existing.id, { name_tc, uid });
            updated += 1;
          }
        } else {
          await createHoliday({ holiday_date, name_tc, uid });
          inserted += 1;
        }
      }
    } catch (e) {
      errors.push(e.message || String(e));
    }
  }

  return { total: events.length, inserted, updated, errors };
}

module.exports = { importHolidays };

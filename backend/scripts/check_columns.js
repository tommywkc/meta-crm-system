const { query } = require('../db/pool');

async function run() {
  const eventsRes = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events' ORDER BY ordinal_position");
  console.log('EVENTS columns:', eventsRes.rows.map(r => r.column_name));

  const efRes = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'event_financials' ORDER BY ordinal_position");
  console.log('EVENT_FINANCIALS columns:', efRes.rows.map(r => r.column_name));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });

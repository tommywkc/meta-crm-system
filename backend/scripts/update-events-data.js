const { query } = require('../db/pool');

async function run() {
  console.log('Updating events with test cost data...');
  
  const updates = [
    {
      id: '101',
      promotion: 1500, misc: 500, salary: 8000,
      freight: 200, utilities: 300, telecom: 150, cog: 4000
    },
    {
      id: '102',
      promotion: 1000, misc: 200, salary: 5000,
      freight: 0, utilities: 100, telecom: 50, cog: 1000
    },
    {
      id: '103',
      promotion: 500, misc: 100, salary: 3000,
      freight: 0, utilities: 150, telecom: 80, cog: 2000
    },
    {
      id: '105',
      promotion: 800, misc: 150, salary: 4000,
      freight: 50, utilities: 120, telecom: 60, cog: 1500
    }
  ];

  for (const u of updates) {
    try {
        const sql = `
            UPDATE EVENTS 
            SET promotion_cost = $1, misc_cost = $2, salary_cost = $3,
                freight_cost = $4, utilities_cost = $5, telecom_cost = $6, cog_cost = $7
            WHERE event_id = $8
        `;
        const vals = [u.promotion, u.misc, u.salary, u.freight, u.utilities, u.telecom, u.cog, u.id];
        await query(sql, vals);
        console.log(`Updated event ${u.id}`);
    } catch (e) {
      console.error(`Failed to update event ${u.id}:`, e);
    }
  }

  console.log('Data update complete.');
  process.exit(0);
}

run();

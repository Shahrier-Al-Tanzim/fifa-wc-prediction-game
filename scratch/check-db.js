const { Client } = require('pg');
const DB_URL = "postgresql://postgres.oxdkuhqvzsemitzxrxkj:TYbRBcMBwvvi9H0s@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function check() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const res = await client.query('SELECT "apiMatchId", "homeTeam", "awayTeam", "matchDate" FROM "Match" WHERE "apiMatchId"::int >= 73 AND "apiMatchId"::int <= 88 ORDER BY "apiMatchId"::int');
  res.rows.forEach(r => {
    console.log(`Match ${r.apiMatchId}: ${r.homeTeam} vs ${r.awayTeam} | DB date: ${r.matchDate}`);
  });
  await client.end();
}
check().catch(console.error);

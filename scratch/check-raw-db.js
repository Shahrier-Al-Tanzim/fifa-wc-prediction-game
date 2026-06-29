const { Client } = require('pg');
const DB_URL = "postgresql://postgres.oxdkuhqvzsemitzxrxkj:TYbRBcMBwvvi9H0s@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function checkRaw() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const res = await client.query('SELECT "apiMatchId", "matchDate"::text FROM "Match" WHERE "apiMatchId"::int >= 73 AND "apiMatchId"::int <= 76 ORDER BY "apiMatchId"::int');
  res.rows.forEach(r => {
    console.log(`Match ${r.apiMatchId} raw DB string: ${r.matchDate}`);
  });
  await client.end();
}
checkRaw().catch(console.error);

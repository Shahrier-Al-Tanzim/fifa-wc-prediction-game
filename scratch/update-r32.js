const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = "postgresql://postgres.oxdkuhqvzsemitzxrxkj:TYbRBcMBwvvi9H0s@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function updateR32() {
  // Read the latest fixtures.json
  const fixturesPath = path.resolve(__dirname, '..', 'src', 'data', 'fixtures.json');
  const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
  const r32 = fixtures.filter(f => f.stage === 'round-of-32');

  console.log(`Found ${r32.length} Round of 32 fixtures in fixtures.json:\n`);
  r32.forEach(f => console.log(`  Match ${f.matchNumber}: ${f.homeTeam} vs ${f.awayTeam}`));

  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('\nConnected to database.\n');

  let updated = 0;
  for (const fixture of r32) {
    const matchNumber = String(fixture.matchNumber);

    // Check current value in DB
    const current = await client.query(
      'SELECT "homeTeam", "awayTeam" FROM "Match" WHERE "apiMatchId" = $1',
      [matchNumber]
    );

    if (current.rows.length === 0) {
      console.log(`  ⚠️  Match ${matchNumber} NOT FOUND in database. Skipping.`);
      continue;
    }

    const row = current.rows[0];
    console.log(`  Match ${matchNumber}: DB has "${row.homeTeam}" vs "${row.awayTeam}"  →  updating to "${fixture.homeTeam}" vs "${fixture.awayTeam}"`);

    await client.query(
      'UPDATE "Match" SET "homeTeam" = $1, "awayTeam" = $2, "matchDate" = $3 WHERE "apiMatchId" = $4',
      [fixture.homeTeam, fixture.awayTeam, new Date(fixture.kickoffUtc), matchNumber]
    );
    updated++;
  }

  console.log(`\n✅ Updated ${updated} Round of 32 matches in the database.`);
  await client.end();
}

updateR32().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = "postgresql://postgres.oxdkuhqvzsemitzxrxkj:TYbRBcMBwvvi9H0s@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function fixTimezonesInDb() {
  const fixturesPath = path.resolve(__dirname, '..', 'src', 'data', 'fixtures.json');
  const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));

  console.log("Connecting to Supabase...");
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log("Updating match dates with explicit UTC strings to prevent local timezone offsets...");
  let updated = 0;
  for (const fixture of fixtures) {
    const matchNumber = String(fixture.matchNumber);
    // Use the raw kickoffUtc string from fixtures.json directly instead of a JS Date object
    // This ensures pg sends the UTC string 'YYYY-MM-DDTHH:mm:ssZ' and the DB saves the correct UTC time.
    await client.query(
      'UPDATE "Match" SET "homeTeam" = $1, "awayTeam" = $2, "matchDate" = $3 WHERE "apiMatchId" = $4',
      [fixture.homeTeam, fixture.awayTeam, fixture.kickoffUtc, matchNumber]
    );
    updated++;
  }

  console.log(`\n✅ Successfully updated all ${updated} matches in Supabase with correct UTC timestamps.`);
  await client.end();
}

fixTimezonesInDb().catch(console.error);

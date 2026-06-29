const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_URL = "postgresql://postgres.oxdkuhqvzsemitzxrxkj:TYbRBcMBwvvi9H0s@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function adjustFixturesToBangladeshTime() {
  const fixturesPath = path.resolve(__dirname, '..', 'src', 'data', 'fixtures.json');
  const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));

  console.log("Adjusting fixtures.json date properties to Bangladesh local date (UTC+6)...");

  for (const fixture of fixtures) {
    const originalDate = fixture.date;
    const kickoff = new Date(fixture.kickoffUtc);
    
    // Calculate Bangladesh local date (UTC + 6 hours)
    const bstTime = new Date(kickoff.getTime() + (6 * 60 * 60 * 1000));
    const year = bstTime.getUTCFullYear();
    const month = String(bstTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(bstTime.getUTCDate()).padStart(2, '0');
    const bstDateStr = `${year}-${month}-${day}`;

    if (originalDate !== bstDateStr) {
      console.log(`Match ${fixture.matchNumber}: ${fixture.homeTeam} vs ${fixture.awayTeam} | date: ${originalDate} -> ${bstDateStr} (BST)`);
      fixture.date = bstDateStr;
    }
  }

  // Save updated fixtures.json
  fs.writeFileSync(fixturesPath, JSON.stringify(fixtures, null, 2), 'utf-8');
  console.log("\nSaved updated fixtures.json to disk.");

  // Connect to database to push all match updates
  console.log("\nConnecting to database to push updated fixtures...");
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  let updated = 0;
  for (const fixture of fixtures) {
    const matchNumber = String(fixture.matchNumber);
    const kickoff = new Date(fixture.kickoffUtc);
    
    await client.query(
      'UPDATE "Match" SET "homeTeam" = $1, "awayTeam" = $2, "matchDate" = $3 WHERE "apiMatchId" = $4',
      [fixture.homeTeam, fixture.awayTeam, kickoff, matchNumber]
    );
    updated++;
  }

  console.log(`\n✅ Database update complete. Synced ${updated} matches to Supabase.`);
  await client.end();
}

adjustFixturesToBangladeshTime().catch(console.error);

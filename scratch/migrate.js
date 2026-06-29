const { Client } = require('pg');

// Input your credentials below
const OLD_DB_URL = "postgresql://postgres.oxdkuhqvzsemitzxrxkj:TYbRBcMBwvvi9H0s@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";
const NEW_DB_URL = "postgresql://postgres.mqnyxeuftgxysvgmsigm:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"; // REPLACE [YOUR-PASSWORD] with the real password before running!

async function runMigration() {
  if (NEW_DB_URL.includes('[YOUR-PASSWORD]')) {
    console.error("❌ ERROR: Please replace [YOUR-PASSWORD] with your actual database password in scratch/migrate.js before running.");
    process.exit(1);
  }

  const oldClient = new Client({ connectionString: OLD_DB_URL });
  const newClient = new Client({ connectionString: NEW_DB_URL });

  try {
    console.log("Connecting to source database...");
    await oldClient.connect();
    console.log("Connecting to target database...");
    await newClient.connect();

    console.log("Successfully connected to both databases!\n");

    // Fetch data from source database
    console.log("Fetching data from source...");
    const users = (await oldClient.query('SELECT * FROM "User"')).rows;
    const matches = (await oldClient.query('SELECT * FROM "Match"')).rows;
    const results = (await oldClient.query('SELECT * FROM "Result"')).rows;
    const predictions = (await oldClient.query('SELECT * FROM "Prediction"')).rows;
    const daylocks = (await oldClient.query('SELECT * FROM "DayLock"')).rows;

    console.log(`Fetched:
      - ${users.length} Users
      - ${matches.length} Matches
      - ${results.length} Results
      - ${predictions.length} Predictions
      - ${daylocks.length} DayLocks
    `);

    // Clean target database in reverse dependency order
    console.log("\nCleaning existing data on target database...");
    await newClient.query('DELETE FROM "DayLock"');
    await newClient.query('DELETE FROM "Prediction"');
    await newClient.query('DELETE FROM "Result"');
    await newClient.query('DELETE FROM "Match"');
    await newClient.query('DELETE FROM "User"');
    console.log("Target database cleaned.");

    // Insert Users
    console.log("\nMigrating Users...");
    for (const u of users) {
      await newClient.query(
        `INSERT INTO "User" (id, username, "passwordHash", "isAdmin", points, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.id, u.username, u.passwordHash, u.isAdmin, u.points, u.createdAt, u.updatedAt]
      );
    }
    console.log(`✅ Migrated ${users.length} Users.`);

    // Insert Matches
    console.log("Migrating Matches...");
    for (const m of matches) {
      await newClient.query(
        `INSERT INTO "Match" (id, "apiMatchId", "homeTeam", "awayTeam", "homeScore", "awayScore", status, "matchDate", winner, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [m.id, m.apiMatchId, m.homeTeam, m.awayTeam, m.homeScore, m.awayScore, m.status, m.matchDate, m.winner, m.createdAt, m.updatedAt]
      );
    }
    console.log(`✅ Migrated ${matches.length} Matches.`);

    // Insert Results
    console.log("Migrating Results...");
    for (const r of results) {
      await newClient.query(
        `INSERT INTO "Result" (id, "matchId", winner, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5)`,
        [r.id, r.matchId, r.winner, r.createdAt, r.updatedAt]
      );
    }
    console.log(`✅ Migrated ${results.length} Results.`);

    // Insert Predictions
    console.log("Migrating Predictions...");
    for (const p of predictions) {
      await newClient.query(
        `INSERT INTO "Prediction" (id, "userId", "matchId", "predictedWinner", "isCorrect", "pointsAwarded", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [p.id, p.userId, p.matchId, p.predictedWinner, p.isCorrect, p.pointsAwarded, p.createdAt, p.updatedAt]
      );
    }
    console.log(`✅ Migrated ${predictions.length} Predictions.`);

    // Insert DayLocks
    console.log("Migrating DayLocks...");
    for (const dl of daylocks) {
      await newClient.query(
        `INSERT INTO "DayLock" (id, "userId", "dateStr", "lockedAt") 
         VALUES ($1, $2, $3, $4)`,
        [dl.id, dl.userId, dl.dateStr, dl.lockedAt]
      );
    }
    console.log(`✅ Migrated ${daylocks.length} DayLocks.`);

    console.log("\n🎉 Database migration finished successfully!");

  } catch (error) {
    console.error("❌ Migration failed with error:", error);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

runMigration();

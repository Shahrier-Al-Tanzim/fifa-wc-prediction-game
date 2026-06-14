import { prisma } from "./prisma";

export interface SyncResult {
  source: "api" | "mock";
  updatedCount: number;
  error?: string;
}

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { name: string; shortName?: string; tla?: string };
  awayTeam: { name: string; shortName?: string; tla?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    winner: string | null;
  };
}

// Generates a mock set of World Cup matches for development
function getMockMatches(): FootballDataMatch[] {
  const baseDate = new Date();
  
  // Create 6 realistic matches centered around today's date
  return [
    {
      id: 9001,
      utcDate: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
      status: "FINISHED",
      homeTeam: { name: "United States", tla: "USA" },
      awayTeam: { name: "Mexico", tla: "MEX" },
      score: {
        fullTime: { home: 2, away: 1 },
        winner: "HOME_TEAM",
      },
    },
    {
      id: 9002,
      utcDate: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: "FINISHED",
      homeTeam: { name: "Spain", tla: "ESP" },
      awayTeam: { name: "Germany", tla: "GER" },
      score: {
        fullTime: { home: 1, away: 1 },
        winner: "DRAW",
      },
    },
    {
      id: 9003,
      utcDate: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString(), // Started 2 hours ago
      status: "IN_PLAY",
      homeTeam: { name: "Argentina", tla: "ARG" },
      awayTeam: { name: "Saudi Arabia", tla: "KSA" },
      score: {
        fullTime: { home: 1, away: 2 },
        winner: null,
      },
    },
    {
      id: 9004,
      utcDate: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000).toISOString(), // Starts in 4 hours
      status: "TIMED",
      homeTeam: { name: "France", tla: "FRA" },
      awayTeam: { name: "Australia", tla: "AUS" },
      score: {
        fullTime: { home: null, away: null },
        winner: null,
      },
    },
    {
      id: 9005,
      utcDate: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: "TIMED",
      homeTeam: { name: "Brazil", tla: "BRA" },
      awayTeam: { name: "Serbia", tla: "SRB" },
      score: {
        fullTime: { home: null, away: null },
        winner: null,
      },
    },
    {
      id: 9006,
      utcDate: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days from now
      status: "TIMED",
      homeTeam: { name: "Portugal", tla: "POR" },
      awayTeam: { name: "Ghana", tla: "GHA" },
      score: {
        fullTime: { home: null, away: null },
        winner: null,
      },
    },
  ];
}

export async function syncMatches(): Promise<SyncResult> {
  const apiKey = process.env.FOOTBALL_API_KEY;
  let matches: FootballDataMatch[] = [];
  let source: "api" | "mock" = "mock";

  if (apiKey) {
    try {
      const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
        headers: { "X-Auth-Token": apiKey },
        next: { revalidate: 0 }, // bypass next cache
      });

      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.matches && Array.isArray(data.matches)) {
        matches = data.matches;
        source = "api";
      } else {
        throw new Error("Invalid response format from Football API");
      }
    } catch (err: any) {
      console.warn("Failed to fetch matches from Football API, falling back to mock data. Error:", err.message);
      matches = getMockMatches();
      source = "mock";
    }
  } else {
    console.info("No FOOTBALL_API_KEY environment variable found. Using simulated mock data.");
    matches = getMockMatches();
    source = "mock";
  }

  let updatedCount = 0;

  for (const match of matches) {
    // Determine status: map to database standard (SCHEDULED, LIVE, FINISHED)
    let status = "SCHEDULED";
    if (match.status === "FINISHED") {
      status = "FINISHED";
    } else if (match.status === "IN_PLAY" || match.status === "PAUSED" || match.status === "LIVE") {
      status = "LIVE";
    }

    // Determine winner: map HOME_TEAM -> HOME, AWAY_TEAM -> AWAY, DRAW -> DRAW, else null
    let winner: string | null = null;
    if (match.score.winner === "HOME_TEAM") {
      winner = "HOME";
    } else if (match.score.winner === "AWAY_TEAM") {
      winner = "AWAY";
    } else if (match.score.winner === "DRAW") {
      winner = "DRAW";
    }

    const homeTeam = match.homeTeam.shortName || match.homeTeam.name;
    const awayTeam = match.awayTeam.shortName || match.awayTeam.name;

    try {
      await prisma.match.upsert({
        where: { apiMatchId: String(match.id) },
        update: {
          homeTeam,
          awayTeam,
          homeScore: match.score.fullTime.home,
          awayScore: match.score.fullTime.away,
          status,
          matchDate: new Date(match.utcDate),
          winner,
        },
        create: {
          apiMatchId: String(match.id),
          homeTeam,
          awayTeam,
          homeScore: match.score.fullTime.home,
          awayScore: match.score.fullTime.away,
          status,
          matchDate: new Date(match.utcDate),
          winner,
        },
      });
      updatedCount++;
    } catch (e: any) {
      console.error(`Failed to upsert match ID ${match.id}:`, e.message);
    }
  }

  return { source, updatedCount };
}

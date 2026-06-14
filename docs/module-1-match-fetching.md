# Module 1: Match Fetching & Database Synchronization

This document covers the implementation, design decisions, and testing details for the daily match fixture syncing module.

## 1. Context & Motivation
Predictors must make selections based on real-time and upcoming World Cup fixtures. To ensure these fixtures are correct and updated daily:
- We set up a synchronization route triggered by scheduler intervals.
- To prevent deployment blockers, we support a fully automated local mock fallback when credentials/API keys are missing.

## 2. Tools & Technologies Used
* **Data Provider**: [football-data.org](https://www.football-data.org/) (handles World Cup matches under the ID `/WC/`)
* **Database client**: Prisma client connector to PostgreSQL database
* **Automated Scheduler**: [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

## 3. What Was Done
1. **Sync Core Logic** (`src/lib/football-api.ts`):
   - Implemented a fetch routine connecting to `https://api.football-data.org/v4/competitions/WC/matches`.
   - Included a validation check: if `FOOTBALL_API_KEY` is not present, it logs a notice and loads a simulated set of group stage matches spanning multiple days.
   - Leveraged Prisma `upsert` queries to update schedules or save new matches to prevent duplicates.
2. **Cron Trigger Route** (`src/app/api/cron/sync-matches/route.ts`):
   - Handles GET and POST queries.
   - Includes basic auth validation using `CRON_SECRET` headers if configured in production.
3. **Vercel Integration** (`vercel.json`):
   - Created configuration routing Vercel Scheduler to query `/api/cron/sync-matches` every midnight (`0 0 * * *`).
4. **Dashboard Notice Indicator** (`src/app/dashboard/page.tsx`):
   - The user dashboard displays an amber warning bar if `isMock` is returned by `/api/auth/me`. This warns the user/developer that they are currently using simulated match structures due to a missing `FOOTBALL_API_KEY` environment variable.

## 4. Next Steps
* **Module 2**: Predictions Submission Form (Allowing players to cast predictions, view list of fixtures, and persist user choices in the database).

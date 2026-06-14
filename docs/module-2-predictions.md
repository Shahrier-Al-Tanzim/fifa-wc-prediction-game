# Module 2: Predictions UI & Submission

This document outlines the design, implementation details, and tools used for enabling match predictions in the user dashboard.

## 1. Context & Motivation
To make the application interactive, users must be able to view synced match schedules, select predicted winners, and save them. We also wanted the application to self-initialize with match fixtures without manual CLI commands.

## 2. Tools & Technologies Used
* **Backend Database Queries**: Prisma Client queries for mapping user predictions.
* **Component Framework**: React hooks (`useState`, `useEffect`) in Next.js Client Component.
* **Visual Icons**: `lucide-react` for status signals and UI indicators.

## 3. What Was Done
1. **Self-Seeding Matches Router** (`src/app/api/matches/route.ts`):
   - Fetches matches ordered by kickoff time.
   - If the database contains zero matches, it automatically runs the synchronization logic from `src/lib/football-api.ts`.
   - Incorporates the current logged-in user's existing prediction selection for each match.
2. **Prediction Storage Endpoint** (`src/app/api/predictions/route.ts`):
   - Validates that the request has an authenticated session.
   - Checks if the match has already kicked off. If the kickoff date/time has passed, it denies the request with an HTTP 400 error.
   - Saves or updates (`upsert`) the user's prediction choice in the database.
3. **Interactive Dashboard UI** (`src/app/dashboard/page.tsx`):
   - Fetches match listings and maps state variables.
   - Segregates matches into:
     - **Upcoming Matches**: Scheduled in the future (where predictions are active and clickable).
     - **Past & Active**: Matches currently live or completed (where buttons are locked/disabled and scores are displayed).
   - Shows active prediction choices with highlight colors and saves changes with state updates.
   - Includes real-time error messages (e.g. if trying to predict a match that just started).

## 4. Next Steps
* **Module 3**: Auto-grading match results and updating points on the leaderboard standings.

# Module 2: Daily Predictions Locking

This document covers the implementation, configuration, and user interface design for saving and locking daily prediction selections.

## 1. Context & Motivation
To enforce fair play and allow players to lock in their selections before a tournament day begins, we introduced a "Save & Lock Predictions" feature for each date group. Once a day is locked, those predictions cannot be modified anymore.

## 2. Tools & Technologies Used
* **Prisma & Postgres**: Schema modifications introducing a new `DayLock` relational table mapping users and dates.
* **Component Design**: Next.js App Router API configurations and React client state mapping.
* **Icons**: `lucide-react` status lock signals (`Lock`, `Unlock`).

## 3. What Was Done
1. **Database Table Creation** (`prisma/schema.prisma`):
   - Added the `DayLock` table tracking `userId` and `dateStr` (e.g. `2026-06-14`) with a unique constraint `@@unique([userId, dateStr])`.
2. **Locking API Endpoint** (`src/app/api/predictions/lock-day/route.ts`):
   - Handles authenticated requests specifying a date string.
   - Saves a `DayLock` record in the database for the current user.
3. **Database Guards**:
   - `/api/matches`: Appends `lockedDates` string array listing all dates locked by the logged-in user.
   - `/api/predictions`: Rejects any incoming choice updates if the target match falls on a locked date.
4. **Interactive UI Changes** (`src/app/dashboard/page.tsx`):
   - Displays a lock indicator badge 🔒 next to each date selector button if predictions for that date are locked.
   - Implements a dedicated "Save & Lock Predictions" banner section for open tournament dates.
   - Dynamically disables all predictions buttons inside locked day groups.

## 4. Next Steps
* **Module 3**: Auto-grading match results and updating points on the leaderboard standings.

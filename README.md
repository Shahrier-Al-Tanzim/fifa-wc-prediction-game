# FifaPredict - FIFA World Cup Prediction Game

FifaPredict is a premium, state-of-the-art Next.js web application designed for football enthusiasts to predict matches, lock in predictions daily, and compete on a real-time global leaderboard. It features custom administrator panels for scheduling fixtures, editing team names (to resolve knockout placeholders dynamically), manual score grading, force-unlocking user drafts, and directly overriding standings points.

---

## 🛠️ Technology Stack

- **Core Framework**: [Next.js](https://nextjs.org/) (App Router, Tailwind CSS, Turbopack)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database Engine**: PostgreSQL (Compatible with Supabase, Neon, etc.)
- **Authentication**: JWT-based stateless session cookies (`jose` package)
- **Asset APIs**: [FlagCDN](https://flagcdn.com/) for high-resolution country flag images
- **Icons**: Lucide React

---

## 👥 User Roles & Accessibility

### 1. Regular Users
* **Prediction Sheet**: 
  - View fixtures grouped by tournament date.
  - Predict the outcome of upcoming matches (predict **Home Win** or **Away Win**; Draw selection is disabled).
  - Modify predictions in real time until the kickoff time or until they lock the day.
* **Saving & Locking**: 
  - Permanently lock predictions on a per-day basis. Once locked, predictions for that day cannot be altered.
* **Social / Anti-Cheat Transparency**: 
  - View the community predictions showing what other players predicted for a match. 
  - Other users' predictions are obfuscated (`LOCKED`) until the match kicks off OR the current user locks their own predictions for that day.
* **Leaderboard**: 
  - Real-time leaderboard rankings displaying cumulative scores and points.
* **Scoring Rules**:
  - **Correct prediction**: `+1 point`.
  - **Incorrect prediction**: `0 points`.
  - **Draw outcomes**: Custom `Draw` status badge (`0 points`) instead of "Incorrect".
* **Auto-Scrolling Comfort**:
  - The horizontal date picker bar automatically scrolls the active tournament date button into the center of the viewport upon page mount or tab changes.

### 2. Guest / Anonymous Users
* **Read-Only Dashboard**:
  - Browse Matches, Predictions, and Leaderboard tabs in read-only mode without logging in.
  - Interactive prediction inputs and lock actions are disabled.
* **Privacy Anonymizer**:
  - All player usernames are dynamically anonymized (e.g. `Predictor #5124`) using a deterministic id-hashing utility, protecting users' private identities from public visitors.
  - Shows community prediction selections once matches have kicked off.

### 3. Admin Users
* **Batch Results Entry**:
  - Enter the exact scores (Home vs. Away) for completed fixtures.
  - The winner is automatically evaluated from the input scores, with a manual override option.
* **Fixture Synchronization**:
  - Auto-sync and seed match schedules from external data sources.
* **Leaderboard Points Synchronization**:
  - Trigger global scoring runs to recalculate all user points according to actual match outcomes.
  - **Prediction Re-grading & Reset**: Refactored logic to re-evaluate already graded predictions if results are updated, and automatically reset prediction outcomes back to `null` if a match result is deleted.
  - Features safeguard overrides to protect baseline/manually-seeded starting scores for inactive users.
* **Standings Points Override**:
  - Edit standing scores directly on the leaderboard standings list with an inline input form.
* **Fixture Editor (CMS)**:
  - Separate CMS interface (`/admin/matches`) for administrative controls.
  - Search matches by team names, filter by knockout placeholders (e.g. `Winner Group A`), and update placeholder strings to official country names.
  - Includes flag resolution for dynamically renamed countries.
* **Prediction Unlocks**:
  - Force-unlock any user's locked predictions for any specific day if correction overrides are required.
* **Registration Control**:
  - Securely close registration triggers; the signup API blocks attempts with a `403 Forbidden` error, and the UI replaces the registration link with a "Registrations are currently closed" status.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# PostgreSQL Connection URL
DATABASE_URL="postgresql://username:password@hostname:port/database"

# Secret string used to sign JWT session cookies
JWT_SECRET="your-super-long-secure-random-jwt-secret-key"

# (Optional) Secret key to authorize public triggering of cron/sync endpoints
CRON_SECRET="your-secure-cron-secret-key"
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or later)
- PostgreSQL Instance

### Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Shahrier-Al-Tanzim/fifa-wc-prediction-game.git
   cd fifa-wc-prediction-game
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure the Database Schema**
   Run the Prisma migration to set up the database tables:
   ```bash
   npx prisma db push
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Building for Production**
   ```bash
   npm run build
   ```

---

## 🔗 Architecture & API Endpoints

- `/api/auth/signup` / `/api/auth/login` / `/api/auth/logout`: JWT-based Authentication.
- `/api/matches`: Fetches fixtures and associated user/community predictions.
- `/api/predictions`: Submits predictions for individual fixtures.
- `/api/predictions/lock-day`: Locks draft predictions for a tournament date.
- `/api/admin/matches`: Saves batch results and custom match scores (Admins only).
- `/api/admin/matches/edit`: Renames placeholder team names in brackets (Admins only).
- `/api/admin/predictions/unlock`: Force-unlocks user predictions (Admins only).
- `/api/admin/sync-points`: Recomputes leaderboard scores (Admins only).
- `/api/admin/users/points`: Overwrites standing points for specific users (Admins only).

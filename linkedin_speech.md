# 🎙️ LinkedIn Video Script / Post: CopaPredict

**Theme**: Building a premium, anti-cheat, full-stack FIFA World Cup Prediction Game with Next.js & Prisma.
**Estimated Reading Time**: ~2.5 Minutes (ideal for a video speech or long-form post).

---

### [Introduction]
"Hey everyone! Today, I’m excited to share a project I've been working on: **CopaPredict**, a premium full-stack World Cup Prediction web app built with Next.js, Prisma, and PostgreSQL.

When building a sports prediction game, the design needs to feel alive and immersive, but the backend must be extremely robust—especially when preventing players from cheating by altering their guesses after kickoff or copying their friends' picks. Here is how it works under the hood!"

---

### [User Experience & Features - Page by Page]

#### 🔐 Page 1: Secure Gatekeeping (Authentication)
* Users land on a glassmorphic login/signup page. 
* Under the hood, we use stateless, secure JWT session cookies (`jose`) to manage user context, preventing unauthorized API calls.

#### 📅 Page 2: The Matches Center (Dashboard)
* Once logged in, users see the tournament matches grouped chronologically by date.
* Users can predict a winner (Home Win or Away Win) for any open fixture.
* **Anti-Cheat System**: Predictions are only mutable until kickoff. To lock their scores permanently, users must hit 'Save & Lock Predictions' for that day.
* **Community Transparency**: You can see what others predicted for any match, but to prevent copying, other users' choices are hidden behind a `LOCKED` indicator until the match begins or you lock in your own day's choices.

#### 🏆 Page 3: The Global Leaderboard
* A real-time competitive rankings tab where everyone's points are tallied.
* Features a clean, harmonized color scheme (vibrant emeralds, gold stars, and deep zinc grays) showing exact player point counts.

---

### [Admin Controls & Back-Office - Page by Page]

#### 🛠️ Page 4: Admin Center (Dashboard Overlays)
* If logged in as an administrator, special banners are revealed:
  - **Custom Score Entry**: Admins can batch-enter final scores (e.g. `2-1` or `3-3`) directly into the match cards. The system automatically computes the winner (Home, Away, or Draw) while keeping manual adjustments available.
  - **Points Synchronizer**: With one click, the system grades all predictions in the database and updates user scores on the leaderboard, skipping inactive users to prevent points from resetting to zero.
  - **Force-Unlock Overrides**: If a user locks their predictions by mistake before kickoff, admins can hit a special unlock button next to their name in the community section to clear their lock.

#### 📝 Page 5: Fixtures CMS Editor (`/admin/matches`)
* Knockout rounds begin with placeholder names (e.g., `Winner Group A`).
* We created a dedicated Fixtures Editor CMS page for admins to rename these placeholders dynamically as the matches progress.
* The CMS page features instant search, knockout filters, and groups matches by date. It also automatically fetches high-resolution country flag assets from FlagCDN when official country names are entered.

---

### [The Tech Stack Recap]
"Building this with Next.js App Router and Prisma made database operations and state transitions smooth. By tying predictions to immutable User IDs instead of usernames, user settings remain secure and fully editable without breaking historical data.

Check out the repository, and let me know what features you'd build next!"

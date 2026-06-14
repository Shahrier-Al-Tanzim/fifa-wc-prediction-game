# Module 1: Project Setup and Foundation

This document outlines the setup, decisions, and tools used during the initialization of the FIFA World Cup Prediction App.

## 1. Context & Motivation
To build a smooth, Vercel-ready application, we initialized the project on Next.js 15 using TypeScript, Tailwind CSS, and Prisma with PostgreSQL.
For authentication, we chose a lightweight JWT-based custom session system using cookies. This avoids third-party provider complexity, keeping login/signup fast and free of external constraints for friendly prediction groups.

## 2. Tools & Technologies Used
* **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **ORM & Database**: [Prisma](https://www.prisma.io/) with PostgreSQL database models
* **Session Security**: [jose](https://github.com/panva/jose) (Edge-runtime friendly JWT generation & verification) and [bcryptjs](https://github.com/dcodeIO/bcrypt.js/) (password hashing)
* **Icons**: [lucide-react](https://lucide.react.dev/)

## 3. What Was Done
1. **Repository Setup**: Checked out to git branch `module-1-project-setup`.
2. **Next.js Boilerplate**: Instantiated Next.js using `npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`.
3. **Database Client Configuration**: Installed Prisma, created custom PostgreSQL models for:
   * `User`: holds player stats, passwords, and reference to predictions.
   * `Match`: matches to fetch with team scores and API mappings.
   * `Prediction`: maps users to matches with chosen outcomes and awarded scores.
4. **Custom Auth Backend**:
   * API endpoints: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
   * Secure JSON Web Token configuration using HttpOnly cookies.
5. **Interactive UI Shells**:
   * Landing Page: Dark green theme, introduction cards, session-aware dynamic CTA buttons.
   * Auth Page: A combined toggle interface for fast Login & Registration.
   * Dashboard Shell: Sidebar header showing user points, modular sub-navigation tabs (Predictions and Leaderboard).

## 4. Next Steps (Upcoming Modules)
* **Module 2**: Daily match fixture fetching and schedule database synchronization using an external football API.
* **Module 3**: Creating the prediction forms and submitting outcomes.
* **Module 4**: Scoring calculations, grading scheduler, and live leaderboard display.

import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Trophy, Calendar, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* Navbar */}
      <header className="px-6 h-16 flex items-center border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center gap-2 font-bold text-lg text-white tracking-tight" href="/">
          <Trophy className="h-5 w-5 text-emerald-400" />
          <span>Fifa<span className="text-emerald-400">Predict</span></span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          {session ? (
            <>
              <span className="text-sm text-zinc-400">
                Hi, <span className="text-white font-medium">{session.username}</span>
              </span>
              <Link
                className="text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
                href="/dashboard"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link className="text-sm font-medium text-zinc-400 hover:text-white transition-colors" href="/login">
                Sign In
              </Link>
              <Link
                className="text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
                href="/login"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Hero */}
      <main className="flex-1">
        <section className="w-full py-16 md:py-24 lg:py-32 xl:py-48 px-6 bg-radial from-emerald-950/30 via-zinc-950 to-zinc-950 border-b border-zinc-900">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium tracking-wide animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              <span>FIFA World Cup 2026 Prediction League</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Predict the Winners.<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                Claim Ultimate Glory.
              </span>
            </h1>

            <p className="max-w-xl mx-auto text-zinc-400 text-base sm:text-lg md:text-xl font-light">
              Make predictions on daily World Cup fixtures. Earn points for correct guesses, track your performance, and climb the live friends leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none">
              {session ? (
                <Link
                  className="flex items-center justify-center gap-1.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 transition-all text-sm group"
                  href="/dashboard"
                >
                  Go to Predictions Dashboard
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  className="flex items-center justify-center gap-1.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 transition-all text-sm group"
                  href="/dashboard"
                >
                  Join Prediction League
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="w-full py-16 md:py-24 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Daily Match Updates</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Schedules are synced automatically every single day. Look ahead at upcoming matches and locks in predictions before kick-off.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">1 Point for Win</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Predicting the winner correctly awards 1 point. Draw or defeat yields 0 points. Simple, competitive, and entirely objective.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-fit">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Live Leaderboards</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Points calculate automatically as soon as final results are pulled. Watch standings shift in real-time as the tournament progresses.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center gap-4 text-xs text-zinc-500 max-w-6xl mx-auto">
        <p>© 2026 FIfa Predict. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <span className="text-zinc-600">Built for World Cup 2026</span>
        </nav>
      </footer>
    </div>
  );
}

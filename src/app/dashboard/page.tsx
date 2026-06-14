"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, LogOut, Calendar, Star, Users, Check, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  points: number;
}

interface Match {
  id: string;
  apiMatchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED";
  matchDate: string;
  winner: "HOME" | "AWAY" | "DRAW" | null;
  userPrediction: "HOME" | "AWAY" | "DRAW" | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<"predictions" | "leaderboard">("predictions");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ source: "api" | "mock"; updatedCount: number } | null>(null);

  const handleSyncMatches = async () => {
    setSyncing(true);
    setSubmitError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/matches/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }
      setSyncResult({ source: data.source, updatedCount: data.updatedCount });
      // Fetch matches again to display updated matches
      const matchesRes = await fetch("/api/matches");
      const matchesData = await matchesRes.json();
      if (matchesRes.ok) {
        setMatches(matchesData.matches || []);
      }
      // Auto clear sync result notification after 5 seconds
      setTimeout(() => setSyncResult(null), 5000);
    } catch (err: any) {
      setSubmitError(err.message);
      setTimeout(() => setSubmitError(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch User Status
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      if (!userRes.ok || !userData.user) {
        router.push("/login");
        return;
      }
      setUser(userData.user);
      setIsMock(userData.isMock || false);

      // Fetch Matches & User Predictions
      const matchesRes = await fetch("/api/matches");
      const matchesData = await matchesRes.json();
      if (matchesRes.ok) {
        setMatches(matchesData.matches || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  useEffect(() => {
    if (matches.length > 0) {
      const dates = Array.from(
        new Set(
          matches.map((m) =>
            new Date(m.matchDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          )
        )
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      if (!selectedDate) {
        // Find the first date with upcoming matches (or first overall date)
        const now = new Date();
        const firstUpcomingMatch = matches.find((m) => new Date(m.matchDate) > now);
        if (firstUpcomingMatch) {
          const upcomingDateStr = new Date(firstUpcomingMatch.matchDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          setSelectedDate(upcomingDateStr);
        } else if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      }
    }
  }, [matches, selectedDate]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handlePredict = async (matchId: string, selection: "HOME" | "AWAY" | "DRAW") => {
    setSubmittingId(matchId);
    setSubmitError(null);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, predictedWinner: selection }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      // Update local matches state
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, userPrediction: selection } : m))
      );
    } catch (err: any) {
      setSubmitError(err.message);
      // Automatically clear error after 3 seconds
      setTimeout(() => setSubmitError(null), 3000);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!user) return null;

  // Get unique dates and filter matches by selected date
  const now = new Date();
  const uniqueDates = Array.from(
    new Set(
      matches.map((m) =>
        new Date(m.matchDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      )
    )
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const filteredMatches = matches.filter((m) => {
    const mDate = new Date(m.matchDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return mDate === selectedDate;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 h-16 flex items-center border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <Trophy className="h-5 w-5 text-emerald-400" />
          <span>Copa<span className="text-emerald-400">Predict</span></span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900 px-3.5 py-1.5 rounded-lg border border-zinc-800 text-sm">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-zinc-400">Score:</span>
            <span className="font-bold text-white">{user.points} pts</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Warning Indicator */}
        {isMock && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>
              <strong>Mock Data Active:</strong> `FOOTBALL_API_KEY` is not set. Simulating World Cup match schedules and updates.
            </span>
          </div>
        )}

        {/* Global Error Banner */}
        {submitError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 animate-bounce">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Sync Success Banner */}
        {syncResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>
              <strong>Sync Complete:</strong> Fetched fixtures from <strong>{syncResult.source.toUpperCase()}</strong>. {syncResult.updatedCount} fixtures processed.
            </span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-radial from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user.username}!</h1>
            <p className="text-zinc-400 text-sm mt-1">Get ready to predict daily matches and compete with your friends.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSyncMatches}
              disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin text-emerald-400" : "text-zinc-400"}`} />
              {syncing ? "Syncing..." : "Sync Fixtures"}
            </button>
            <button
              onClick={() => setActiveTab("predictions")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "predictions"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Predictions
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "leaderboard"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              Leaderboard
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "predictions" ? (
          <div className="space-y-6">
            {/* Date Picker Bar */}
            {uniqueDates.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  Select Tournament Date
                </label>
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {uniqueDates.map((dateStr) => {
                    const dateObj = new Date(dateStr);
                    const isSelected = selectedDate === dateStr;
                    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    const dayMonth = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    
                    // count how many matches on this date are finished vs total
                    const matchesOnDate = matches.filter(m => {
                      const mDate = new Date(m.matchDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      });
                      return mDate === dateStr;
                    });
                    const finishedCount = matchesOnDate.filter(m => m.status === "FINISHED").length;
                    const totalCount = matchesOnDate.length;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center min-w-[90px] p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30 scale-105"
                            : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        <span className={`text-[10px] uppercase font-semibold ${isSelected ? "text-emerald-100" : "text-zinc-500"}`}>
                          {weekday}
                        </span>
                        <span className="text-sm font-bold mt-0.5 leading-none">
                          {dayMonth}
                        </span>
                        <span className={`text-[9px] mt-1.5 px-1.5 py-0.5 rounded-full font-medium ${
                          isSelected ? "bg-emerald-500 text-emerald-100" : "bg-zinc-950 text-zinc-500"
                        }`}>
                          {finishedCount}/{totalCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Match List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((match) => {
                const isKickoffPassed = new Date(match.matchDate) <= now;
                const matchTime = new Date(match.matchDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const matchDate = new Date(match.matchDate).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                });

                // Check grading result status
                const isGraded = match.winner !== null;
                const isPredictionCorrect = isGraded && match.userPrediction === match.winner;

                return (
                  <div
                    key={match.id}
                    className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl flex flex-col gap-4 hover:border-zinc-800 transition-all"
                  >
                    {/* Fixture Header */}
                    <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        {matchDate} • {matchTime}
                      </span>
                      {isKickoffPassed ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold uppercase">
                          {match.status === "FINISHED" ? "Finished" : "Live"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold uppercase">
                          Open
                        </span>
                      )}
                    </div>

                    {/* Team Display */}
                    <div className="flex justify-between items-center py-2 px-1">
                      <div className="flex flex-col gap-1 items-start w-5/12">
                        <span className="text-base font-bold text-white tracking-tight leading-tight">
                          {match.homeTeam}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center w-2/12">
                        {match.homeScore !== null && match.awayScore !== null ? (
                          <div className="text-lg font-extrabold text-white tracking-wider bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-black text-sm">VS</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end w-5/12 text-right">
                        <span className="text-base font-bold text-white tracking-tight leading-tight">
                          {match.awayTeam}
                        </span>
                      </div>
                    </div>

                    {/* Prediction Button Controllers */}
                    <div className="space-y-2.5">
                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                        Predict Winner
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          disabled={isKickoffPassed || submittingId === match.id}
                          onClick={() => handlePredict(match.id, "HOME")}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            match.userPrediction === "HOME"
                              ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/30"
                              : isKickoffPassed
                              ? "bg-zinc-950 border-zinc-900 text-zinc-600"
                              : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                          }`}
                        >
                          {match.homeTeam}
                        </button>
                        <button
                          disabled={isKickoffPassed || submittingId === match.id}
                          onClick={() => handlePredict(match.id, "DRAW")}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            match.userPrediction === "DRAW"
                              ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/30"
                              : isKickoffPassed
                              ? "bg-zinc-950 border-zinc-900 text-zinc-600"
                              : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                          }`}
                        >
                          Draw
                        </button>
                        <button
                          disabled={isKickoffPassed || submittingId === match.id}
                          onClick={() => handlePredict(match.id, "AWAY")}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            match.userPrediction === "AWAY"
                              ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/30"
                              : isKickoffPassed
                              ? "bg-zinc-950 border-zinc-900 text-zinc-600"
                              : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                          }`}
                        >
                          {match.awayTeam}
                        </button>
                      </div>
                    </div>

                    {/* Result and Scoring Banner */}
                    {isKickoffPassed && (
                      <div className="mt-1 pt-3 border-t border-zinc-850 flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-medium">
                          Your choice:{" "}
                          <span className="text-zinc-300 font-bold">
                            {match.userPrediction
                              ? match.userPrediction === "HOME"
                                ? match.homeTeam
                                : match.userPrediction === "AWAY"
                                ? match.awayTeam
                                : "Draw"
                              : "None"}
                          </span>
                        </span>

                        {isGraded ? (
                          isPredictionCorrect ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Check className="h-3 w-3" /> +1 Pt (Correct)
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              +0 Pts (Incorrect)
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded">
                            Pending Grade
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {filteredMatches.length === 0 && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 text-sm">
                No fixtures scheduled for this date.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Live Standings
              </h3>
              <span className="text-xs text-zinc-500">Updated automatically</span>
            </div>

            {/* Mock Leaderboard */}
            <div className="divide-y divide-zinc-800">
              <div className="flex items-center justify-between py-3 font-semibold text-xs text-zinc-400">
                <span>Rank & Player</span>
                <span>Points</span>
              </div>

              <div className="flex items-center justify-between py-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-400 w-5">#1</span>
                  <span className="text-white font-medium">{user.username} (You)</span>
                </div>
                <span className="font-semibold text-white">{user.points} pts</span>
              </div>

              <div className="flex items-center justify-between py-4 text-sm opacity-50">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-500 w-5">#2</span>
                  <span className="text-zinc-300">PredictorPro</span>
                </div>
                <span className="font-semibold text-zinc-300">0 pts</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

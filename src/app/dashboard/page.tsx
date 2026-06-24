"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trophy, LogOut, Calendar, Star, Users, Check, Clock, AlertCircle, RefreshCw, Lock, Unlock, Settings, Edit2, X } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  points: number;
  isAdmin: boolean;
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
  otherPredictions?: { username: string; prediction: "HOME" | "AWAY" | "DRAW" }[];
}

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
}

function formatLocalDate(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const countryCodes: Record<string, string> = {
  "Mexico": "mx",
  "South Africa": "za",
  "South Korea": "kr",
  "Czech Republic": "cz",
  "Czechia": "cz",
  "Canada": "ca",
  "Bosnia and Herzegovina": "ba",
  "United States": "us",
  "Paraguay": "py",
  "Scotland": "gb-sct",
  "Haiti": "ht",
  "Australia": "au",
  "Turkey": "tr",
  "Türkiye": "tr",
  "Brazil": "br",
  "Morocco": "ma",
  "Qatar": "qa",
  "Switzerland": "ch",
  "Spain": "es",
  "Cameroon": "cm",
  "Croatia": "hr",
  "Japan": "jp",
  "Italy": "it",
  "New Zealand": "nz",
  "Colombia": "co",
  "Angola": "ao",
  "Argentina": "ar",
  "Algeria": "dz",
  "France": "fr",
  "Senegal": "sn",
  "Iraq": "iq",
  "Norway": "no",
  "Austria": "at",
  "Jordan": "jo",
  "Portugal": "pt",
  "DR Congo": "cd",
  "Congo DR": "cd",
  "Sweden": "se",
  "Uruguay": "uy",
  "Germany": "de",
  "Uzbekistan": "uz",
  "Netherlands": "nl",
  "Ecuador": "ec",
  "Iran": "ir",
  "IR Iran": "ir",
  "Chile": "cl",
  "Panama": "pa",
  "Jamaica": "jm",
  "Tunisia": "tn",
  "Saudi Arabia": "sa",
  "Denmark": "dk",
  "Peru": "pe",
  "Poland": "pl",
  "Belgium": "be",
  "Oman": "om",
  "England": "gb-eng",
  "Nigeria": "ng",
  "Wales": "gb-wls",
  "Ukraine": "ua",
  "Ghana": "gh",
  "Slovakia": "sk",
  "Costa Rica": "cr",
  "Honduras": "hn",
  "Egypt": "eg",
  "Mali": "ml",
  "Venezuela": "ve",
  "Bolivia": "bo",
  "Northern Ireland": "gb-nir",
  "Republic of Ireland": "ie",
  "Ireland": "ie",
  "Greece": "gr",
  "China PR": "cn",
  "China": "cn",
  "Iceland": "is",
  "Finland": "fi",
  "Georgia": "ge",
  "Slovenia": "si",
  "Albania": "al",
  "Romania": "ro",
  "Hungary": "hu",
  "Serbia": "rs",
  "Korea Republic": "kr",
  "Korea DPR": "kp",
  "North Korea": "kp",
  "Ivory Coast": "ci",
  "Côte d'Ivoire": "ci",
  "Cote d'Ivoire": "ci",
  "Zambia": "zm",
  "South Sudan": "ss",
  "El Salvador": "sv",
  "Guatemala": "gt",
  "Trinidad and Tobago": "tt",
  "Curacao": "cw",
  "Curaçao": "cw",
  "Suriname": "sr",
  "Solomon Islands": "sb",
  "Fiji": "fj",
  "New Caledonia": "nc",
  "Tahiti": "pf",
  "Vanuatu": "vu",
  "Papua New Guinea": "pg",
};

function getFlagUrl(countryName: string): string | null {
  const code = countryCodes[countryName.trim()];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}


export default function DashboardPage() {
  const router = useRouter();
  const selectedDateRef = useRef<HTMLButtonElement | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [draftPredictions, setDraftPredictions] = useState<Record<string, "HOME" | "AWAY" | "DRAW">>({});
  const [lockedDates, setLockedDates] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [activeTab, setActiveTab] = useState<"predictions" | "users-predictions" | "leaderboard">("predictions");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ updatedCount: number } | null>(null);
  const [lockingDay, setLockingDay] = useState(false);
  const [draftResults, setDraftResults] = useState<Record<string, "HOME" | "AWAY" | "DRAW">>({});
  const [draftScores, setDraftScores] = useState<Record<string, { homeScore: string; awayScore: string }>>({});
  const [savingResults, setSavingResults] = useState(false);
  const [syncingPoints, setSyncingPoints] = useState(false);
  const [editingPointsUserId, setEditingPointsUserId] = useState<string | null>(null);
  const [editPointsValue, setEditPointsValue] = useState<string>("");
  const [savingPointsUserId, setSavingPointsUserId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      if (userRes.ok && userData.user) {
        setUser(userData.user);
      } else {
        setUser(null);
      }

      const matchesRes = await fetch("/api/matches", {
        headers: { "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone },
      });
      const matchesData = await matchesRes.json();
      if (matchesRes.ok) {
        const fetchedMatches: Match[] = matchesData.matches || [];
        setMatches(fetchedMatches);
        setLockedDates(matchesData.lockedDates || []);

        // Load existing predictions into draft memory
        const drafts: Record<string, "HOME" | "AWAY" | "DRAW"> = {};
        fetchedMatches.forEach((m) => {
          if (m.userPrediction) {
            drafts[m.id] = m.userPrediction;
          }
        });
        setDraftPredictions(drafts);

        // Load existing winners into draft results
        const winners: Record<string, "HOME" | "AWAY" | "DRAW"> = {};
        fetchedMatches.forEach((m) => {
          if (m.winner) {
            winners[m.id] = m.winner as "HOME" | "AWAY" | "DRAW";
          }
        });
        setDraftResults(winners);

        // Load existing scores into draft scores
        const scores: Record<string, { homeScore: string; awayScore: string }> = {};
        fetchedMatches.forEach((m) => {
          scores[m.id] = {
            homeScore: m.homeScore !== null ? String(m.homeScore) : "",
            awayScore: m.awayScore !== null ? String(m.awayScore) : "",
          };
        });
        setDraftScores(scores);
      }

      const leaderboardRes = await fetch("/api/leaderboard");
      const leaderboardData = await leaderboardRes.json();
      if (leaderboardRes.ok) {
        setLeaderboard(leaderboardData.leaderboard || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

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
      setSyncResult({ updatedCount: data.updatedCount });
      await fetchData();
      setTimeout(() => setSyncResult(null), 5000);
    } catch (err: any) {
      setSubmitError(err.message);
      setTimeout(() => setSubmitError(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const savedTab = localStorage.getItem("dashboard_activeTab");
    if (savedTab === "predictions" || savedTab === "users-predictions" || savedTab === "leaderboard") {
      setActiveTab(savedTab);
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem("dashboard_activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedDateRef.current) {
        selectedDateRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (matches.length > 0) {
      const dates = Array.from(
        new Set(
          matches.map((m) => formatLocalDate(new Date(m.matchDate)))
        )
      ).sort();

      if (!selectedDate) {
        const now = new Date();
        const firstUpcomingMatch = matches.find((m) => new Date(m.matchDate) > now);
        if (firstUpcomingMatch) {
          const upcomingDateStr = formatLocalDate(new Date(firstUpcomingMatch.matchDate));
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

  const handlePredictDraft = (matchId: string, selection: "HOME" | "AWAY" | "DRAW") => {
    if (!selectedDate) return;

    if (lockedDates.includes(selectedDate)) {
      setSubmitError("Predictions for this day are locked and cannot be changed.");
      setTimeout(() => setSubmitError(null), 3000);
      return;
    }

    setDraftPredictions((prev) => ({
      ...prev,
      [matchId]: selection,
    }));
  };

  const handleLockDay = async () => {
    if (!selectedDate) return;
    setLockingDay(true);
    setSubmitError(null);

    const dayMatches = matches.filter((m) => formatLocalDate(new Date(m.matchDate)) === selectedDate);

    const predictionsPayload = dayMatches.map((m) => ({
      matchId: m.id,
      predictedWinner: draftPredictions[m.id],
    }));

    try {
      const res = await fetch("/api/predictions/lock-day", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        body: JSON.stringify({ dateStr: selectedDate, predictions: predictionsPayload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Locking predictions failed");
      }

      setLockedDates((prev) => [...prev, selectedDate]);
      await fetchData();
    } catch (err: any) {
      setSubmitError(err.message);
      setTimeout(() => setSubmitError(null), 3000);
    } finally {
      setLockingDay(false);
    }
  };

  const handleScoreChange = (matchId: string, type: "HOME" | "AWAY", value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setDraftScores((prev) => {
      const matchScore = prev[matchId] || { homeScore: "", awayScore: "" };
      const updatedScores = {
        ...prev,
        [matchId]: {
          homeScore: type === "HOME" ? value : matchScore.homeScore,
          awayScore: type === "AWAY" ? value : matchScore.awayScore,
        },
      };

      // Automatically determine winner if both scores are filled
      const current = updatedScores[matchId];
      if (current.homeScore !== "" && current.awayScore !== "") {
        const homeNum = parseInt(current.homeScore, 10);
        const awayNum = parseInt(current.awayScore, 10);
        let winner: "HOME" | "AWAY" | "DRAW";
        if (homeNum > awayNum) {
          winner = "HOME";
        } else if (homeNum < awayNum) {
          winner = "AWAY";
        } else {
          winner = "DRAW";
        }
        setDraftResults((r) => ({ ...r, [matchId]: winner }));
      }

      return updatedScores;
    });
  };

  const handleStartEditPoints = (userId: string, currentPoints: number) => {
    setEditingPointsUserId(userId);
    setEditPointsValue(String(currentPoints));
  };

  const handleCancelEditPoints = () => {
    setEditingPointsUserId(null);
    setEditPointsValue("");
  };

  const handleUpdatePoints = async (targetUserId: string) => {
    const pointsNum = parseInt(editPointsValue, 10);
    if (isNaN(pointsNum)) {
      setSubmitError("Points must be a valid number.");
      setTimeout(() => setSubmitError(null), 3000);
      return;
    }

    setSavingPointsUserId(targetUserId);
    setSubmitError(null);

    try {
      const res = await fetch("/api/admin/users/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: targetUserId, points: pointsNum }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update points");
      }

      // Update locally
      setLeaderboard((prev) =>
        prev.map((item) => (item.id === targetUserId ? { ...item, points: pointsNum } : item))
      );
      if (user && user.id === targetUserId) {
        setUser((prev) => prev ? { ...prev, points: pointsNum } : null);
      }
      handleCancelEditPoints();
    } catch (err: any) {
      setSubmitError(err.message);
      setTimeout(() => setSubmitError(null), 3000);
    } finally {
      setSavingPointsUserId(null);
    }
  };

  const handleSelectAdminResult = (matchId: string, winner: "HOME" | "AWAY" | "DRAW") => {
    setDraftResults((prev) => ({
      ...prev,
      [matchId]: winner,
    }));
  };

  const handleSaveAdminResults = async () => {
    if (!selectedDate) return;
    setSavingResults(true);
    setSubmitError(null);

    const dayMatches = matches.filter((m) => formatLocalDate(new Date(m.matchDate)) === selectedDate);

    const resultsPayload = dayMatches.map((m) => {
      const score = draftScores[m.id];
      const homeScore = score?.homeScore !== "" ? parseInt(score?.homeScore || "0", 10) : 0;
      const awayScore = score?.awayScore !== "" ? parseInt(score?.awayScore || "0", 10) : 0;
      return {
        matchId: m.id,
        winner: draftResults[m.id],
        homeScore,
        awayScore,
      };
    });

    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        body: JSON.stringify({ dateStr: selectedDate, results: resultsPayload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Saving match results failed");
      }

      await fetchData();
    } catch (err: any) {
      setSubmitError(err.message);
      setTimeout(() => setSubmitError(null), 3000);
    } finally {
      setSavingResults(false);
    }
  };

  const handleSyncPoints = async () => {
    setSyncingPoints(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/admin/sync-points", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sync points failed");
      }
      await fetchData();
    } catch (err: any) {
      setSubmitError(err.message);
      setTimeout(() => setSubmitError(null), 3000);
    } finally {
      setSyncingPoints(false);
    }
  };

  const handleUnlockUserPredictions = async (userId: string, username: string) => {
    if (!selectedDate) return;
    if (!window.confirm(`Are you sure you want to unlock and clear all predictions for ${username} on ${selectedDate}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/predictions/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        body: JSON.stringify({ userId, dateStr: selectedDate }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to unlock predictions");
      }

      await fetchData();
    } catch (err: any) {
      setSubmitError(err.message);
      setTimeout(() => setSubmitError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></span>
      </div>
    );
  }

  // Removed session redirect gate for visitors

  const now = new Date();
  const uniqueDates = Array.from(
    new Set(
      matches.map((m) => formatLocalDate(new Date(m.matchDate)))
    )
  ).sort();

  const filteredMatches = matches.filter((m) => formatLocalDate(new Date(m.matchDate)) === selectedDate);

  const selectedDateFormatted = selectedDate;
  const isSelectedDateLocked = selectedDate ? lockedDates.includes(selectedDate) : false;

  const isDayOver = filteredMatches.length > 0 && filteredMatches.every((m) => new Date(m.matchDate) <= now);
  const allMatchesResultsSelected = filteredMatches.length > 0 && filteredMatches.every((m) => {
    const score = draftScores[m.id];
    return score && score.homeScore !== "" && score.awayScore !== "" && draftResults[m.id] !== undefined;
  });

  // Validation: User must select predictions for all matches on the selected day to enable Save
  const allMatchesPredicted = filteredMatches.every((m) => draftPredictions[m.id] !== undefined);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 h-16 flex items-center border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <Trophy className="h-5 w-5 text-emerald-400" />
          <span>Fifa<span className="text-emerald-400">Predict</span></span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
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
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer shadow-md shadow-emerald-950/20"
            >
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Global Error Banner */}
        {submitError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Sync Success Banner */}
        {syncResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>
              <strong>Sync Complete:</strong> Processed {syncResult.updatedCount} fixtures.
            </span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-radial from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user ? user.username : "Guest"}!</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {user 
                ? "Get ready to predict daily matches and compete with your friends."
                : "Create an account to save predictions and join the live leaderboard."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.isAdmin && (
              <button
                onClick={handleSyncMatches}
                disabled={syncing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin text-emerald-400" : "text-zinc-400"}`} />
                {syncing ? "Syncing..." : "Sync Fixtures"}
              </button>
            )}
            {user?.isAdmin && (
              <button
                onClick={handleSyncPoints}
                disabled={syncingPoints}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-amber-600 border border-amber-500 text-white hover:bg-amber-500 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-950/20"
              >
                <RefreshCw className={`h-4 w-4 ${syncingPoints ? "animate-spin text-white" : "text-white"}`} />
                {syncingPoints ? "Syncing Points..." : "Sync Points"}
              </button>
            )}
            {user?.isAdmin && (
              <button
                onClick={() => router.push("/admin/matches")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <Settings className="h-4 w-4 text-zinc-400" />
                Edit Fixtures
              </button>
            )}
            <button
              onClick={() => setActiveTab("predictions")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "predictions"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Matches
            </button>
            <button
              onClick={() => setActiveTab("users-predictions")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "users-predictions"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
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
              <Trophy className="h-4 w-4" />
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
                    const dateObj = new Date(dateStr + "T00:00:00");
                    const isSelected = selectedDate === dateStr;
                    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    const dayMonth = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    
                    const isLocked = lockedDates.includes(dateStr);

                    const matchesOnDate = matches.filter(m => formatLocalDate(new Date(m.matchDate)) === dateStr);
                    const finishedCount = matchesOnDate.filter(m => m.status === "FINISHED").length;
                    const totalCount = matchesOnDate.length;

                    return (
                      <button
                        key={dateStr}
                        ref={isSelected ? selectedDateRef : null}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center min-w-[95px] p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30 scale-105"
                            : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {isLocked && (
                          <span className="absolute top-1 right-1.5 text-[10px] text-amber-400">
                            🔒
                          </span>
                        )}
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

            {/* Lock Day Section */}
            {(!user || !user.isAdmin) && uniqueDates.length > 0 && selectedDate && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {isSelectedDateLocked ? (
                      <>
                        <Lock className="h-4 w-4 text-amber-400" />
                        <span>Day Predictions Saved & Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 text-emerald-400" />
                        <span>Predictions Open {!allMatchesPredicted && <span className="text-xs text-rose-400 italic font-normal">(All matches must be predicted first)</span>}</span>
                      </>
                    )}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    {isSelectedDateLocked
                      ? "Predictions for this day have been permanently saved. They can no longer be edited."
                      : "Fill in predictions for all matches on this day, then click save to permanently lock them."}
                  </p>
                </div>

                {!isSelectedDateLocked && filteredMatches.length > 0 && (
                  <button
                    onClick={handleLockDay}
                    disabled={lockingDay || !allMatchesPredicted || !user}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    {lockingDay ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Save & Lock Predictions</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Admin Lock Results Section */}
            {user?.isAdmin && uniqueDates.length > 0 && selectedDate && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/40 border border-amber-500/10 p-4 rounded-xl gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-amber-400" />
                    <span>Admin Controls - Set Results</span>
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select winners for all matches on this day, then click Save Results to write match outcomes.
                  </p>
                </div>

                {filteredMatches.length > 0 && (
                  <button
                    onClick={handleSaveAdminResults}
                    disabled={savingResults || !allMatchesResultsSelected}
                    className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-950/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    {savingResults ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>Save Match Results</span>
                      </>
                    )}
                  </button>
                )}
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
                
                // Disable predictions if day is locked
                const isMatchLocked = isKickoffPassed || isSelectedDateLocked;
                const currentPrediction = draftPredictions[match.id] || null;

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
                      {isMatchLocked ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold uppercase flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {match.status === "FINISHED" ? "Finished" : "Locked"}
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
                        <div className="flex items-center gap-2">
                          {getFlagUrl(match.homeTeam) && (
                            <img
                              src={getFlagUrl(match.homeTeam)!}
                              alt={`${match.homeTeam} flag`}
                              className="w-6 h-4 object-cover rounded-sm border border-zinc-800 shrink-0"
                            />
                          )}
                          <span className="text-base font-bold text-white tracking-tight leading-tight">
                            {match.homeTeam}
                          </span>
                        </div>
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
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-base font-bold text-white tracking-tight leading-tight">
                            {match.awayTeam}
                          </span>
                          {getFlagUrl(match.awayTeam) && (
                            <img
                              src={getFlagUrl(match.awayTeam)!}
                              alt={`${match.awayTeam} flag`}
                              className="w-6 h-4 object-cover rounded-sm border border-zinc-800 shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prediction Button Controllers */}
                    {(!user || !user?.isAdmin) && (
                      <div className="space-y-2.5">
                        <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                          Predict Winner
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            disabled={isMatchLocked || !user}
                            onClick={() => handlePredictDraft(match.id, "HOME")}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              currentPrediction === "HOME"
                                ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/30"
                                : isMatchLocked || !user
                                ? "bg-zinc-950 border-zinc-900 text-zinc-600"
                                : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                            }`}
                          >
                            {match.homeTeam}
                          </button>
                          <button
                            disabled={isMatchLocked || !user}
                            onClick={() => handlePredictDraft(match.id, "AWAY")}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              currentPrediction === "AWAY"
                                ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/30"
                                : isMatchLocked || !user
                                ? "bg-zinc-950 border-zinc-900 text-zinc-600"
                                : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                            }`}
                          >
                            {match.awayTeam}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin Panel Winner Selector & Scores */}
                    {user?.isAdmin && (
                      <div className="mt-3 pt-3 border-t border-zinc-850 flex flex-col gap-3 bg-zinc-950/40 p-3 rounded-lg border border-amber-500/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Settings className="h-3 w-3" />
                            <span>Admin Control - Set Match Score</span>
                          </span>
                        </div>

                        {/* Score Inputs */}
                        <div className="flex items-center justify-between gap-4 px-1">
                          <div className="flex-1 flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-500 font-semibold">{match.homeTeam} Score</span>
                            <input
                              type="text"
                              value={draftScores[match.id]?.homeScore || ""}
                              onChange={(e) => handleScoreChange(match.id, "HOME", e.target.value)}
                              placeholder="0"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-center focus:border-amber-500 focus:outline-none transition-all text-white font-bold"
                            />
                          </div>
                          
                          <span className="text-zinc-650 font-black text-xs self-end pb-3">-</span>

                          <div className="flex-1 flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-500 font-semibold text-right">{match.awayTeam} Score</span>
                            <input
                              type="text"
                              value={draftScores[match.id]?.awayScore || ""}
                              onChange={(e) => handleScoreChange(match.id, "AWAY", e.target.value)}
                              placeholder="0"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-center focus:border-amber-500 focus:outline-none transition-all text-white font-bold"
                            />
                          </div>
                        </div>

                        {/* Optional Winner manual override/indicator */}
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-[10px] text-zinc-500 font-semibold">Outcome Winner (Auto-set)</span>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleSelectAdminResult(match.id, "HOME")}
                              className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                draftResults[match.id] === "HOME"
                                  ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-950/20"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                              }`}
                            >
                              Home Win
                            </button>
                            <button
                              onClick={() => handleSelectAdminResult(match.id, "DRAW")}
                              className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                draftResults[match.id] === "DRAW"
                                  ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-950/20"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                              }`}
                            >
                              Draw
                            </button>
                            <button
                              onClick={() => handleSelectAdminResult(match.id, "AWAY")}
                              className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                draftResults[match.id] === "AWAY"
                                  ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-950/20"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                              }`}
                            >
                              Away Win
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Result and Scoring Banner */}
                    {(isKickoffPassed || isGraded) && (
                      <div className="mt-1 pt-3 border-t border-zinc-850 flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-medium">
                          Winner:{" "}
                          <span className={`font-bold ${
                            !isGraded
                              ? "text-zinc-400"
                              : match.winner === "DRAW"
                              ? "text-yellow-400"
                              : isPredictionCorrect
                              ? "text-emerald-400"
                              : "text-rose-500"
                          }`}>
                            {!isGraded
                              ? "Pending"
                              : match.winner === "HOME"
                              ? match.homeTeam
                              : match.winner === "AWAY"
                              ? match.awayTeam
                              : "Draw"}
                          </span>
                        </span>

                        {isGraded ? (
                          isPredictionCorrect ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Check className="h-3 w-3" /> +1 Pt (Correct)
                            </span>
                          ) : (
                            <span className={`font-bold px-2 py-0.5 rounded border ${
                              match.winner === "DRAW" || match.userPrediction === "DRAW"
                                ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}>
                              {match.winner === "DRAW" ? "+0 Pts (Draw)" : "+0 Pts (Incorrect)"}
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded">
                            Pending Grade
                          </span>
                        )}
                      </div>
                    )}

                    {/* Other Users' Predictions */}
                    {match.otherPredictions && match.otherPredictions.length > 0 && (
                      <div className="mt-2 pt-2.5 border-t border-zinc-850 flex flex-col gap-1.5">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          Community Predictions
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {match.otherPredictions.map((pred, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] px-2 py-1 rounded-md bg-zinc-950/60 border border-zinc-850 text-zinc-300 flex items-center gap-1"
                            >
                              <span className="font-semibold text-zinc-400">{pred.username}:</span>
                              <span className="text-emerald-400 font-bold">
                                {pred.prediction === "HOME"
                                  ? match.homeTeam
                                  : pred.prediction === "AWAY"
                                  ? match.awayTeam
                                  : "Draw"}
                              </span>
                            </div>
                          ))}
                        </div>
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
        ) : activeTab === "users-predictions" ? (
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
                    const dateObj = new Date(dateStr + "T00:00:00");
                    const isSelected = selectedDate === dateStr;
                    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    const dayMonth = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    
                    const isLocked = lockedDates.includes(dateStr);

                    return (
                      <button
                        key={dateStr}
                        ref={isSelected ? selectedDateRef : null}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center min-w-[95px] p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30 scale-105"
                            : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {isLocked && (
                          <span className="absolute top-1 right-1.5 text-[10px] text-amber-400">
                            🔒
                          </span>
                        )}
                        <span className={`text-[10px] uppercase font-semibold ${isSelected ? "text-emerald-100" : "text-zinc-500"}`}>
                          {weekday}
                        </span>
                        <span className="text-sm font-bold mt-0.5 leading-none">
                          {dayMonth}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Predictions List - Grouped by User */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leaderboard.map((player) => {
                const isSelf = user ? player.id === user.id : false;

                return (
                  <div
                    key={player.id}
                    className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-xl flex flex-col gap-4 hover:border-zinc-850 transition-all"
                  >
                    <h4 className={`text-sm font-bold border-b border-zinc-850 pb-2 flex items-center justify-between ${
                      isSelf ? "text-emerald-400" : "text-white"
                    }`}>
                      <span>{player.username}'s Predictions</span>
                      {isSelf && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-semibold uppercase">You</span>}
                    </h4>

                    <div className="divide-y divide-zinc-850/60">
                      {filteredMatches.map((match) => {
                        const isKickoffPassed = new Date(match.matchDate) <= now;
                        const isDayLocked = selectedDate ? lockedDates.includes(selectedDate) : false;
                        const showOthers = isDayLocked || isKickoffPassed;

                        let predictionText = "No Prediction";
                        
                        if (isSelf) {
                          const pred = draftPredictions[match.id];
                          if (pred === "HOME") predictionText = match.homeTeam;
                          else if (pred === "AWAY") predictionText = match.awayTeam;
                          else if (pred === "DRAW") predictionText = "Draw";
                        } else {
                          if (showOthers && match.otherPredictions) {
                            const otherPred = match.otherPredictions.find(p => p.username === player.username);
                            if (otherPred) {
                              if (otherPred.prediction === "HOME") predictionText = match.homeTeam;
                              else if (otherPred.prediction === "AWAY") predictionText = match.awayTeam;
                              else if (otherPred.prediction === "DRAW") predictionText = "Draw";
                            }
                          } else {
                            predictionText = "🔒 Hidden";
                          }
                        }

                        return (
                          <div key={match.id} className="flex justify-between items-center py-2.5 text-xs">
                            <span className="text-zinc-400 font-medium max-w-[60%] truncate">
                              {match.homeTeam} vs {match.awayTeam}
                            </span>
                            <span className={`font-bold ${
                              predictionText === "🔒 Hidden" 
                                ? "text-amber-400/80" 
                                : predictionText === "No Prediction"
                                ? "text-zinc-650"
                                : "text-emerald-400"
                            }`}>
                              {predictionText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {user?.isAdmin && (
                      <button
                        onClick={() => handleUnlockUserPredictions(player.id, player.username)}
                        className="w-full text-center py-1.5 px-3 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-lg text-xs font-semibold cursor-pointer transition-all mt-3"
                      >
                        Unlock & Clear Predictions
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

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

            {/* Dynamic Leaderboard */}
            <div className="divide-y divide-zinc-800">
              <div className="flex items-center justify-between py-3 font-semibold text-xs text-zinc-400">
                <span>Rank & Player</span>
                <span>Points</span>
              </div>

              {leaderboard.map((item, index) => {
                const isCurrentUser = user ? item.id === user.id : false;
                
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-4 text-sm transition-all ${
                      isCurrentUser ? "bg-emerald-500/5 px-2 -mx-2 rounded-lg" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-bold w-5 ${
                        index === 0
                          ? "text-amber-400"
                          : index === 1
                          ? "text-zinc-300"
                          : index === 2
                          ? "text-amber-600"
                          : "text-zinc-500"
                      }`}>
                        #{index + 1}
                      </span>
                      <span className={`${isCurrentUser ? "text-emerald-400 font-bold" : "text-white font-medium"}`}>
                        {item.username} {isCurrentUser && <span className="text-xs text-zinc-500 font-normal">(You)</span>}
                      </span>
                    </div>
                    {/* Render score editable for admin */}
                    {user?.isAdmin ? (
                      editingPointsUserId === item.id ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editPointsValue}
                            onChange={(e) => {
                              if (e.target.value === "" || /^-?\d+$/.test(e.target.value)) {
                                setEditPointsValue(e.target.value);
                              }
                            }}
                            className="w-16 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-center focus:border-amber-500 focus:outline-none text-white font-bold"
                          />
                          <button
                            onClick={() => handleUpdatePoints(item.id)}
                            disabled={savingPointsUserId !== null}
                            className="p-1 rounded bg-amber-600 hover:bg-amber-500 text-white cursor-pointer transition-all disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={handleCancelEditPoints}
                            disabled={savingPointsUserId !== null}
                            className="p-1 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer transition-all disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className={`font-bold ${isCurrentUser ? "text-emerald-400" : "text-white"}`}>
                            {item.points} pts
                          </span>
                          <button
                            onClick={() => handleStartEditPoints(item.id, item.points)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-amber-500 transition-all cursor-pointer rounded hover:bg-zinc-850"
                            title="Modify Points"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    ) : (
                      <span className={`font-bold ${isCurrentUser ? "text-emerald-400" : "text-white"}`}>
                        {item.points} pts
                      </span>
                    )}
                  </div>
                );
              })}

              {leaderboard.length === 0 && (
                <div className="py-8 text-center text-zinc-500 text-sm">
                  No players found in this league.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

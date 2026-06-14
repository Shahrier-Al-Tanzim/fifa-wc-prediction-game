"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, LogOut, Calendar, Star, Users, ArrowUpRight } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  points: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [activeTab, setActiveTab] = useState<"predictions" | "leaderboard">("predictions");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.user) {
          router.push("/login");
        } else {
          setUser(data.user);
          setIsMock(data.isMock || false);
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
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
        {isMock && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>
              <strong>Mock Data Active:</strong> `FOOTBALL_API_KEY` is not set. Simulating World Cup match schedules and updates.
            </span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-radial from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user.username}!</h1>
            <p className="text-zinc-400 text-sm mt-1">Get ready to predict daily matches and compete with your friends.</p>
          </div>
          <div className="flex gap-2">
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
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 text-emerald-400">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Daily Predictions Coming Soon</h3>
            <p className="text-zinc-400 text-sm max-w-sm">
              We are working on Module 2 & 3. In the next phases, we will integrate match schedule fetching and predictions submission capability.
            </p>
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

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Check, X, Search, Settings, AlertCircle, RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface Match {
  id: string;
  apiMatchId: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  matchDate: string;
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

export default function AdminMatchesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("ALL");

  // Editing state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editHomeTeam, setEditHomeTeam] = useState("");
  const [editAwayTeam, setEditAwayTeam] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      if (!userRes.ok || !userData.user) {
        router.push("/login");
        return;
      }
      if (!userData.user.isAdmin) {
        router.push("/dashboard");
        return;
      }
      setUser(userData.user);

      const matchesRes = await fetch("/api/matches", {
        headers: { "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone },
      });
      const matchesData = await matchesRes.json();
      if (matchesRes.ok) {
        setMatches(matchesData.matches || []);
      }
    } catch (err) {
      console.error("Failed to load admin matches data:", err);
      setError("Failed to fetch matches data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleStartEdit = (match: Match) => {
    setEditingMatchId(match.id);
    setEditHomeTeam(match.homeTeam);
    setEditAwayTeam(match.awayTeam);
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setEditHomeTeam("");
    setEditAwayTeam("");
  };

  const handleSaveEdit = async (matchId: string) => {
    if (!editHomeTeam.trim() || !editAwayTeam.trim()) {
      setError("Team names cannot be empty.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSavingId(matchId);
    setError(null);

    try {
      const res = await fetch("/api/admin/matches/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          homeTeam: editHomeTeam.trim(),
          awayTeam: editAwayTeam.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save match changes");
      }

      // Update match locally
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, homeTeam: editHomeTeam.trim(), awayTeam: editAwayTeam.trim() }
            : m
        )
      );

      handleCancelEdit();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!user || !user.isAdmin) return null;

  // Filter matches based on search term and stage selection
  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedStage === "ALL") {
      return matchesSearch;
    } else if (selectedStage === "KNOCKOUT") {
      // Find matches where team name contains placeholder keywords (winners, place, runner-up, tbd, etc.)
      const isKnockout =
        match.homeTeam.toLowerCase().includes("winner") ||
        match.homeTeam.toLowerCase().includes("third") ||
        match.homeTeam.toLowerCase().includes("runner") ||
        match.homeTeam.toLowerCase().includes("tbd") ||
        match.awayTeam.toLowerCase().includes("winner") ||
        match.awayTeam.toLowerCase().includes("third") ||
        match.awayTeam.toLowerCase().includes("runner") ||
        match.awayTeam.toLowerCase().includes("tbd");
      return matchesSearch && isKnockout;
    } else {
      // Check other stages if they are present in match metadata (group-stage vs others)
      return matchesSearch;
    }
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Header navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 transition-all cursor-pointer text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-500" />
                Fixtures Editor
              </h1>
              <p className="text-xs text-zinc-500">CMS Controls • Modify placeholder team names</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/30 text-red-400 rounded-xl flex items-center gap-2 text-sm animate-pulse">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter controls panel */}
        <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-amber-500 focus:outline-none transition-all placeholder-zinc-600 text-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider shrink-0">
              Filter by:
            </span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:border-amber-500 focus:outline-none transition-all cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Fixtures</option>
              <option value="KNOCKOUT">Placeholder / Knockout Teams Only</option>
            </select>
          </div>
        </div>

        {/* Matches List Grid */}
        <div className="flex flex-col gap-6">
          {(() => {
            // Sort matches chronologically by matchDate
            const sortedMatches = [...filteredMatches].sort(
              (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
            );

            // Group by local date key
            const groups: { dateKey: string; matches: Match[] }[] = [];
            sortedMatches.forEach((match) => {
              const dateKey = new Date(match.matchDate).toLocaleDateString([], {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              let group = groups.find((g) => g.dateKey === dateKey);
              if (!group) {
                group = { dateKey, matches: [] };
                groups.push(group);
              }
              group.matches.push(match);
            });

            if (groups.length === 0) {
              return (
                <div className="bg-zinc-900/20 border border-zinc-850 rounded-2xl p-12 text-center text-zinc-500 text-sm mt-4">
                  No matches match the search or filter criteria.
                </div>
              );
            }

            return groups.map(({ dateKey, matches: dateMatches }) => (
              <div key={dateKey} className="flex flex-col gap-3">
                <div className="flex items-center gap-3 mt-4 first:mt-0">
                  <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {dateKey}
                  </h2>
                  <div className="h-px bg-zinc-850 flex-1"></div>
                </div>

                <div className="flex flex-col gap-3">
                  {dateMatches.map((match) => {
                    const isEditing = editingMatchId === match.id;
                    const matchTimeStr = new Date(match.matchDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={match.id}
                        className="bg-zinc-900/20 border border-zinc-850 p-5 rounded-2xl hover:border-zinc-800 transition-all flex flex-col gap-4"
                      >
                        <div className="flex justify-between items-center text-xs text-zinc-500">
                          <span>Fixture ID: {match.apiMatchId}</span>
                          <span className="font-semibold text-zinc-400">{matchTimeStr}</span>
                        </div>

                        {isEditing ? (
                          /* Editing Mode Form Layout */
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mt-2">
                            <div className="flex-1 flex flex-col sm:flex-row gap-4 items-center">
                              <div className="w-full sm:w-5/12">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 block">
                                  Home Team Name
                                </label>
                                <input
                                  type="text"
                                  value={editHomeTeam}
                                  onChange={(e) => setEditHomeTeam(e.target.value)}
                                  placeholder="Home team country"
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none transition-all text-white font-bold"
                                />
                              </div>
                              
                              <span className="text-zinc-650 font-black text-xs shrink-0 self-end sm:self-center pb-2 sm:pb-0">VS</span>

                              <div className="w-full sm:w-5/12">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 block">
                                  Away Team Name
                                </label>
                                <input
                                  type="text"
                                  value={editAwayTeam}
                                  onChange={(e) => setEditAwayTeam(e.target.value)}
                                  placeholder="Away team country"
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none transition-all text-white font-bold"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                              <button
                                onClick={handleCancelEdit}
                                disabled={savingId !== null}
                                className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 transition-all text-zinc-400 hover:text-white cursor-pointer"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSaveEdit(match.id)}
                                disabled={savingId !== null}
                                className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-950/20 cursor-pointer transition-all flex items-center justify-center"
                                title="Save Changes"
                              >
                                {savingId === match.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Read-Only Mode Display Layout */
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 gap-6 py-1">
                              <div className="flex items-center gap-2 max-w-[45%]">
                                {getFlagUrl(match.homeTeam) && (
                                  <img
                                    src={getFlagUrl(match.homeTeam)!}
                                    alt={`${match.homeTeam} flag`}
                                    className="w-6 h-4 object-cover rounded-sm border border-zinc-800 shrink-0"
                                  />
                                )}
                                <span className="text-base font-bold text-white truncate">
                                  {match.homeTeam}
                                </span>
                              </div>
                              <span className="text-zinc-650 font-black text-xs shrink-0">VS</span>
                              <div className="flex items-center gap-2 justify-end max-w-[45%]">
                                <span className="text-base font-bold text-white truncate text-right">
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

                            <button
                              onClick={() => handleStartEdit(match)}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-850 hover:border-zinc-700 transition-all cursor-pointer shrink-0 self-end sm:self-center"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit Teams
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      </main>
    </div>
  );
}

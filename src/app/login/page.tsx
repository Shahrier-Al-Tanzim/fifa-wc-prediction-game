"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Shield, User, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-emerald-950 via-zinc-950 to-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/60 backdrop-blur-xl p-8 rounded-2xl border border-zinc-800 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="bg-emerald-500/10 p-3 rounded-full border border-emerald-500/20 text-emerald-400 mb-4">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isLogin
              ? "Sign in to update your daily predictions"
              : "Register to join the prediction league"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-xs">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all"
                  placeholder="Enter your nickname"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span className="flex items-center gap-1.5">
                  {isLogin ? "Sign In" : "Sign Up"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            {isLogin ? "New to Fifa Predict? Sign up here" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

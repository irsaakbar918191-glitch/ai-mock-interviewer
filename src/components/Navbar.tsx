"use client";

import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-100">
          <span className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">AI Interviewer</span>
        </Link>

        <div className="flex items-center gap-4">
          {user?.email && <span className="hidden text-sm text-slate-400 sm:block">{user.email}</span>}
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

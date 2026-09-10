"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) router.replace(user ? "/dashboard" : "/login");
  }, [loading, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
        <p className="text-sm text-slate-400 tracking-wider">Verifying active credentials session routing data...</p>
      </div>
    </div>
  );
}

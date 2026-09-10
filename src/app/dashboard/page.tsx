"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, Timestamp } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { PlayCircle, Award, History, BarChart3, Briefcase, Cpu, Loader2, ExternalLink, Trash2 } from "lucide-react";

interface PastInterview {
  id: string;
  jobTitle: string;
  industry: string;
  experience: string;
  status: string;
  createdAt: any;
  averageScore?: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [experience, setExperience] = useState("Mid-Level");
  const [setupLoading, setSetupLoading] = useState(false);

  const [pastInterviews, setPastInterviews] = useState<PastInterview[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [overallMetricScore, setOverallMetricScore] = useState(0);

  const deleteInterview = async (interviewId: string) => {
    if (!window.confirm("Delete this interview history permanently?")) return;

    try {
      await deleteDoc(doc(db, "interviews", interviewId));
      setPastInterviews((records) => {
        const remaining = records.filter((record) => record.id !== interviewId);
        const scored = remaining.filter((record) => (record.averageScore || 0) > 0);
        const total = scored.reduce((sum, record) => sum + (record.averageScore || 0), 0);
        setOverallMetricScore(scored.length > 0 ? Number((total / scored.length).toFixed(1)) : 0);
        return remaining;
      });
    } catch (err) {
      console.error("Failed to delete interview history:", err);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const fetchAnalyticsData = async () => {
      try {
        const q = query(
          collection(db, "interviews"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const records: PastInterview[] = [];
        let runningTotalScore = 0;
        let evaluatedSessionsCount = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const avgScore = data.averageScore || 0;
          if (avgScore > 0) {
            runningTotalScore += avgScore;
            evaluatedSessionsCount++;
          }
          records.push({
            id: doc.id,
            jobTitle: data.jobTitle,
            industry: data.industry,
            experience: data.experience,
            status: data.status,
            createdAt: data.createdAt,
            averageScore: avgScore,
          });
        });

        records.sort((first, second) => {
          const firstTime = first.createdAt?.toMillis?.() ?? 0;
          const secondTime = second.createdAt?.toMillis?.() ?? 0;
          return secondTime - firstTime;
        });

        setPastInterviews(records);
        setOverallMetricScore(evaluatedSessionsCount > 0 ? parseFloat((runningTotalScore / evaluatedSessionsCount).toFixed(1)) : 0);
      } catch (err) {
        console.error("Firestore analytics fetch intercept:", err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [authLoading, user, router]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !jobTitle.trim()) return;
    setSetupLoading(true);

    try {
      const docRef = await addDoc(collection(db, "interviews"), {
        userId: user.uid,
        jobTitle: jobTitle.trim(),
        industry,
        experience,
        status: "ongoing",
        averageScore: 0,
        createdAt: Timestamp.now(),
      });

      router.push(`/interview/${docRef.id}`);
    } catch (err) {
      console.error("Failed creating assessment track document context:", err);
      setSetupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 1 Column: Setup Parameters Panel Form */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold tracking-tight text-slate-100">Setup Assessment Room</h2>
            </div>

            <form onSubmit={handleStartSession} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Job Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Full Stack Engineer"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-all focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Industry Sector</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Technology">Technology & Software</option>
                  <option value="Finance">Finance & Banking</option>
                  <option value="Healthcare">Healthcare & BioTech</option>
                  <option value="Management">Product & Operations Management</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Career Seniority</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Junior">Junior Graduate (0 - 2 Yrs)</option>
                  <option value="Mid-Level">Professional Mid-Tier (2 - 5 Yrs)</option>
                  <option value="Senior">Lead / Architect level (5+ Yrs)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={setupLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/10 hover:opacity-95 transition-all disabled:opacity-40"
              >
                {setupLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><PlayCircle className="h-5 w-5" /> Generate AI Interview</>}
              </button>
            </form>
          </div>

          {/* Quick Micro Analytics widget panel */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950 p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average Capability Rating</span>
              <span className="text-3xl font-extrabold tracking-tight text-slate-100">{overallMetricScore} <span className="text-sm font-normal text-slate-500">/ 10</span></span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Award className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Analytics Track & Structural Graph Lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-xl flex flex-col min-h-[450px]">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800/60 pb-4">
              <History className="h-5 w-5 text-purple-400" />
              <h2 className="text-xl font-bold tracking-tight text-slate-100">Historical Performance Log</h2>
            </div>

            {analyticsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                <span className="text-xs">Parsing previous firestore analytics traces...</span>
              </div>
            ) : pastInterviews.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                <BarChart3 className="h-8 w-8 text-slate-600 mb-3" />
                <h3 className="font-semibold text-slate-400 text-sm">No interviews records logs detected</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">Configure your performance objectives panel on the left to start live benchmarking engine tracing profiles.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {pastInterviews.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/30 transition-all flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-200">{item.jobTitle}</h4>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        <span>{item.experience}</span>
                        <span>•</span>
                        <span>{item.industry}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-slate-500">Score Rating</span>
                        <span
                          className={`text-sm font-extrabold ${(item.averageScore || 0) >= 7
                            ? "text-emerald-400"
                            : (item.averageScore || 0) >= 4
                              ? "text-amber-400"
                              : "text-slate-400"
                            }`}
                        >
                          {item.averageScore ? `${item.averageScore} / 10` : "Pending completion"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/interview/${item.id}`)}
                        title="Open interview review"
                        className="rounded-lg border border-indigo-500/30 p-2 text-indigo-300 transition hover:bg-indigo-500/10"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteInterview(item.id)}
                        title="Delete interview history"
                        className="rounded-lg border border-red-500/30 p-2 text-red-300 transition hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
    
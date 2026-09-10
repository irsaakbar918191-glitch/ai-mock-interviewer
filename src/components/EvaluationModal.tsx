"use client";

import React from "react";
import { X, CheckCircle, BrainCircuit, Activity } from "lucide-react";
import confetti from "canvas-confetti";

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    score: number;
    technicalAccuracy: string;
    clarityFeedback: string;
    improvedAnswerSample: string;
  };
}

export default function EvaluationModal({ isOpen, onClose, data }: EvaluationModalProps) {
  if (!isOpen) return null;

  // Celebrate high calibration metrics benchmarks dynamically
  if (data.score >= 7) {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 p-1.5 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-6">
          <Activity className="h-5 w-5 text-indigo-400" />
          <h3 className="text-xl font-bold tracking-tight text-slate-100">Groq Engine Instant Evaluation</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-1 rounded-xl bg-slate-950 border border-slate-800 p-4 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Calibration Score</span>
            <span className={`text-4xl font-extrabold mt-1 ${data.score >= 7 ? "text-emerald-400" : data.score >= 4 ? "text-amber-400" : "text-red-400"}`}>
              {data.score} <span className="text-xs text-slate-600 font-normal">/10</span>
            </span>
          </div>

          <div className="md:col-span-3 space-y-4 text-sm">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <BrainCircuit className="h-3.5 w-3.5 text-purple-400" /> Technical Accuracy
              </div>
              <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">{data.technicalAccuracy}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Delivery & Clarity Feedback
              </div>
              <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">{data.clarityFeedback}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800/60 pt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Refactored Star Matrix Sample Output</div>
          <p className="text-xs leading-relaxed text-slate-400 italic bg-emerald-950/10 border border-emerald-500/10 p-4 rounded-xl">{data.improvedAnswerSample}</p>
        </div>
      </div>
    </div>
  );
}

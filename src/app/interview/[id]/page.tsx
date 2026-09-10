"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import Navbar from "../../../components/Navbar";
import AudioRecorder from "../../../components/AudioRecorder";
import EvaluationModal from "../../../components/EvaluationModal";
import { Send, ArrowRight, Loader2, MessageSquareCode, ShieldAlert } from "lucide-react";

interface MessageObject {
  role: "system" | "assistant" | "user";
  content: string;
}

interface FeedbackObject {
  score: number;
  technicalAccuracy: string;
  clarityFeedback: string;
  improvedAnswerSample: string;
}

export default function LiveInterviewArena() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [sessionMetadata, setSessionMetadata] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<MessageObject[]>([]);
  const [inputValue, setInputValue] = useState("");
  
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [evaluatingTurn, setEvaluatingTurn] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Modal State Manager
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<FeedbackObject>({ score: 0, technicalAccuracy: "", clarityFeedback: "", improvedAnswerSample: "" });

  useEffect(() => {
    return onAuthStateChanged(getAuth(), setUser);
  }, []);

  useEffect(() => {
    if (!user || !id) return;

    const initializeSession = async () => {
      try {
        const docSnap = await getDoc(doc(db, "interviews", id));
        if (!docSnap.exists() || docSnap.data().userId !== user.uid) {
          alert("Session credentials authentication mismatch.");
          router.push("/dashboard");
          return;
        }
        const sessionData = docSnap.data();
        setSessionMetadata(sessionData);
        setChatHistory(sessionData.chatHistory ?? []);
        const savedFeedback = sessionData.feedbackHistory ?? [];
        if (savedFeedback.length > 0) setLatestFeedback(savedFeedback[savedFeedback.length - 1]);

        if (sessionData.status !== "completed" && !(sessionData.chatHistory?.length > 0)) {
          await triggerNextAIQuestion([]);
        }
      } catch (err) {
        console.error("Interview session initialization failed:", err);
        setQuestionError("Unable to load this interview session. Please try again.");
      }
    };

    initializeSession();
  }, [id, user]);

  const triggerNextAIQuestion = async (currentHistory: MessageObject[]) => {
    setLoadingQuestion(true);
    setQuestionError("");
    try {
      const docSnap = await getDoc(doc(db, "interviews", id));
      const meta = docSnap.data();

      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: meta?.jobTitle,
          industry: meta?.industry,
          experience: meta?.experience,
          chatHistory: currentHistory
        })
      });
      const data = await res.json();

      if (!res.ok || !data.question) {
        throw new Error(data.error || "Unable to generate the next interview question.");
      }
      
      const aiNode: MessageObject = { role: "assistant", content: data.question };
      const nextHistory = [...currentHistory, aiNode];
      setChatHistory(nextHistory);
      await updateDoc(doc(db, "interviews", id), { chatHistory: nextHistory });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to generate the next interview question.";
      console.error("Question generation failed:", err);
      setQuestionError(message);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSendResponse = async (textPayload: string) => {
    const textClean = textPayload.trim();
    if (!textClean || loadingQuestion || evaluatingTurn) return;

    const userNode: MessageObject = { role: "user", content: textClean };
    const updatedHistory = [...chatHistory, userNode];
    setChatHistory(updatedHistory);
    setInputValue("");
    setEvaluatingTurn(true);

    try {
      // Pinpoint context question asked last turn
      const lastQuestionAsked = chatHistory[chatHistory.length - 1]?.content || "";
      
      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: lastQuestionAsked, userAnswer: textClean })
      });
      const evalData = await evalRes.json();

      if (!evalRes.ok || evalData.error) {
        throw new Error(evalData.error || "Unable to evaluate this answer.");
      }

      setLatestFeedback(evalData);
      setIsModalOpen(true);

      const score = Number(evalData.score);
      if (Number.isFinite(score)) {
        await updateDoc(doc(db, "interviews", id), {
          answerScores: arrayUnion(score),
          feedbackHistory: arrayUnion(evalData),
          chatHistory: updatedHistory,
        });
      }

      // Trigger adaptive dynamic question generation tracking logic sequential continuity
      await triggerNextAIQuestion(updatedHistory);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to process your answer.";
      console.error("Answer processing failed:", err);
      setQuestionError(message);
    } finally {
      setEvaluatingTurn(false);
    }
  };

  const handleCompleteInterviewSequence = async () => {
    setIsFinishing(true);
    try {
      const interviewRef = doc(db, "interviews", id);
      const interviewSnapshot = await getDoc(interviewRef);
      const answerScores = (interviewSnapshot.data()?.answerScores ?? []) as number[];
      const averageScore = answerScores.length > 0
        ? Number((answerScores.reduce((total, score) => total + score, 0) / answerScores.length).toFixed(1))
        : 0;

      await updateDoc(interviewRef, {
        status: "completed",
        averageScore,
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
        
        {/* Arena Dynamic Session header title info configuration panel strip */}
        {sessionMetadata && (
          <div className="border border-slate-800 bg-slate-900/20 backdrop-blur-xl p-4 rounded-xl flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Benchmarking Target Active Room</span>
              <h2 className="text-sm font-bold text-slate-200">{sessionMetadata.jobTitle}</h2>
            </div>
            <div className="flex items-center gap-2">
              {sessionMetadata.feedbackHistory?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/10"
                >
                  Review Feedback
                </button>
              )}
              {sessionMetadata.status !== "completed" && (
                <button onClick={handleCompleteInterviewSequence} disabled={isFinishing} className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20">
                  {isFinishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Wrap Up Assessment <ArrowRight className="h-3.5 w-3.5" /></>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Continuous Message streaming terminal view stack */}
        <div className="flex-1 border border-slate-800/80 bg-slate-950/40 rounded-2xl p-4 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-600 border border-indigo-500 text-white" : "bg-slate-900/90 border border-slate-800 text-slate-200"}`}>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 opacity-60">{msg.role === "user" ? "Candidate" : "Groq AI Assessor"}</div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loadingQuestion && (
            <div className="flex justify-start">
              <div className="bg-slate-900/50 border border-slate-800/40 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" /> Groq calibration model adaptively tuning next context tracking node parameter...
              </div>
            </div>
          )}

          {questionError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p>{questionError}</p>
                <button
                  type="button"
                  onClick={() => void triggerNextAIQuestion(chatHistory)}
                  className="mt-2 font-semibold text-red-200 underline underline-offset-4 hover:text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Interaction Bar Footer */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendResponse(inputValue)}
              placeholder="Type your strategic answer sequence data here..."
              disabled={loadingQuestion || evaluatingTurn || sessionMetadata?.status === "completed"}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none"
            />
            
            {sessionMetadata?.status !== "completed" && <AudioRecorder onTranscriptionComplete={(text) => handleSendResponse(text)} />}

            <button onClick={() => handleSendResponse(inputValue)} disabled={loadingQuestion || evaluatingTurn || sessionMetadata?.status === "completed" || !inputValue.trim()} className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 flex-shrink-0 shadow-lg shadow-indigo-500/10">
              {evaluatingTurn ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </main>

      <EvaluationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} data={latestFeedback} />
    </div>
  );
}

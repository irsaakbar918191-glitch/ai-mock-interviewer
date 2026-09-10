"use client";

import React, { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setProcessing(true);
        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          const formData = new FormData();
          formData.append("audio", audioBlob, "interview-answer.webm");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();

          if (!response.ok || !data.text) {
            throw new Error(data.error || "No speech was detected. Please try again.");
          }

          onTranscriptionComplete(data.text);
        } catch (err) {
          console.error("Audio transcription failed:", err);
          setError(err instanceof Error ? err.message : "Audio transcription failed.");
        } finally {
          setProcessing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access failed:", err);
      setError("Microphone access was denied. Allow microphone permission and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {processing ? (
        <button disabled className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-xs font-semibold text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Translating Speech...
        </button>
      ) : isRecording ? (
        <button onClick={stopRecording} className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs font-semibold text-red-400 animate-pulse transition-all">
          <Square className="h-4 w-4" /> Stop Transcribing
        </button>
      ) : (
        <button onClick={startRecording} className="flex items-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-4 py-3 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all">
          <Mic className="h-4 w-4" /> Record Speech
        </button>
      )}
      {error && <p className="basis-full text-xs text-red-400">{error}</p>}
    </div>
  );
}

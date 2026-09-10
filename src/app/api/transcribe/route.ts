import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY configuration." }, { status: 500 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Audio recording was not received." }, { status: 400 });
    }

    const groqForm = new FormData();
    groqForm.append("file", new Blob([await audio.arrayBuffer()], { type: audio.type }), audio.name);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    });
    const data = await response.json();

    if (!response.ok || !data.text?.trim()) {
      console.error("Groq transcription error:", data);
      return NextResponse.json({ error: "No speech was detected. Please speak clearly and try again." }, { status: 502 });
    }

    return NextResponse.json({ text: data.text.trim() });
  } catch (error) {
    console.error("Audio transcription request failed:", error);
    return NextResponse.json({ error: "Audio transcription failed. Please try again." }, { status: 500 });
  }
}
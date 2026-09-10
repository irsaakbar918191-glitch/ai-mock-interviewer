import { NextResponse } from "next/server";
import { groq } from "../../../lib/groq";

export async function POST(request: Request) {
  try {
    const { jobTitle, industry, experience, chatHistory } = await request.json();

    if (!jobTitle || !industry || !experience || !Array.isArray(chatHistory)) {
      return NextResponse.json(
        { error: "Interview details are incomplete." },
        { status: 400 },
      );
    }

    const systemPrompt = {
      role: "system",
      content: `You are an elite corporate technical interviewer assessing a candidate for a ${jobTitle} position in the ${industry} industry (Experience Level: ${experience}).
      
      CRITICAL INSTRUCTIONS:
      1. Analyze the context of the chat history strictly.
      2. If the chat history is empty, greet the user professionally and ask the first highly relevant, core fundamental technical question to start the interview.
      3. If the chat history has data, pick up on gaps, errors, or interesting hooks in the candidate's last answer. Ask ONE adaptive, sharp cross-question or push deeper into their explanation.
      4. Always ask exactly ONE clear, concise question at a time. Do not output anything else. No introductory small talk, no generic feedback within this prompt.`
    };

    const messages = [
      systemPrompt,
      ...(chatHistory.length > 0
        ? chatHistory
        : [{
            role: "user" as const,
            content: "Start the interview by asking the first relevant question now.",
          }]),
    ];

    const response = await groq.chat.completions.create({
      model: "groq/compound-mini",
      messages: messages,
      temperature: 0.6,
      max_tokens: 400,
    });

    const aiQuestion = response.choices[0]?.message?.content?.trim();

    if (!aiQuestion) {
      return NextResponse.json(
        { error: "The AI returned an empty question. Please try again." },
        { status: 502 },
      );
    }
    
    return NextResponse.json({ question: aiQuestion });
  } catch (error: any) {
    console.error("Groq Interview Error:", error);
    return NextResponse.json(
      { error: "Unable to generate a question. Check the Groq API configuration and try again." },
      { status: 500 },
    );
  }
}

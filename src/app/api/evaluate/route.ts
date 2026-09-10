import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { question, userAnswer } = await request.json();

    const analysisPrompt = `
      You are an expert AI Assessment System. Analyze the candidate's user answer against the asked criteria question.
      
      Provide a rigorous evaluation. You MUST respond with a valid JSON object matching this structure:
      {
        "score": <number between 1 and 10>,
        "technicalAccuracy": "<detailed analysis of correctness, missing edge cases, or concept flaws>",
        "clarityFeedback": "<critique of communication style, structuring, and clarity level>",
        "improvedAnswerSample": "<a premium standard response example showing how an expert would structure the answer using the STAR framework>"
      }

      Context Data:
      Question: "${question}"
      Candidate Answer: "${userAnswer}"
    `;

    const response = await groq.chat.completions.create({
      model: "groq/compound-mini",
      messages: [
        {
          role: "system",
          content: "You are a machine-grade evaluation parser that outputs raw, legal JSON data schemas only. Do not wrap code blocks in markdown fences. Output exactly raw schema parameters."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.2, 
    });

    const rawContent = response.choices[0]?.message?.content?.trim() || "";
    const jsonContent = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("The evaluation model returned an invalid JSON response.");
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Groq JSON Evaluation Error:", error);
    return NextResponse.json({ error: "Evaluation mapping failed." }, { status: 500 });
  }
}

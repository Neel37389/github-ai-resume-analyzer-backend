import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { repos } = await req.json();

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json(
        { error: "No repositories provided." },
        { status: 400 },
      );
    }

    const simplifiedRepos = repos.map((repo: any) => ({
      name: repo.name,
      description: repo.description || "",
    }));

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are an expert technical resume reviewer with deep knowledge of resumes that are typically accepted at major technology companies (e.g., FAANG-level companies).

Analyze the following GitHub repositories and evaluate them against FAANG-level resume expectations.

Repositories:
${JSON.stringify(simplifiedRepos, null, 2)}

Return ONLY valid JSON in this exact format:

{
  "overallScore": number (1–10),
  "detectedSkills": string[],
  "resumeBullets": string[],
  "improvements": string[]
}

Rules:
- Output STRICT JSON only.
- Do NOT include explanations.
- Resume bullets must be concise and impact-driven.
- Improvements should be realistic and actionable.
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text = response.output_text;

    if (!text) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.log("OpenAI error:", error);
    return NextResponse.json(
      { error: "Failed to analyze repositories" },
      { status: 500 },
    );
  }
}

import OpenAI from "openai";

const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-resume-builder-five-nu.vercel.app",
];

function getCorsHeaders(origin: string | null) {
  const allowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  try {
    const { repos, targetRole } = await req.json();

    if (
      !repos ||
      !Array.isArray(repos) ||
      repos.length === 0 ||
      !targetRole ||
      !targetRole.trim()
    ) {
      return new Response(
        JSON.stringify({ error: "No repositories or target role provided" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
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

Analyze the following GitHub repositories for a ${targetRole} position and evaluate them against FAANG-level resume expectations.

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

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    if (!text) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("OpenAI error:", error);

    return new Response(
      JSON.stringify({ error: "Failed to analyze repositories." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
}

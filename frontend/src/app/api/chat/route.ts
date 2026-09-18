import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, is_voice } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query string is required" },
        { status: 400 },
      );
    }

    // Configurable backend URL (defaults to local FastAPI port 8000)
    const backendUrl =
      process.env.RAG_API_URL ||
      process.env.NEXT_PUBLIC_RAG_API_URL ||
      "http://127.0.0.1:8000/api/query";

    try {
      const ragResponse = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, is_voice: Boolean(is_voice) }),
        signal: AbortSignal.timeout(90000), // 90s timeout for LLM inference
      });

      if (ragResponse.ok) {
        const data = await ragResponse.json();
        return NextResponse.json({
          answer: data.answer,
          classified_collection: data.classified_collection,
          sources: (data.retrieved_docs || []).map((doc: unknown) => {
            const d = doc as Record<string, unknown>;
            return {
              title:
                d.section_title ||
                d.act_title ||
                d.source_label ||
                "Legal Section",
              act_title: d.act_title,
              section_number: d.section_number,
              snippet: d.text || d.snippet || "",
              score: d.score || 0.95,
            };
          }),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn(`Could not reach backend at ${backendUrl}:`, message);
    }

    // Fallback response if backend service is offline
    return NextResponse.json({
      success: true,
      query,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

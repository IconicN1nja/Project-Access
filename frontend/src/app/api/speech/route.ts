import { NextResponse } from "next/server";

export const OPENAI_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
] as const;

export async function POST(req: Request) {
  try {
    const { text, voice = "nova" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text string is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured in .env file",
          fallback: true,
        },
        { status: 400 }
      );
    }

    const openAiVoice = OPENAI_VOICES.includes(voice.toLowerCase() as any)
      ? voice.toLowerCase()
      : "nova";

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text.substring(0, 4096),
        voice: openAiVoice,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("OpenAI Speech API error:", errText);
      return NextResponse.json(
        { error: `OpenAI Speech API error: ${errText}`, fallback: true },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message, fallback: true }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import OpenAI from "openai";

const client = new OpenAI();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    const transcription = await client.audio.transcriptions.create({
      file: audio,
      model: process.env.TRANSCRIBE_MODEL ?? "whisper-1",
      language: "en",
    });

    return Response.json({ text: transcription.text });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

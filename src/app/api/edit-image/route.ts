import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2, base64ToBuffer, getMimeTypeFromDataUrl } from "@/lib/r2-upload";

export async function POST(req: NextRequest) {
  try {
    const { prompt, input_image, userId } = await req.json();
    if (!prompt || !input_image) {
      return NextResponse.json({ error: "Prompt and input_image are required." }, { status: 400 });
    }

    const apiKey = process.env.FLUX_KONTEXT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Flux Kontext API key." }, { status: 500 });
    }

    const body = {
      prompt,
      input_image,
      output_format: "png",
      safety_tolerance: 2,
    };

    const res = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
      method: "POST",
      headers: {
        "x-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Failed to edit image" }, { status: 500 });
    }

    // Return the polling_url or image if available
    return NextResponse.json({ ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
} 
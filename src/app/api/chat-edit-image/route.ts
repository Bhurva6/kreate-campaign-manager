import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToR2, base64ToBuffer, getMimeTypeFromDataUrl } from "@/lib/r2-upload";

// This API endpoint will edit an image based on text prompts
export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { prompt, input_image, userId } = requestBody;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!input_image) {
      return NextResponse.json({ error: 'Input image is required' }, { status: 400 });
    }

    const apiKey = process.env.FLUX_KONTEXT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Flux Kontext API key." }, { status: 500 });
    }

    const requestPayload = {
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
      body: JSON.stringify(requestPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Failed to edit image" }, { status: 500 });
    }

    // Format the response to match what the chat interface expects
    return NextResponse.json({
      image: data.output_image || data.image,
      result: {
        sample: data.output_image || data.image
      }
    });

  } catch (error) {
    console.error('Error editing image:', error);
    return NextResponse.json({ error: 'Failed to edit image' }, { status: 500 });
  }
}

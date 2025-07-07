import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, sampleCount = 1, aspectRatio = "1:1" } = await req.json();

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }
    if (sampleCount < 1 || sampleCount > 4) {
      return NextResponse.json({ error: "sampleCount must be 1-4." }, { status: 400 });
    }

    // Get auth token (from env or request header)
    const accessToken = process.env.GCLOUD_ACCESS_TOKEN || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      return NextResponse.json({ error: "Missing Google Cloud access token." }, { status: 401 });
    }

    // Google Cloud/Vertex AI config
    const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
    const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    const MODEL_VERSION = "imagen-4.0-generate-preview-06-06";

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_VERSION}:predict`;

    // Build request body
    const body = {
      instances: [{ prompt }],
      parameters: {
        sampleCount,
        aspectRatio,
      },
    };

    // Call Vertex AI
    const vertexRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!vertexRes.ok) {
      const error = await vertexRes.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await vertexRes.json();

    // Convert base64 to data URLs for frontend
    const images = (data.predictions || []).map((pred: any) => ({
      url: `data:${pred.mimeType};base64,${pred.bytesBase64Encoded}`,
      prompt: pred.prompt,
    }));

    return NextResponse.json({ images });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
} 
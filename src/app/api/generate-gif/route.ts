import { NextRequest, NextResponse } from "next/server";
// import {
//   uploadMultipleImagesToR2,
//   base64ToBuffer,
// } from "@/lib/r2-upload";
import { tokenManager } from "@/lib/google-auth";
// import { randomUUID } from "crypto";

const PROJECT_ID = "cobalt-mind-422108";
const LOCATION_ID = "us-central1";
const API_ENDPOINT = "us-central1-aiplatform.googleapis.com";
const MODEL_ID = "veo-3.1-generate-preview";

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      aspectRatio = "16:9",
      sampleCount = 4,
      durationSeconds = "6",
      personGeneration = "allow_all",
      addWatermark = true,
      includeRaiReason = true,
      generateAudio = true,
      resolution = "720p",
    } = await req.json();

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          error: "Prompt is required",
          details: "A text prompt is required to generate a video.",
        },
        { status: 400 }
      );
    }

    if (sampleCount < 1 || sampleCount > 4) {
      return NextResponse.json(
        {
          error: "Invalid sample count",
          details: "Sample count must be between 1 and 4.",
        },
        { status: 400 }
      );
    }

    if (!["1:1", "4:3", "16:9", "9:16"].includes(aspectRatio)) {
      return NextResponse.json(
        {
          error: "Invalid aspect ratio",
          details: "Aspect ratio must be one of: 1:1, 4:3, 16:9, 9:16.",
        },
        { status: 400 }
      );
    }

    if (!["2", "4", "6", "8"].includes(durationSeconds)) {
      return NextResponse.json(
        {
          error: "Invalid duration",
          details: "Duration must be one of: 2, 4, 6, 8 seconds.",
        },
        { status: 400 }
      );
    }

    // Get fresh access token
    let accessToken: string;
    try {
      accessToken = await tokenManager.getAccessToken();
    } catch (error) {
      console.error("Failed to get access token:", error);
      return NextResponse.json(
        { error: "Failed to authenticate with Google Cloud" },
        { status: 401 }
      );
    }

    // Start the long-running operation
    const operationResponse = await startVideoGeneration(
      {
        prompt,
        aspectRatio,
        sampleCount: parseInt(sampleCount),
        durationSeconds: parseInt(durationSeconds),
        personGeneration,
        addWatermark,
        includeRaiReason,
        generateAudio,
        resolution,
      },
      accessToken
    );

    if (!operationResponse.ok) {
      const error = await operationResponse.text();
      return NextResponse.json(
        { error: `Failed to start video generation: ${error}` },
        { status: 500 }
      );
    }

    const operationData = await operationResponse.json();
    const operationName = operationData.name;

    if (!operationName) {
      return NextResponse.json(
        { error: "No operation name returned from API" },
        { status: 500 }
      );
    }

    // Poll for completion
    const maxPolls = 60; // 5 minutes max (60 * 5 seconds)
    let pollCount = 0;

    while (pollCount < maxPolls) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await checkOperationStatus(operationName, accessToken);

      if (!statusResponse.ok) {
        const error = await statusResponse.text();
        console.error(`Status check failed: ${error}`);
        pollCount++;
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.done) {
        if (statusData.response) {
          // Operation completed successfully
          return await processAndUploadVideos(statusData.response, prompt);
        } else if (statusData.error) {
          return NextResponse.json(
            { error: `Video generation failed: ${statusData.error.message}` },
            { status: 500 }
          );
        }
      }

      pollCount++;
    }

    return NextResponse.json(
      { error: "Video generation timed out" },
      { status: 408 }
    );
  } catch (err: any) {
    console.error("Generate GIF API error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

async function startVideoGeneration(params: any, accessToken: string) {
  const requestBody = {
    instances: [
      {
        prompt: params.prompt,
      },
    ],
    parameters: {
      aspectRatio: params.aspectRatio,
      sampleCount: params.sampleCount,
      durationSeconds: params.durationSeconds.toString(),
      personGeneration: params.personGeneration,
      addWatermark: params.addWatermark,
      includeRaiReason: params.includeRaiReason,
      generateAudio: params.generateAudio,
      resolution: params.resolution,
    },
  };

  return fetch(
    `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:predictLongRunning`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    }
  );
}

async function checkOperationStatus(operationName: string, accessToken: string) {
  const requestBody = {
    operationName,
  };

  return fetch(
    `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:fetchPredictOperation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    }
  );
}

async function processAndUploadVideos(response: any, prompt: string) {
  try {
    console.log("Processing Veo response:", JSON.stringify(response, null, 2));

    let predictions;
    if (Array.isArray(response)) {
      predictions = response;
    } else if (response.predictions && Array.isArray(response.predictions)) {
      predictions = response.predictions;
    } else if (response.videos && Array.isArray(response.videos)) {
      predictions = response.videos;
    } else if (response.results && Array.isArray(response.results)) {
      predictions = response.results;
    } else {
      console.error("Invalid response format from Veo:", response);
      throw new Error(`Invalid response format from Veo: ${JSON.stringify(response)}`);
    }

    // Validate each prediction has required video data
    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      if (!pred.bytesBase64Encoded && !pred.video && !pred.data) {
        console.error(`Prediction ${i} missing video data:`, pred);
        throw new Error(`Missing video data in prediction ${i}`);
      }
    }

    // Return videos as base64 data directly
    const videos = predictions.map((pred: any, index: number) => ({
      id: index + 1,
      base64Data: pred.bytesBase64Encoded || pred.video || pred.data,
      mimeType: "video/mp4",
      prompt: pred.prompt || prompt,
    }));

    return NextResponse.json({
      success: true,
      videos: videos,
    });
  } catch (error: any) {
    console.error("Failed to process videos:", error);
    return NextResponse.json({
      success: false,
      error: `Failed to process videos: ${error.message}`,
    });
  }
}

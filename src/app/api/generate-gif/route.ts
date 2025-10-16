import { NextRequest, NextResponse } from "next/server";
import { tokenManager } from "@/lib/google-auth";

interface ParsedImage {
  mimeType: string;
  base64Data: string;
}

function parseBase64Image(str: string): ParsedImage | null {
  try {
    console.log('Parsing image data:', {
      isString: typeof str === 'string',
      length: str?.length,
      startsWithData: str?.startsWith('data:'),
      first100Chars: str?.substring(0, 100)
    });

    // Handle data URL format
    if (str.startsWith('data:')) {
      const matches = str.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const [, mimeType, base64Data] = matches;
        // Verify it's an image mime type
        if (!mimeType.startsWith('image/')) {
          console.log('Invalid mime type:', mimeType);
          return null;
        }
        // Verify base64 is valid
        if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64Data)) {
          console.log('Invalid base64 data in data URL');
          return null;
        }
        return { mimeType, base64Data };
      }
    }
    
    // Handle raw base64 data
    if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str)) {
      // If it's valid base64, assume it's a PNG if no mime type is provided
      return {
        mimeType: 'image/png',
        base64Data: str
      };
    }

    console.log('Failed to parse image data: Neither data URL nor valid base64');
    return null;
  } catch (error) {
    console.error('Error parsing image data:', error);
    return null;
  }
}

function isBase64Image(str: string): boolean {
  return parseBase64Image(str) !== null;
}

interface VideoGenerationParams {
  prompt: string;
  aspectRatio: string;
  sampleCount: number;
  durationSeconds: number;
  personGeneration: string;
  addWatermark: boolean;
  includeRaiReason: boolean;
  generateAudio: boolean;
  resolution: string;
  startingFrame: string;
  finishingFrame?: string;
}

interface VideoResponse {
  id: number;
  base64Data: string;
  mimeType: string;
  prompt: string;
}

const PROJECT_ID = "cobalt-mind-422108";
const LOCATION_ID = "us-central1";
const API_ENDPOINT = "us-central1-aiplatform.googleapis.com";
const MODEL_ID = "veo-3.1-generate-preview";

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    console.log('Received request data:', {
      hasStartingFrame: !!requestData.startingFrame,
      startingFrameLength: requestData.startingFrame?.length,
      hasFinishingFrame: !!requestData.finishingFrame,
      finishingFrameLength: requestData.finishingFrame?.length,
    });

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
      startingFrame,
      finishingFrame,
    } = requestData;

    // Validate image inputs
    if (!startingFrame) {
      return NextResponse.json(
        {
          error: "Starting frame is required",
          details: "A starting frame image is required to generate the video.",
        },
        { status: 400 }
      );
    }

    // Validate image format
    const startFrameData = parseBase64Image(startingFrame);
    if (!startFrameData) {
      return NextResponse.json(
        {
          error: "Invalid starting frame format",
          details: "Starting frame must be a valid base64 encoded image, either as a data URL (data:image/...;base64,...) or raw base64 data",
        },
        { status: 400 }
      );
    }

    if (finishingFrame) {
      const finishFrameData = parseBase64Image(finishingFrame);
      if (!finishFrameData) {
        return NextResponse.json(
          {
            error: "Invalid finishing frame format",
            details: "Finishing frame must be a valid base64 encoded image, either as a data URL (data:image/...;base64,...) or raw base64 data",
          },
          { status: 400 }
        );
      }
    }

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
        startingFrame,
        finishingFrame
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

async function startVideoGeneration(params: VideoGenerationParams, accessToken: string) {
    // Parse and validate base64 encoded images
    const startingFrameData = parseBase64Image(params.startingFrame);
    if (!startingFrameData) {
      throw new Error('Invalid starting frame: Must be a valid base64 encoded image with mime type');
    }

    let finishingFrameData: ParsedImage | null = null;
    if (params.finishingFrame) {
      finishingFrameData = parseBase64Image(params.finishingFrame);
      if (!finishingFrameData) {
        throw new Error('Invalid finishing frame: Must be a valid base64 encoded image with mime type');
      }
    }

    console.log('Starting video generation with params:', {
      hasStartingFrame: true,
      startingFrameMimeType: startingFrameData.mimeType,
      hasFinishingFrame: !!finishingFrameData,
      finishingFrameMimeType: finishingFrameData?.mimeType,
    });

    interface VideoInstance {
      prompt: string;
      image: {
        bytesBase64Encoded: string;
        mimeType: string;
      };
      target_image?: {
        bytesBase64Encoded: string;
        mimeType: string;
      };
    }

    const instance: VideoInstance = {
      prompt: params.prompt,
      image: {
        bytesBase64Encoded: startingFrameData.base64Data,
        mimeType: startingFrameData.mimeType
      }
    };

    if (finishingFrameData) {
      instance.target_image = {
        bytesBase64Encoded: finishingFrameData.base64Data,
        mimeType: finishingFrameData.mimeType
      };
    }

    const requestBody = {
      instances: [instance],
      parameters: {
        aspectRatio: params.aspectRatio,
        sampleCount: params.sampleCount,
        durationSeconds: params.durationSeconds.toString(),
        personGeneration: params.personGeneration,
        addWatermark: params.addWatermark,
        includeRaiReason: params.includeRaiReason,
        generateAudio: params.generateAudio,
        resolution: params.resolution,
        inputFormat: "base64",  // Specify that we're sending base64 encoded images
      },
    };

    console.log('Sending request body:', {
      prompt: instance.prompt,
      hasImage: !!instance.image,
      hasTargetImage: !!(instance as any).target_image,
      parameters: requestBody.parameters
    });  return fetch(
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

interface OperationStatus {
  done: boolean;
  response?: any;
  error?: {
    message: string;
  };
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

interface VeoResponse {
  predictions?: any[];
  videos?: any[];
  results?: any[];
}

async function processAndUploadVideos(response: VeoResponse | any[], prompt: string) {
  try {
    console.log("Processing Veo response:", JSON.stringify(response, null, 2));

    let predictions: any[];
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

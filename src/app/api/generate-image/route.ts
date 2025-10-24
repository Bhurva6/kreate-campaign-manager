import { NextRequest, NextResponse } from "next/server";
import {
  base64ToBuffer,
} from "@/lib/r2-upload";
import { tokenManager } from "@/lib/google-auth";
import { randomUUID } from "crypto";
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      sampleCount = 1,
      aspectRatio = "1:1",
      campaignId: originalCampaignId,
      index: originalIndex,
      logo,
      logoPosition,
    } = await req.json();

    // Handle campaignId and index for non-festive campaigns
    let campaignId = originalCampaignId;
    let index = originalIndex;

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          error: "Prompt is required",
          details: "A text prompt is required to generate an image.",
          suggestion: "Please provide a descriptive prompt for the image you want to generate.",
        },
        { status: 400 }
      );
    }
    if (sampleCount < 1 || sampleCount > 4) {
      return NextResponse.json(
        {
          error: "Invalid sample count",
          details: "Sample count must be between 1 and 4.",
          suggestion: "Please specify a sample count between 1 and 4.",
        },
        { status: 400 }
      );
    }

    const isFestive = campaignId && campaignId.startsWith('festive-');

    if (isFestive) {
      if (!campaignId || typeof campaignId !== "string") {
        return NextResponse.json(
          { 
            error: "Campaign ID required for festive images",
            details: "A campaign ID is required for festive image generation.",
            suggestion: "Please ensure you're generating festive images through the proper interface."
          },
          { status: 400 }
        );
      }
      if (typeof index !== "number") {
        return NextResponse.json(
          { 
            error: "Index required for festive images",
            details: "An index number is required for festive image generation.",
            suggestion: "Please ensure you're generating festive images through the proper interface."
          },
          { status: 400 }
        );
      }
    } else {
      // For non-festive, set defaults if not provided
      if (!campaignId) campaignId = `non-festive-${Date.now()}`;
      if (typeof index !== "number") index = 0;
    }

    // Enhanced prompt with expert AI prompt engineering instruction ONLY for festive campaigns
    const expertInstruction = `You are an expert AI prompt engineer specializing in generating
minimalist and visually appealing backgrounds for marketing banners using
Imagen, with a particular focus on the Indian market. Your goal is to
create prompts that produce a variety of subtly textured and decorative
backgrounds that enhance, rather than distract from, foreground elements
like text and icons.

For BACKGROUND generation:
You will be provided with a banner theme (e.g., "Diwali," "New Year,"
"Christmas") and will generate a corresponding Imagen prompt. Carefully
consider the combination of the following parameters to craft diverse and
culturally relevant backgrounds:
Parameters:
texture_pattern: Subtle background textures relevant to the theme (e.g.,
snowflakes for Christmas, rangoli for Diwali, sparkles for New Year).
background_elements: Decorative elements that appear in the background,
appropriate to the theme and Indian market (e.g., diyas for Diwali,
Christmas bells/trees for Christmas). Try to add atleast 2-3 elements of
for each theme.
element_style: The aesthetic style of the background elements (e.g.,
"outlined," "filled," "watercolor").
element_variation: Variations in the elements with different shapes from the same family, and vibrant color differences with rich saturation to create visually appealing diversity.
Crucial Guidelines (Adhere to these STRICTLY):
**COLOR REQUIREMENT: Backgrounds MUST be colorful and vibrant - NEVER white, cream, or light-colored. Use rich, saturated colors only.
**NO TEXT POLICY: ABSOLUTELY NO TEXT, WORDS, LETTERS, NUMBERS, OR WRITING OF ANY KIND should appear on the generated images. This includes greetings, festival names, company names, slogans, or any other written content.
Theme: Make sure to generated prompt follows the theme significantly.
**Placement: Background elements MUST be placed ONLY on the borders or
corners of the image.
**Avoid placing any elements in the center of the canvas.
**Shape: The overall output image should be rectangular.
**Volume: The number and size of decorative elements should be kept
minimal.
**Focus on simple and sparse visuals.
**Subtlety: The backgrounds should be vibrant and celebratory while still complementing foreground elements (text, icons). They should enhance the festive atmosphere with rich colors. All the design should be in the sides and corners of the image and take only 5-10px of the space from each sides. Use colors that provide good contrast for white text overlays - avoid colors that would make white text hard to read.
**Foreground Awareness: Remember the background will be overlayed with
other foreground image and text. The background colors must provide good contrast for white text overlays and ensure all foreground elements remain clearly visible. Choose background colors that complement rather than compete with overlay text and logos.
**Clean and Minimal: Focus on clean lines and minimal, uncluttered
designs. Avoid overly complex details or gradients.
**Theme-Appropriate Color Palette: CRITICAL - NEVER use white or light backgrounds. Utilize a diverse and vibrant range of colors that are rich and saturated, ensuring the overall palette is colorful and aligns with the chosen theme while maintaining visual harmony. Create visually striking and engaging images with bold, festive colors that celebrate the theme. The background MUST be colorful with rich, saturated colors - avoid any white, cream, or light tones entirely.
**Diverse and Relevant Background Elements: Ensure that the
background_elements you include are diverse and relevant to the given
theme. For instance, use elements like fireworks and diyas for Diwali, and
Christmas bells and trees for Christmas. This will help create culturally
appropriate and engaging visuals for the Indian market. Use rich, saturated background colors such as deep blues, burgundies, forest greens, royal purples, or warm ambers that provide excellent contrast for white text.
**When generating prompts, please keep in mind that these images are
intended for the Indian market.
**Text*: CRITICAL - there should be NO text, words, letters, numbers, or any written content whatsoever on the background image. Only vibrant, colorful designs that provide good contrast for text overlays. Never include greetings, festival names, company names, or any other written elements.

For FOREGROUND generation:
Generate Imagen prompts for a photorealistic marketing banner foreground featuring a [object description], suitable for overlaying on a separate background and targeting the Indian market. The image should have the following characteristics:
**Photorealistic Style: Prioritize generating realistic images. Avoid animation, cartoons, or stylized renderings *unless explicitly requested*.
**Precise Detailing: The prompts should be rich in descriptive details to enable Imagen to create high-quality, realistic images.
**Color Palette: Use sophisticated and culturally appropriate colors for the Indian market.
**Background: The subject should be on a plain white background.
**Size: The object should be small-medium *within the frame*, leaving ample white space around it.
**Lighting: Evenly diffused studio lighting for a "no shadow/highlight" look.
**Indian Market Relevance: Ensure all details are appropriate for the Indian market.
**Text Prohibition: Absolutely no text, words, or written content should appear on the generated foreground images. Only visual elements should be present.
Based on the above guidelines, generate an optimized Imagen prompt that creates colorful, vibrant backgrounds with rich saturated colors suitable for text overlays. Ensure NO text appears on the generated images: `;

    const enhancedPrompt = isFestive ? expertInstruction + prompt : prompt;

    // Get fresh access token from token manager
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

    // Google Cloud/Vertex AI config
    const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "";
    const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    const MODEL_VERSION = "imagen-4.0-generate-preview-06-06";

    if (!PROJECT_ID) {
      return NextResponse.json(
        { error: "Google Cloud project not configured" },
        { status: 500 }
      );
    }

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_VERSION}:predict`;

    // Build request body
    const body = {
      instances: [{ prompt: enhancedPrompt }],
      parameters: {
        sampleCount,
        aspectRatio,
      },
    };

    // Call Vertex AI
    const vertexRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Handle auth errors by retrying with fresh token
    if (vertexRes.status === 401) {
      console.log("Authentication failed, refreshing token and retrying...");
      tokenManager.invalidateToken();

      try {
        const freshToken = await tokenManager.getAccessToken();
        const retryRes = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${freshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              sampleCount,
              aspectRatio,
            },
          }),
        });

        if (!retryRes.ok) {
          const error = await retryRes.text();
          return NextResponse.json(
            { error: `Retry failed: ${error}` },
            { status: 500 }
          );
        }

        const data = await retryRes.json();
        return await processAndUploadImages(data, prompt, campaignId, index, logo, logoPosition);
      } catch (retryError) {
        console.error("Token refresh retry failed:", retryError);
        return NextResponse.json(
          { error: "Authentication failed after retry" },
          { status: 401 }
        );
      }
    }

    if (!vertexRes.ok) {
      const error = await vertexRes.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await vertexRes.json();
    return await processAndUploadImages(data, prompt, campaignId, index, logo, logoPosition);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

async function processAndUploadImages(
  data: any,
  prompt: string,
  campaignId: string,
  index: number,
  logo?: string,
  logoPosition?: string
) {
  try {
    console.log(
      "Processing Vertex AI response:",
      JSON.stringify(data, null, 2)
    );

    if (!data.predictions || !Array.isArray(data.predictions)) {
      console.error("Invalid response format from Vertex AI:", data);
      throw new Error("Invalid response format from Vertex AI");
    }

    // Validate each prediction has required image data
    for (let i = 0; i < data.predictions.length; i++) {
      const pred = data.predictions[i];
      if (!pred.bytesBase64Encoded) {
        console.error(`Prediction ${i} missing image data:`, pred);
        throw new Error(`Missing image data in prediction ${i}`);
      }
    }

    // Process each prediction
    const processedImages = await Promise.all(data.predictions.map(async (pred: any) => {
      try {
        let imgBuffer = base64ToBuffer(pred.bytesBase64Encoded);
        
        // If logo is provided, overlay it on the image
        if (logo && logoPosition) {
          try {
            // Convert base64 logo to buffer and ensure it has transparency
            const logoBuffer = base64ToBuffer(logo);
            const processedLogo = await sharp(logoBuffer)
              .ensureAlpha()  // Ensure the logo has an alpha channel
              .toBuffer();
            
            const image = sharp(imgBuffer);
            
            // Get image dimensions
            const metadata = await image.metadata();
            const width = metadata.width;
            const height = metadata.height;
            
            if (!width || !height) {
              throw new Error('Failed to get image dimensions');
            }
            
            // Calculate logo size (15% of the smaller dimension for better proportion)
            const logoSize = Math.min(width, height) * 0.15;
            
            // Get the logo metadata to maintain aspect ratio
            const logoMetadata = await sharp(processedLogo).metadata();
            const logoAspectRatio = logoMetadata.width! / logoMetadata.height!;
            
            // Calculate logo dimensions maintaining aspect ratio
            let logoWidth = logoSize;
            let logoHeight = logoSize;
            if (logoAspectRatio > 1) {
              logoHeight = logoWidth / logoAspectRatio;
            } else {
              logoWidth = logoHeight * logoAspectRatio;
            }
            
            // Resize logo while maintaining aspect ratio and ensuring transparency
            const resizedLogo = await sharp(processedLogo)
              .resize(Math.round(logoWidth), Math.round(logoHeight), {
                fit: 'inside',
                withoutEnlargement: true
              })
              .toFormat('png')  // Ensure PNG format for transparency
              .toBuffer();
              
            // Calculate logo position
            let top = 0;
            let left = 0;
            const padding = Math.round(Math.min(width, height) * 0.03); // 3% padding
            
            switch (logoPosition) {
              case 'top-left':
                top = left = padding;
                break;
              case 'top-right':
                top = padding;
                left = width - logoWidth - padding;
                break;
              case 'bottom-left':
                top = height - logoHeight - padding;
                left = padding;
                break;
              case 'bottom-right':
                top = height - logoHeight - padding;
                left = width - logoWidth - padding;
                break;
              case 'center':
                top = (height - logoHeight) / 2;
                left = (width - logoWidth) / 2;
                break;
              default:
                throw new Error(`Invalid logo position: ${logoPosition}`);
            }
            
            // Composite the logo onto the image
            imgBuffer = await image
              .composite([
                {
                  input: resizedLogo,
                  top: Math.round(top),
                  left: Math.round(left),
                  blend: 'over'  // Ensure proper alpha blending
                },
              ])
              .toBuffer();
          } catch (error) {
            console.error('Error overlaying logo:', error);
            // Continue with original image if logo overlay fails
          }
        }

        // Convert final image to base64 data URL
        return `data:${pred.mimeType || "image/png"};base64,${imgBuffer.toString('base64')}`;
      } catch (error) {
        console.error('Error processing image:', error);
        throw error;
      }
    }));

    console.log(`Successfully processed ${processedImages.length} images`);

    // Return images array with url property for frontend compatibility
    return NextResponse.json({ 
      images: processedImages.map((url: string) => ({ url })),
      success: true 
    });
  } catch (error) {
    console.error("Failed to process images:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

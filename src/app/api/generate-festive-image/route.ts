import { NextRequest, NextResponse } from 'next/server';
import { uploadMultipleImagesToR2, base64ToBuffer, getMimeTypeFromDataUrl } from "@/lib/r2-upload";
import { tokenManager } from "@/lib/google-auth";
import { randomUUID } from 'crypto';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: "AIzaSyAL13i8HfjEQKd6X413CslA19G39wFiB_M",
});
const model = 'gemini-2.5-flash-image-preview';

const generationConfig = {
  maxOutputTokens: 32768,
  temperature: 1,
  topP: 0.95,
  responseModalities: ["TEXT", "IMAGE"],
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.OFF,
    }
  ],
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const logo = formData.get('logo') as File;
    const festival = formData.get('festival') as string;
    const references = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('reference_')) {
        references.push(value as File);
      }
    }

    // Generate base image using existing API
    const campaignId = `festive-${randomUUID()}`;
    const generateResponse = await fetch(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        sampleCount: 1,
        aspectRatio: '1:1',
        campaignId,
        index: 0,
      }),
    });

    if (!generateResponse.ok) {
      throw new Error('Failed to generate base image');
    }

    const generateData = await generateResponse.json();
    const imageKey = generateData.key;

    // Get the public URL of the generated image
    const imageUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${imageKey}`;

    // Convert logo file to base64
    const logoBuffer = await logo.arrayBuffer();
    const logoBase64 = `data:${logo.type};base64,${Buffer.from(logoBuffer).toString('base64')}`;

    // Add text overlay using Nano Banana API
    const imageWithTextUrl = await addTextOverlay(imageUrl, festival);

    // Overlay logo using edit API
    const finalImageUrl = await overlayLogoUsingEditAPI(imageWithTextUrl, logoBase64);

    return NextResponse.json({ imageUrl: finalImageUrl });
  } catch (error) {
    console.error('Error generating festive image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}

async function overlayLogoUsingEditAPI(imageUrl: string, logoBase64: string): Promise<string> {
  try {
    // Fetch the image with text overlay
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image for logo overlay');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Create logo overlay prompt
    const logoOverlayPrompt = `Overlay this logo on the top-right corner of the image. Place the logo in the top-right corner with a small margin from the edges. Make the logo visible but not too large - it should be proportional to the image size. Keep the logo's original colors and transparency. Do not change anything else in the image.`;
    
    // Use edit API to overlay logo
    const editResponse = await fetch(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/edit-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: logoOverlayPrompt,
        input_image: `data:image/png;base64,${base64Image}`,
        additional_images: [logoBase64],
      }),
    });

    if (!editResponse.ok) {
      throw new Error('Failed to overlay logo using edit API');
    }

    const editData = await editResponse.json();
    
    if (editData.error) {
      throw new Error(`Edit API error: ${editData.error}`);
    }

    // The edit API returns a data URL, extract the base64 and upload to R2
    let finalImageBase64 = editData.image;
    if (finalImageBase64.startsWith('data:image/')) {
      finalImageBase64 = finalImageBase64.split(',')[1];
    }

    const finalBuffer = Buffer.from(finalImageBase64, 'base64');
    
    // Upload to R2
    const uploadResult = await uploadMultipleImagesToR2(
      [{
        buffer: finalBuffer,
        prompt: 'festive-image-with-logo-overlay',
        mimeType: 'image/png',
      }],
      "generate-image",
      `festive/festive-final-${Date.now()}.png`
    );
    
    const finalImageKey = uploadResult[0].key;
    return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${finalImageKey}`;
  } catch (error) {
    console.error('Error overlaying logo with edit API:', error);
    // Return the image with text if logo overlay fails
    return imageUrl;
  }
}

async function addTextOverlay(imageUrl: string, festival: string): Promise<string> {
  try {
    // Fetch the image with logo
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image for text overlay');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Create text overlay prompt
    const textOverlayPrompt = `Add a prominent, elegant text overlay to this image with the greeting "Happy ${festival}" in a stylish, festive font. The text should be clearly visible, well-positioned, and integrated naturally into the composition. Make the text overlay look professional and brand-appropriate.`;
    
    // Use Nano Banana API to add text overlay
    const parts: any[] = [];
    
    // Add the image with logo
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: base64Image,
      },
    });
    
    // Add text prompt for overlay
    parts.push({ text: textOverlayPrompt });
    
    const req = {
      model: model,
      contents: [
        { role: 'user', parts }
      ],
      generationConfig: generationConfig,
    };
    
    const streamingResp = await ai.models.generateContentStream(req);
    
    const generatedImages: string[] = [];
    
    for await (const chunk of streamingResp) {
      if (chunk.candidates && chunk.candidates[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            generatedImages.push(part.inlineData.data);
          }
        }
      }
    }
    
    if (generatedImages.length === 0) {
      throw new Error('No image generated from Nano Banana API');
    }
    
    // Use the first generated image
    const generatedBuffer = Buffer.from(generatedImages[0], 'base64');
    
    // Upload to R2
    const uploadResult = await uploadMultipleImagesToR2(
      [{
        buffer: generatedBuffer,
        prompt: `festive-image-with-text-${festival}`,
        mimeType: 'image/png',
      }],
      "generate-image",
      `festive/festive-with-text-${Date.now()}.png`
    );
    
    const finalImageKey = uploadResult[0].key;
    return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${finalImageKey}`;
    
  } catch (error) {
    console.error('Error adding text overlay:', error);
    // Return the image with logo if text overlay fails
    return imageUrl;
  }
}

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

const festivalGreetings: { [key: string]: string } = {
  'Diwali': 'Happy Diwali',
  'Holi': 'Happy Holi',
  'Eid': 'Happy Eid',
  'Christmas': 'Merry Christmas',
  'New Year': 'Happy New Year',
  'Halloween': 'Happy Halloween',
  'Thanksgiving': 'Happy Thanksgiving',
  'Easter': 'Happy Easter',
  'Pongal': 'Happy Pongal',
  'Baisakhi': 'Happy Baisakhi',
  'Durga Puja': 'Happy Durga Puja',
  'Ganesh Chaturthi': 'Happy Ganesh Chaturthi',
  'Raksha Bandhan': 'Happy Raksha Bandhan',
  'Valentine\'s Day': 'Happy Valentine\'s Day',
  'Mother\'s Day': 'Happy Mother\'s Day',
  'Father\'s Day': 'Happy Father\'s Day',
  'Independence Day': 'Happy Independence Day',
  'Republic Day': 'Happy Republic Day',
  'Makar Sankranti': 'Happy Makar Sankranti',
  'Maha Shivaratri': 'Happy Maha Shivaratri',
  'Ram Navami': 'Happy Ram Navami',
  'Janmashtami': 'Happy Janmashtami',
  'Navratri': 'Happy Navratri',
  'Onam': 'Happy Onam',
  'Vijayadashami': 'Happy Vijayadashami',
  'Karva Chauth': 'Happy Karva Chauth',
  'Tej': 'Happy Tej',
  'Guru Nanak Jayanti': 'Happy Guru Nanak Jayanti',
  'Mahavir Jayanti': 'Happy Mahavir Jayanti',
  'Buddha Purnima': 'Happy Buddha Purnima',
  'Good Friday': 'Happy Good Friday',
  'Boxing Day': 'Happy Boxing Day',
  'St. Patrick\'s Day': 'Happy St. Patrick\'s Day',
  'Cinco de Mayo': 'Happy Cinco de Mayo',
  'Bastille Day': 'Happy Bastille Day',
  'Oktoberfest': 'Happy Oktoberfest',
  'Hanukkah': 'Happy Hanukkah',
  'Kwanzaa': 'Happy Kwanzaa',
  'Tet Nguyen Dan': 'Happy Tet Nguyen Dan',
  'Diwali (Overseas)': 'Happy Diwali',
  'Holi (Overseas)': 'Happy Holi',
};

export async function POST(request: NextRequest) {
  try {
    // Construct base URL from request headers for internal API calls
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 
                    (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;

    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const logo = formData.get('logo') as File;
    const festival = formData.get('festival') as string;
    const customTitle = formData.get('customTitle') as string | null;
    const customSubtitle = formData.get('customSubtitle') as string | null;
    const references = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('reference_')) {
        references.push(value as File);
      }
    }

    // Generate base image using Gemini
    const baseImageUrl = await generateBaseImage(prompt, baseUrl);

    // Convert logo file to base64
    const logoBuffer = await logo.arrayBuffer();
    const logoBase64 = `data:${logo.type};base64,${Buffer.from(logoBuffer).toString('base64')}`;

    // Add text overlay using Gemini
    const imageWithTextUrl = await addTextOverlay(baseImageUrl, festival, customTitle, customSubtitle, baseUrl);

    // Overlay logo using edit API
    const finalImageUrl = await overlayLogoUsingEditAPI(imageWithTextUrl, logoBase64, baseUrl);

    return NextResponse.json({ imageUrl: finalImageUrl });
  } catch (error) {
    console.error('Error generating festive image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}

async function generateBaseImage(prompt: string, baseUrl: string): Promise<string> {
  const generateResponse = await fetch(`${baseUrl}/api/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      sampleCount: 1,
      aspectRatio: '1:1',
      campaignId: `festive-${Date.now()}`,
      index: 0,
    }),
  });

  if (!generateResponse.ok) {
    const errorText = await generateResponse.text();
    throw new Error(`Failed to generate base image: ${errorText}`);
  }

  const generateData = await generateResponse.json();
  const imageKey = generateData.key;
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${imageKey}`;
}

async function overlayLogoUsingEditAPI(imageUrl: string, logoBase64: string, baseUrl: string): Promise<string> {
  try {
    let base64Image: string;
    if (imageUrl.startsWith('data:image/')) {
      base64Image = imageUrl.split(',')[1];
    } else {
      // Fetch the image with text overlay
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image for logo overlay');
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString('base64');
    }
    
    // Create logo overlay prompt
    const logoOverlayPrompt = `Take this image and overlay the provided logo on the top-right corner. Place the logo in the top-right corner with a small margin from the edges. Make the logo clearly visible but not too large - it should be proportional to the image size (about 10-15% of the image width). Keep the logo's original colors and transparency. Do not change anything else in the image - keep all existing content including any text overlays exactly as they are.`;
    
    // Use edit API to overlay logo
    const editResponse = await fetch(`${baseUrl}/api/edit-image`, {
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

async function addTextOverlay(imageUrl: string, festival: string, customTitle: string | null, customSubtitle: string | null, baseUrl: string): Promise<string> {
  try {
    let base64Image: string;
    if (imageUrl.startsWith('data:image/')) {
      base64Image = imageUrl.split(',')[1];
    } else {
      // Fetch the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image for text overlay');
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString('base64');
    }
    
    // Generate subtitle/wish text only if custom subtitle is not provided
    let subtitle = `Wishing you a wonderful ${festival}`; // Default subtitle
    
    if (!customSubtitle) {
      const subtitlePrompt = `Generate a one-line warm, festive wish for ${festival}. Make it personal and heartfelt, suitable for a brand greeting. Keep it under 15 words. Use perfect spelling and grammar. Examples: "Wishing you and your loved ones a very radiant Diwali" or "May your Holi be filled with colors of joy and happiness". Ensure the text is clear, professional, and error-free.`;
      
      try {
        const subtitleResponse = await fetch(`${baseUrl}/api/generate-prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brand: 'Generic Brand',
            industry: 'General',
            festival,
            customPrompt: subtitlePrompt,
          }),
        });

        if (subtitleResponse.ok) {
          const subtitleData = await subtitleResponse.json();
          const generatedSubtitle = subtitleData.prompt || '';
          // Clean up the subtitle to be one line and ensure no spelling mistakes
          const cleanedSubtitle = generatedSubtitle.replace(/\n/g, ' ').trim();
          // Remove any extra quotes or unwanted characters
          const finalSubtitle = cleanedSubtitle.replace(/^["']|["']$/g, '');
          if (finalSubtitle.length > 10 && finalSubtitle.length <= 100) {
            // Basic validation - ensure it contains the festival name or common festive words
            const festiveWords = ['diwali', 'holi', 'christmas', 'eid', 'new year', 'thanksgiving', 'halloween', 'wishing', 'happy', 'joy', 'love', 'peace', 'prosperity'];
            const hasFestiveContent = festiveWords.some(word => finalSubtitle.toLowerCase().includes(word));
            if (hasFestiveContent) {
              subtitle = finalSubtitle;
            }
          }
        }
      } catch (error) {
        console.error('Error generating subtitle:', error);
        // Keep the default subtitle
      }
    }
    
    // Create text overlay prompt with both title and subtitle - enhanced for visibility
    const greeting = festivalGreetings[festival] || `Happy ${festival}`;
    const titleLine = customTitle || greeting;
    const subtitleLine = customSubtitle || subtitle;
    
    const textOverlayPrompt = `Take this image and add two lines of visible text overlay at the top center of the image:

First line: Write "${titleLine}" in large, bold, white letters.

Second line: Write "${subtitleLine}" in smaller white letters below the first line.

Make sure both lines of text are clearly visible and readable against the background. Use high contrast colors (white text with dark outline/shadow if needed). Position the text at the top center with appropriate spacing between the two lines. Do not change anything else in the image - keep all existing content exactly as it is.`;
    
    // Use Gemini to add text overlay
    const parts: any[] = [];
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: base64Image,
      },
    });
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
      throw new Error('No image generated with text overlay');
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
    // Return the original image if text overlay fails
    return imageUrl;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { uploadMultipleImagesToR2, base64ToBuffer, getMimeTypeFromDataUrl } from "@/lib/r2-upload";
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
    const brandName = formData.get('brandName') as string;
    const industry = formData.get('industry') as string;
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

    // Validate required fields
    if (!brandName || !industry || !logo || !festival) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'Brand name, industry, logo, and festival are all required.',
        suggestion: 'Please fill in all required fields and try again.'
      }, { status: 400 });
    }

    // Validate logo file
    if (!logo.type.startsWith('image/')) {
      return NextResponse.json({
        error: 'Invalid logo format',
        details: 'Logo must be an image file.',
        suggestion: 'Please upload a valid image file for the logo.'
      }, { status: 400 });
    }

    // Convert logo file to base64
    const logoBuffer = await logo.arrayBuffer();
    const logoBase64 = `data:${logo.type};base64,${Buffer.from(logoBuffer).toString('base64')}`;

    // Generate festive prompt
    const prompt = await generateFestivePrompt(brandName, industry, festival, '');

    // Generate base image using Gemini
    const baseImageUrl = await generateBaseImage(prompt, baseUrl);

    // Add text overlay using Gemini
    const imageWithTextUrl = await addTextOverlay(baseImageUrl, festival, customTitle, customSubtitle, baseUrl);

    // Overlay logo using edit API
    const finalImageUrl = await overlayLogoUsingEditAPI(imageWithTextUrl, logoBase64, baseUrl);

    return NextResponse.json({ imageUrl: finalImageUrl });
  } catch (error) {
    console.error('Error generating festive image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to generate festive image',
      details: errorMessage,
      suggestion: 'Please try again with different settings or contact support if the issue persists.'
    }, { status: 500 });
  }
}

async function generateBaseImage(prompt: string, baseUrl: string): Promise<string> {
  try {
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

    const generateData = await generateResponse.json();
    if (!generateResponse.ok || !generateData.success || !generateData.key) {
      const errorMessage = generateData.error || 'Failed to generate base image';
      throw new Error(`Base image generation failed: ${errorMessage}`);
    }
    const imageKey = generateData.key;
    return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${imageKey}`;
  } catch (error) {
    console.error('Error in generateBaseImage:', error);
    throw new Error(`Base image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
        throw new Error(`Failed to fetch image for logo overlay: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString('base64');
    }
    
    // Create logo overlay prompt
    const logoOverlayPrompt = `Take this image and overlay the provided logo on the top-right corner. Place the logo in the top-right corner with exactly 10 pixels of margin from the edges. Make the logo clearly visible and appropriately sized - it should be proportional to the image size (at least 40% of the image width). Keep the logo's original colors and transparency. Do not change anything else in the image - keep all existing content including any text overlays exactly as they are.`;
    
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
      const errorText = await editResponse.text();
      let errorDetails = 'Unknown error from logo overlay service';
      try {
        const errorData = JSON.parse(errorText);
        errorDetails = errorData.error || errorData.details || errorData.message || errorText;
      } catch (e) {
        errorDetails = errorText;
      }
      throw new Error(`Failed to overlay logo: ${errorDetails}`);
    }

    const editData = await editResponse.json();
    
    if (editData.error) {
      throw new Error(`Logo overlay API error: ${editData.error}`);
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
    // Return the image with text if logo overlay fails - don't fail the entire process
    console.warn('Logo overlay failed, returning image without logo overlay');
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
        throw new Error(`Failed to fetch image for text overlay: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString('base64');
    }
    
    // Generate subtitle/wish text only if custom subtitle is not provided
    const greeting = festivalGreetings[festival] || `Happy ${festival}`;
    let subtitle = `Wishing you a wonderful ${festival}`; // Default subtitle
    
    if (!customSubtitle) {
      const subtitlePrompt = `Generate a one-line warm, heartfelt wish for ${festival} that does NOT include the words "${greeting}" or repeat the festival name. Make it personal and suitable for a brand greeting. Keep it under 15 words. Use perfect spelling and grammar. Examples: "Wishing you and your loved ones joy and prosperity" or "May your celebrations be filled with warmth and happiness". Focus on emotional warmth, well-wishes, and positive sentiments without mentioning the specific festival name or repeating greeting phrases. Ensure the text is clear, professional, and error-free.`;
      
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
        } else {
          console.warn('Failed to generate custom subtitle, using default');
        }
      } catch (error) {
        console.error('Error generating subtitle:', error);
        // Keep the default subtitle
      }
    }
    
    // Create text overlay prompt with both title and subtitle - enhanced for visibility
    const titleLine = customTitle || greeting;
    const subtitleLine = customSubtitle || subtitle;
    
    const textOverlayPrompt = `Take this image and add two lines of visible text overlay in the top part of the image:

First line: Write "${titleLine}" in a randomly chosen elegant, festive font style from these options: cursive script, decorative calligraphy, ornate serif, stylish sans-serif, or artistic brush script - make it large, visually striking, and decorative.

Second line: Write "${subtitleLine}" in smaller white letters below the first line.

Make sure both lines of text are clearly visible and readable against the background. Use high contrast colors (white text with dark outline/shadow if needed). Position the text in the upper portion with appropriate spacing between the two lines. Do not change anything else in the image - keep all existing content exactly as it is.`;
    
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
    // Return the original image if text overlay fails - don't fail the entire process
    console.warn('Text overlay failed, returning image without text overlay');
    return imageUrl;
  }
}

async function generateFestivePrompt(brand: string, industry: string, festival: string, logoColors?: string): Promise<string> {
  try {
    // Festival-specific color schemes
    const festivalColors: { [key: string]: string } = {
      'Diwali': 'golden yellows, deep oranges, warm reds, rich maroons, bright whites',
      'Holi': 'vibrant pinks, electric blues, sunny yellows, bright greens, purple hues',
      'Eid': 'soft greens, creamy whites, elegant golds, serene blues, warm beiges',
      'Christmas': 'deep reds, forest greens, metallic golds, snowy whites, festive silvers',
      'New Year': 'sparkling silvers, midnight blues, champagne golds, white accents, celebratory purples',
      'Halloween': 'deep oranges, midnight blacks, glowing yellows, purple shadows, spooky greens',
      'Thanksgiving': 'warm oranges, earthy browns, harvest golds, autumn reds, creamy whites',
      'Easter': 'pastel pinks, soft blues, spring greens, yellow sunshine, white purity',
      'Pongal': 'earthy browns, harvest oranges, golden yellows, fresh greens, traditional whites',
      'Baisakhi': 'bright yellows, royal blues, festive pinks, golden accents, vibrant greens',
      'Durga Puja': 'rich reds, golden yellows, white purity, traditional oranges, auspicious greens',
      'Ganesh Chaturthi': 'marigold yellows, auspicious reds, white sanctity, golden accents, festive pinks',
      'Raksha Bandhan': 'sweet pinks, traditional reds, golden threads, white purity, celebratory yellows',
      'Valentine\'s Day': 'romantic reds, soft pinks, white purity, golden hearts, blush roses',
      'Mother\'s Day': 'gentle pinks, soft lavenders, white lilies, golden warmth, spring greens',
      'Father\'s Day': 'deep blues, metallic silvers, warm browns, classic whites, golden accents',
      'Independence Day': 'saffron oranges, white purity, forest greens, patriotic blues, golden rays',
      'Republic Day': 'patriotic blues, white dignity, forest greens, golden honors, saffron pride',
      'Makar Sankranti': 'sky blues, kite colors, golden sunshine, white clouds, vibrant rainbow hues',
      'Maha Shivaratri': 'deep blues, white ash, golden accents, spiritual purples, sacred oranges',
      'Ram Navami': 'auspicious yellows, divine blues, golden crowns, white purity, festive pinks',
      'Janmashtami': 'divine blues, golden yellows, white purity, festive decorations, sacred colors',
      'Navratri': 'traditional whites, auspicious reds, golden accents, festival colors, devotional purples',
      'Onam': 'golden yellows, fresh greens, white purity, floral pinks, harvest oranges',
      'Vijayadashami': 'victorious yellows, auspicious reds, white purity, golden celebrations, traditional greens',
      'Karva Chauth': 'romantic pinks, traditional reds, golden jewelry, white purity, festive yellows',
      'Tej': 'celebratory yellows, traditional reds, white sanctity, golden accents, festive colors',
      'Guru Nanak Jayanti': 'spiritual blues, golden yellows, white purity, devotional colors, sacred oranges',
      'Mahavir Jayanti': 'peaceful whites, spiritual yellows, serene blues, golden enlightenment, pure colors',
      'Buddha Purnima': 'serene whites, spiritual yellows, peaceful blues, golden enlightenment, pure lotus colors',
      'Good Friday': 'solemn purples, golden crosses, white purity, spiritual blues, reverent colors',
      'Boxing Day': 'festive reds, holiday greens, metallic golds, snowy whites, celebratory colors',
      'St. Patrick\'s Day': 'lucky greens, golden shamrocks, white purity, festive colors, Irish hues',
      'Cinco de Mayo': 'vibrant greens, red celebrations, white accents, golden fiesta colors, festive yellows',
      'Bastille Day': 'patriotic blues, white dignity, red celebration, golden honors, French flag colors',
      'Oktoberfest': 'beer browns, festive yellows, blue accents, traditional whites, Bavarian colors',
      'Hanukkah': 'deep blues, golden menorahs, white purity, silver accents, festival colors',
      'Kwanzaa': 'earthy browns, vibrant reds, deep greens, golden yellows, African heritage colors',
      'Tet Nguyen Dan': 'lucky reds, golden prosperity, white purity, festival colors, Vietnamese traditions',
      'Diwali (Overseas)': 'golden yellows, deep oranges, warm reds, rich maroons, bright whites',
      'Holi (Overseas)': 'vibrant pinks, electric blues, sunny yellows, bright greens, purple hues'
    };

    // Industry-specific creative inspiration
    const industryInspirations: { [key: string]: string } = {
      'Technology': 'modern digital aesthetics, circuit patterns, geometric shapes, futuristic elements',
      'Healthcare': 'healing symbols, gentle curves, medical motifs, wellness imagery',
      'Finance': 'geometric patterns, stability symbols, growth charts, professional elegance',
      'Retail': 'shopping motifs, product displays, consumer elements, vibrant displays',
      'Manufacturing': 'industrial motifs, machinery elements, precision patterns, engineering aesthetics',
      'Education': 'knowledge symbols, learning elements, inspirational motifs, academic themes',
      'Food & Beverage': 'culinary elements, ingredient motifs, dining aesthetics, flavor representations',
      'Automotive': 'vehicle silhouettes, motion lines, engineering precision, speed elements',
      'Real Estate': 'architectural elements, home motifs, stability symbols, community themes',
      'Entertainment': 'performance elements, creative motifs, artistic expressions, media symbols',
      'Agriculture': 'natural motifs, growth elements, harvest symbols, earth tones',
      'Construction': 'building elements, structural motifs, architectural patterns, strength symbols',
      'Energy': 'power symbols, flow elements, natural force motifs, dynamic patterns',
      'Telecommunications': 'connection motifs, network patterns, communication symbols, digital waves',
      'Transportation': 'movement elements, journey motifs, connectivity symbols, travel themes',
      'Media': 'communication elements, storytelling motifs, creative expressions, media symbols',
      'Pharmaceuticals': 'scientific motifs, research elements, health symbols, innovation patterns',
      'Consulting': 'strategy elements, insight motifs, professional patterns, guidance symbols',
      'Legal Services': 'justice motifs, balance elements, professional symbols, trust patterns',
      'Hospitality': 'welcome elements, comfort motifs, service symbols, experience themes',
      'Other': 'versatile elements, adaptable motifs, creative patterns, unique expressions'
    };

    const industryInspiration = industryInspirations[industry] || industryInspirations['Other'];
    const festivalColorScheme = festivalColors[festival] || 'warm and vibrant colors';

    const promptTemplate = `Create a creative, highly aesthetic image generation prompt for a ${industry} company called "${brand}" celebrating ${festival}. 

Requirements:
- Create a visually stunning, festival-appropriate design that captures the essence and beauty of ${festival}
- Include essential ${industry} industry elements and subtle branding elements that represent "${brand}" (do not include any logos, text, or company names)
- Incorporate prominent, culturally authentic ${festival} cultural elements and decorations that are visually striking and festival-specific
- Use rich, vibrant ${festival} colors: ${festivalColorScheme} throughout the design
- CRITICAL LAYOUT: Place ALL foreground elements, decorations, and content ONLY in the lower 60% of the image - the bottom portion should be filled with beautiful, festival-relevant elements
- CRITICAL LAYOUT: Leave the top 40% of the image COMPLETELY EMPTY and clear - no elements, decorations, or content whatsoever in the upper portion - this space is reserved exclusively for text overlays
- Draw creative inspiration from ${industry} industry aesthetics: ${industryInspiration}
- Ensure all elements are culturally appropriate, respectful, and highly aesthetic
- Avoid including any humans or people in the image
- Do not include any text overlays, greetings, or written elements
- Make it elegant, brand-appropriate, and visually captivating for marketing campaigns
- CRITICAL: Use a vibrant, colorful background with rich ${festivalColorScheme} - incorporate beautiful, prominent ${festival} decorative elements as background patterns (like elaborate diyas, rangoli, flowers, or traditional symbols) in vibrant, saturated tones that create a festive atmosphere - the background should be rich and celebratory, not minimal or light

Generate a concise prompt that an AI image generator can use to create a highly aesthetic, festival-celebratory image that represents this ${industry} brand during ${festival}. Focus on visual beauty, cultural authenticity, and proper spatial distribution with foreground elements in the lower 60% and top 40% completely clear for text placement. The background should be vibrant and festival-rich.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptTemplate
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate prompt from Gemini');
    }

    const data = await response.json();
    const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedPrompt) {
      throw new Error('No prompt generated from Gemini');
    }

    return generatedPrompt;
  } catch (error) {
    console.error('Error generating festive prompt:', error);
    // Return a fallback prompt
    return `Create a highly aesthetic, festival-celebratory image for ${brand} in the ${industry} industry celebrating ${festival}. Place all foreground elements and decorations only in the lower 60% of the image, leave the top 40% completely empty for text. Use vibrant festival colors with rich, prominent festival decorative elements as background patterns. Make it visually stunning and culturally authentic.`;
  }
}

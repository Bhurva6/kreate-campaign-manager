import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { brand, industry, festival, customPrompt } = await request.json();

    // Use custom prompt if provided, otherwise use the default image generation prompt
    const prompt = customPrompt || `Create a minimalistic image generation prompt for a ${industry} company called "${brand}" celebrating ${festival}. 

Requirements:
- Clean, minimalistic design with few meaningful elements
- Include essential ${industry} industry elements and branding that represent "${brand}"
- Incorporate subtle ${festival} cultural elements and decorations
- Create a warm, celebratory atmosphere with festive colors
- Simple composition with ample white space
- Ensure all elements are culturally appropriate and respectful
- Avoid including any humans or people in the image
- Make it elegant and brand-appropriate for marketing campaigns

IMPORTANT: Include a prominent, elegant text overlay on the image with the greeting "Happy ${festival}" in a clean, modern font that complements the minimalistic design. The text should be clearly visible and well-positioned.

Generate a concise prompt that an AI image generator can use to create a minimalistic festive celebration image that represents this ${industry} brand during ${festival}. Focus on simplicity, key elements only, and no human figures.`;

    // Call Gemini API directly using API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new Error('Failed to generate prompt from Gemini');
    }

    const data = await response.json();
    const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedPrompt) {
      throw new Error('No prompt generated from Gemini');
    }

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 });
  }
}

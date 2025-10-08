import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { brand, industry, festival } = await request.json();

    const prompt = `Create a highly detailed, hyper-realistic image generation prompt for a ${industry} company called "${brand}" celebrating ${festival}. 

Requirements:
- Hyper-realistic photography style with professional lighting and composition
- Include specific ${industry} industry elements and branding that represent "${brand}"
- Incorporate authentic ${festival} cultural elements, decorations, and traditions
- Create a warm, celebratory atmosphere with festive colors and mood
- Professional commercial photography quality suitable for brand marketing
- Ensure all elements are culturally appropriate and respectful
- Make it visually striking and brand-appropriate for marketing campaigns

IMPORTANT: Include a prominent, elegant text overlay on the image with the greeting "Happy ${festival}" in a stylish, festive font that complements the overall design. The text should be clearly visible, well-positioned, and integrated naturally into the composition.

Generate a comprehensive prompt that an AI image generator can use to create a photorealistic festive celebration image that perfectly represents this ${industry} brand during ${festival}. Include specific details about lighting, composition, colors, cultural elements, and text overlay styling.`;

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

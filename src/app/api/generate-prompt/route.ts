import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { brand, industry, festival, customPrompt } = await request.json();

    // Validate required fields
    if (!brand || !industry || !festival) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'Brand, industry, and festival are required.',
        suggestion: 'Please provide all required fields.'
      }, { status: 400 });
    }

    // Use custom prompt if provided, otherwise use the default image generation prompt
    const prompt = customPrompt || `Create a minimalistic image generation prompt for a ${industry} company called "${brand}" celebrating ${festival}. 

Requirements:
- Clean, minimalistic design with few meaningful elements
- Include essential ${industry} industry elements and subtle branding elements that represent "${brand}" (do not include any logos, text, or company names)
- Incorporate subtle ${festival} cultural elements and decorations
- Create a warm, celebratory atmosphere with festive colors
- Simple composition with ample white space
- IMPORTANT: Leave significant empty/clear space at the top center of the image (about 30-40% of the image height) for text overlays - do not place any elements, decorations, or content in the top portion
- Ensure all elements are culturally appropriate and respectful
- Avoid including any humans or people in the image
- Do not include any text overlays, greetings, or written elements
- Make it elegant and brand-appropriate for marketing campaigns

Generate a concise prompt that an AI image generator can use to create a minimalistic festive celebration image that represents this ${industry} brand during ${festival}. Focus on simplicity, key elements only, and no human figures, logos, or text. Ensure the top portion of the image remains completely clear and empty for text overlay placement.`;

    // Call Gemini API directly using API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({
        error: 'API configuration error',
        details: 'Gemini API key not configured.',
        suggestion: 'Please contact support to resolve the API configuration issue.'
      }, { status: 500 });
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
      let errorDetails = 'Unknown error from Gemini API';
      try {
        const errorData = JSON.parse(errorText);
        errorDetails = errorData.error?.message || errorData.message || errorText;
      } catch (e) {
        errorDetails = errorText;
      }
      return NextResponse.json({
        error: 'Failed to generate prompt',
        details: errorDetails,
        suggestion: 'Please try again or contact support if the issue persists.'
      }, { status: 500 });
    }

    const data = await response.json();
    const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedPrompt) {
      return NextResponse.json({
        error: 'No prompt generated',
        details: 'The AI service did not return a valid prompt.',
        suggestion: 'Please try again with different parameters.'
      }, { status: 500 });
    }

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Error generating prompt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to generate prompt',
      details: errorMessage,
      suggestion: 'Please try again or contact support if the issue persists.'
    }, { status: 500 });
  }
}

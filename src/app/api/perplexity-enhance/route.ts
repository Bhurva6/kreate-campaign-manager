import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      );
    }

    // Call Perplexity API to enhance the prompt
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating detailed, cinematic prompts for AI video generation. Your task is to enhance user prompts to make them more descriptive, visually rich, and suitable for creating engaging animated videos. Focus on adding details about camera movements, lighting, atmosphere, and visual effects that would make the animation more compelling and professional.'
          },
          {
            role: 'user',
            content: `Please enhance this video generation prompt to make it more detailed and cinematic: "${prompt}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to enhance prompt with Perplexity API' },
        { status: 500 }
      );
    }

    const perplexityData = await perplexityResponse.json();
    
    if (!perplexityData.choices || perplexityData.choices.length === 0) {
      return NextResponse.json(
        { error: 'No enhanced prompt received from Perplexity API' },
        { status: 500 }
      );
    }

    const enhancedPrompt = perplexityData.choices[0].message.content.trim();

    return NextResponse.json({
      success: true,
      enhanced_prompt: enhancedPrompt,
      original_prompt: prompt
    });

  } catch (error: any) {
    console.error('Perplexity enhance API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

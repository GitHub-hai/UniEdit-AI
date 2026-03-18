import { NextRequest, NextResponse } from 'next/server';

const DASHSCOPE_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mask, model, prompt, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    if (!image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const requestBody: any = {
      model: model || 'wanx-v2',
      prompt: prompt || 'enhance this image',
      image: image,
    };

    if (mask) {
      requestBody.mask = mask;
    }

    console.log('[API] Calling Alibaba with model:', requestBody.model);

    const response = await fetch(DASHSCOPE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Alibaba error:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.error?.message || errorJson.message || 'API Error' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: `API Error ${response.status}: ${errorText}` },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    console.log('[API] Alibaba response received');

    if (data.data && data.data[0] && data.data[0].url) {
      const imageUrl = data.data[0].url;
      console.log('[API] Fetching image from:', imageUrl);

      // Fetch the generated image
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();

      // Return the image as base64
      const base64 = await blobToBase64(imageBlob);
      return NextResponse.json({ image: base64 });
    }

    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'No image generated' }, { status: 500 });
    }

    return NextResponse.json({ error: 'No image in response' }, { status: 500 });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${blob.type};base64,${base64}`;
}

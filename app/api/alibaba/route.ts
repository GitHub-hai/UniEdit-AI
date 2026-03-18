import { NextRequest, NextResponse } from 'next/server';

// Qwen Image API 端点
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

    // 使用 qwen-image 模型
    const modelName = model || 'qwen-image-edit-max';

    console.log('[API] Using model:', modelName);

    const requestBody: any = {
      model: modelName,
      prompt: prompt || 'enhance this image',
      image: image,
    };

    if (mask) {
      requestBody.mask = mask;
    }

    console.log('[API] Calling Alibaba with model:', modelName);

    const response = await fetch(DASHSCOPE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.error?.message || errorJson.message || `API Error: ${response.status}` },
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
    console.log('[API] Response data:', JSON.stringify(data).substring(0, 300));

    // 尝试多种响应格式
    let imageUrl = null;

    // Format 1: data[0].url
    if (data.data && data.data[0] && data.data[0].url) {
      imageUrl = data.data[0].url;
    }
    // Format 2: output.choices[0].message.content
    else if (data.output && data.output.choices && data.output.choices[0]) {
      const content = data.output.choices[0].message?.content;
      if (content) {
        if (typeof content === 'string') {
          imageUrl = content;
        } else if (Array.isArray(content)) {
          imageUrl = content[0]?.image || content[0]?.url;
        }
      }
    }

    if (imageUrl) {
      console.log('[API] Fetching image from:', imageUrl);
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const base64 = await blobToBase64(imageBlob);
      return NextResponse.json({ image: base64 });
    }

    return NextResponse.json({ error: 'No image URL in response', details: data }, { status: 500 });

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

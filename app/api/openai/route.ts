import { NextRequest, NextResponse } from 'next/server';

// OpenAI Images API endpoint
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/images/generations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      model,
      prompt,
      apiKey,
      n,
      image,
      mask,
      width,
      height,
      quality,
      style,
    } = body;

    console.log('[OpenAI API] Received request:', {
      model,
      prompt: prompt?.substring(0, 100),
      n,
      hasImage: !!image,
      hasMask: !!mask,
      width,
      height,
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    if (!model) {
      return NextResponse.json({ error: 'Missing model' }, { status: 400 });
    }

    // 构建请求体
    const requestBody: Record<string, any> = {
      model,
      n: Math.min(Math.max(1, n || 1), 10), // 限制在 1-10
    };

    // 添加 prompt
    if (prompt) {
      requestBody.prompt = prompt.substring(0, 4000); // OpenAI 限制 4000 字符
    }

    // GPT Image 1 支持的参数
    if (model === 'gpt-image-1') {
      if (width && height) {
        requestBody.width = width;
        requestBody.height = height;
      }

      if (quality) {
        requestBody.quality = quality; // 'standard' or 'hd'
      }

      if (style) {
        requestBody.style = style; // 'vivid' or 'natural'
      }

      // 图片编辑模式
      if (image) {
        requestBody.image = image;
        if (mask) {
          requestBody.mask = mask;
        }
      }
    } else {
      // DALL-E 模型的参数
      // DALL-E 3 只支持 1024x1024, 1024x1792, 1792x1024
      // DALL-E 2 支持 256x256, 512x512, 1024x1024
      if (width && height && model === 'dall-e-3') {
        // 验证 DALL-E 3 尺寸
        const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
        const size = `${width}x${height}`;
        if (validSizes.includes(size)) {
          requestBody.size = size;
        } else {
          requestBody.size = '1024x1024';
        }
      } else if (model === 'dall-e-2') {
        requestBody.size = '1024x1024'; // 默认尺寸
      }
    }

    console.log('[OpenAI API] Request body:', JSON.stringify(requestBody).substring(0, 500));

    let response;
    try {
      response = await fetch(OPENAI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[OpenAI API] Response status:', response.status);
    } catch (fetchErr: any) {
      console.error('[OpenAI API] Fetch failed:', fetchErr);
      return NextResponse.json(
        { error: `Network error: ${fetchErr?.message || 'Failed to connect to OpenAI API'}` },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI API] Error:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.error?.message || errorJson.error?.type || `API Error: ${response.status}` },
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
    console.log('[OpenAI API] Response:', JSON.stringify(data).substring(0, 500));

    // 解析响应
    // OpenAI 返回格式:
    // {
    //   "created": 1234567890,
    //   "data": [
    //     { "url": "https://..." },
    //     { "b64_json": "..." }
    //   ]
    // }

    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return NextResponse.json({ error: 'No image in response' }, { status: 500 });
    }

    const images: string[] = [];

    for (const img of data.data) {
      if (img.url) {
        // 下载 URL 图片并转换为 base64
        try {
          const imageResponse = await fetch(img.url);
          const imageBlob = await imageResponse.blob();
          const base64 = await blobToBase64(imageBlob);
          images.push(base64);
        } catch (e) {
          console.error('[OpenAI API] Failed to download image:', e);
        }
      } else if (img.b64_json) {
        // 直接使用 base64
        images.push(`data:image/png;base64,${img.b64_json}`);
      }
    }

    if (images.length > 0) {
      console.log('[OpenAI API] Returning', images.length, 'images');
      if (images.length === 1) {
        return NextResponse.json({ image: images[0] });
      }
      return NextResponse.json({ images });
    }

    return NextResponse.json({ error: 'No image in response' }, { status: 500 });

  } catch (error) {
    console.error('[OpenAI API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${blob.type || 'image/png'};base64,${base64}`;
}

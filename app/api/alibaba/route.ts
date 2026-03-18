import { NextRequest, NextResponse } from 'next/server';

// 正确的 API 端点
const DASHSCOPE_API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-image/generation';

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

    // 构建请求 - Qwen Image API 格式
    const requestBody: any = {
      model: modelName,
      input: {
        prompt: prompt || 'enhance this image',
      },
    };

    // 添加图片到 input
    if (image) {
      requestBody.input.image = [{ image: image }];
    }

    // 添加 mask（如果有）
    if (mask) {
      requestBody.input.image.push({ mask: mask });
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
          { error: errorJson.message || errorJson.code || `API Error: ${response.status}` },
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
    console.log('[API] Response:', JSON.stringify(data).substring(0, 500));

    // 尝试多种响应格式
    let imageUrl = null;

    // Format: output.choices[0].message.content[0].image
    if (data.output?.choices?.[0]?.message?.content) {
      const content = data.output.choices[0].message.content;
      if (Array.isArray(content) && content[0]?.image) {
        imageUrl = content[0].image;
      } else if (typeof content === 'string') {
        imageUrl = content;
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

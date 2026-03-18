import { NextRequest, NextResponse } from 'next/server';

// 千问图像编辑 API 端点
const DASHSCOPE_API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

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

    // 保留完整的 data URL 前缀（包含 mime type）
    const imageDataUrl = image.startsWith('data:') ? image : `data:image/png;base64,${image}`;

    // 使用推荐模型
    const modelName = model || 'qwen-image-2.0-pro';

    console.log('[API] Using model:', modelName);
    console.log('[API] Image data URL prefix:', imageDataUrl.substring(0, 50));

    // 构建请求 - 千问图像编辑 API 格式
    const requestBody: any = {
      model: modelName,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: imageDataUrl },
              { text: prompt || 'enhance this image' }
            ]
          }
        ]
      },
      parameters: {
        n: 1,
        negative_prompt: ' ',
        prompt_extend: true,
        watermark: false,
      }
    };

    console.log('[API] Request body:', JSON.stringify(requestBody).substring(0, 500));

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

    // 解析响应 - 千问图像编辑格式
    let imageUrl = null;

    if (data.output?.choices?.[0]?.message?.content) {
      const content = data.output.choices[0].message.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.image) {
            imageUrl = item.image;
            break;
          }
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

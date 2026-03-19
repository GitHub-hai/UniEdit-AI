import { NextRequest, NextResponse } from 'next/server';

// MiniMax API 端点
const MINIMAX_API_ENDPOINT = 'https://api.minimaxi.com/v1/image_generation';

// MiniMax 模型分类
const MODEL_CATEGORIES: Record<string, string> = {
  'image-01': 'minimax-t2i',      // image-01 支持 T2I 和 I2I
  'image-01-live': 'minimax-live', // image-01-live 仅支持 T2I
};

// 获取模型分类
function getModelCategory(model: string): string {
  return MODEL_CATEGORIES[model] || 'minimax-t2i';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      image,
      model,
      prompt,
      apiKey,
      outputCount,
      size,
      aspect_ratio,
      negative_prompt,
      seed,
      n,
      prompt_optimizer,
      aigc_watermark,
      response_format,
      subject_reference,
    } = body;

    console.log('[MiniMax API] Received request:', {
      hasImage: !!image,
      model,
      prompt: prompt?.substring(0, 100),
      aspect_ratio,
      n,
      size,
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const modelName = model || 'image-01';
    const modelCategory = getModelCategory(modelName);

    // 判断是否需要图片 (I2I 模式)
    const needsImage = modelCategory !== 'minimax-live' && !subject_reference;
    const hasImageInput = !!image;

    // T2I 模式不需要图片，I2I 模式才需要
    // 注意：MiniMax I2I 可以只通过 subject_reference 来引用图片，不需要直接传图片
    if (needsImage && !hasImageInput && !subject_reference) {
      // 这是 I2I 模式但没有图片
      console.log('[MiniMax API] I2I mode but no image provided');
    } else {
      console.log('[MiniMax API] T2I mode (no image required)');
    }

    // 构建请求体
    const requestBody: any = {
      model: modelName,
      prompt: prompt.substring(0, 1500), // 最大 1500 字符
    };

    // 添加可选参数
    if (aspect_ratio) {
      requestBody.aspect_ratio = aspect_ratio;
    }

    if (size) {
      // size 格式为 "1024*1024"，需要解析为 width 和 height
      const [width, height] = size.split('*').map(Number);
      if (!isNaN(width) && !isNaN(height)) {
        requestBody.width = width;
        requestBody.height = height;
      }
    }

    if (response_format) {
      requestBody.response_format = response_format;
    } else {
      // 默认返回 url，与文档示例一致
      requestBody.response_format = 'url';
    }

    if (seed !== undefined && seed !== null) {
      requestBody.seed = seed;
    }

    if (n !== undefined && n !== null) {
      requestBody.n = Math.min(Math.max(1, n), 9);
    } else {
      requestBody.n = outputCount || 1;
    }

    if (prompt_optimizer !== undefined) {
      requestBody.prompt_optimizer = prompt_optimizer;
    }

    if (aigc_watermark !== undefined) {
      requestBody.aigc_watermark = aigc_watermark;
    }

    // I2I 模式：添加 subject_reference 和 image
    if (subject_reference && subject_reference.length > 0) {
      requestBody.subject_reference = subject_reference;
      console.log('[MiniMax API] I2I mode with subject_reference');
    }

    // 添加图片 (I2I 模式)
    if (image) {
      requestBody.image = image;
      console.log('[MiniMax API] Adding image to request');
    }

    console.log('[MiniMax API] Request body:', JSON.stringify(requestBody).substring(0, 500));
    console.log('[MiniMax API] API Key length:', apiKey?.length);

    let response;
    try {
      console.log('[MiniMax API] Calling MiniMax endpoint:', MINIMAX_API_ENDPOINT);
      console.log('[MiniMax API] With auth header:', `Bearer ${apiKey?.substring(0, 10)}...`);

      response = await fetch(MINIMAX_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[MiniMax API] Response status:', response.status);
    } catch (fetchErr: any) {
      console.error('[MiniMax API] Fetch failed:', fetchErr);
      console.error('[MiniMax API] Fetch error name:', fetchErr?.name);
      console.error('[MiniMax API] Fetch error message:', fetchErr?.message);
      console.error('[MiniMax API] Fetch error cause:', fetchErr?.cause);
      return NextResponse.json(
        { error: `网络请求失败: ${fetchErr?.message || '无法连接到 MiniMax API'}` },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MiniMax API] Error:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.message || errorJson.base_resp?.status_msg || `API Error: ${response.status}` },
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
    console.log('[MiniMax API] Response:', JSON.stringify(data).substring(0, 500));

    // 解析响应
    // MiniMax 返回格式:
    // {
    //   "id": "xxx",
    //   "data": {
    //     "image_urls": ["url1", "url2"] 或 "base64_data": "xxx"
    //   },
    //   "metadata": {
    //     "failed_count": "0",
    //     "success_count": "3"
    //   },
    //   "base_resp": {
    //     "status_code": 0,
    //     "status_msg": "success"
    //   }
    // }

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: data.base_resp?.status_msg || 'API Error' },
        { status: 500 }
      );
    }

    const images: string[] = [];

    console.log('[MiniMax API] Response data keys:', Object.keys(data));
    console.log('[MiniMax API] data.data:', data.data);
    console.log('[MiniMax API] data.data type:', typeof data.data);
    if (data.data) {
      console.log('[MiniMax API] data.data keys:', Object.keys(data.data));
    }

    // 处理 image_urls (URL 格式)
    // MiniMax 返回格式可能是 data.data.image_urls 或 data.data.data.image_urls
    const imageUrls = data.data?.image_urls || data.data?.data?.image_urls;
    if (imageUrls && Array.isArray(imageUrls)) {
      console.log('[MiniMax API] Found image_urls:', imageUrls.length);
      for (const imgUrl of imageUrls) {
        // 下载图片并转换为 base64
        try {
          console.log('[MiniMax API] Downloading:', imgUrl.substring(0, 80));
          const imageResponse = await fetch(imgUrl);
          if (!imageResponse.ok) {
            console.error('[MiniMax API] Failed to fetch image, status:', imageResponse.status);
            continue;
          }
          const imageBlob = await imageResponse.blob();
          const base64 = await blobToBase64(imageBlob);
          images.push(base64);
          console.log('[MiniMax API] Downloaded successfully, size:', imageBlob.size);
        } catch (e) {
          console.error('[MiniMax API] Failed to download image:', e);
        }
      }
    } else {
      console.log('[MiniMax API] No image_urls found in response');
    }

    // 处理 base64_data (直接返回 base64)
    const base64Data = data.data?.base64_data || data.data?.data?.base64_data;
    if (base64Data) {
      const base64Array = Array.isArray(base64Data) ? base64Data : [base64Data];
      for (const b64 of base64Array) {
        if (b64) {
          images.push(`data:image/png;base64,${b64}`);
        }
      }
    }

    if (images.length > 0) {
      console.log('[MiniMax API] Returning', images.length, 'images');
      if (images.length === 1) {
        return NextResponse.json({ image: images[0] });
      }
      return NextResponse.json({ images });
    }

    console.log('[MiniMax API] No images extracted, returning error');
    return NextResponse.json({ error: 'No image in response', details: data }, { status: 500 });

  } catch (error) {
    console.error('[MiniMax API] Error:', error);
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

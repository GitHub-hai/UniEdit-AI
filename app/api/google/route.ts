import { NextRequest, NextResponse } from 'next/server';

// Google Vertex AI API configuration
// Note: For production, you would typically use Google Cloud's OAuth2 or service account credentials
// This implementation assumes an API key with Vertex AI access

// Vertex AI endpoint format
const getVertexAIEndpoint = (location: string = 'us-central1') => {
  return `https://${location}-aiplatform.googleapis.com/v1/projects`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      model,
      prompt,
      apiKey,
      sampleCount,
      aspectRatio,
      image,
      mask,
      negativePrompt,
      seed,
    } = body;

    console.log('[Google API] Received request:', {
      model,
      prompt: prompt?.substring(0, 100),
      sampleCount,
      aspectRatio,
      hasImage: !!image,
      hasMask: !!mask,
    });

    // For Vertex AI, apiKey is actually the access token or API key
    // In production, you would use OAuth2 or service accounts
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key or access token' }, { status: 400 });
    }

    if (!model) {
      return NextResponse.json({ error: 'Missing model' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // Google Imagen API 请求体
    const requestBody: Record<string, any> = {
      model: `publishers/google/models/${model}`,
      prompt: prompt.substring(0, 1024), // Google 限制 1024 字符
    };

    // 输出数量
    if (sampleCount) {
      requestBody.sampleCount = Math.min(Math.max(1, sampleCount), 4);
    }

    // 宽高比
    if (aspectRatio) {
      requestBody.aspectRatio = aspectRatio;
    }

    // 负面提示词 ( Imagen 3 支持 )
    if (negativePrompt) {
      requestBody.negativePrompt = negativePrompt.substring(0, 1024);
    }

    // 随机种子
    if (seed !== undefined && seed !== null) {
      requestBody.seed = seed;
    }

    // 图片编辑模式
    if (image) {
      requestBody.image = {
        bytesBase64Encoded: image.split(',')[1] || image,
      };
    }

    if (mask) {
      requestBody.mask = {
        bytesBase64Encoded: mask.split(',')[1] || mask,
      };
    }

    console.log('[Google API] Request body keys:', Object.keys(requestBody));

    // 使用 API key 的方式 (不推荐用于生产环境)
    // 正确的做法是使用 OAuth2 access token
    let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;

    // 如果 apiKey 看起来像是一个 API key 而不是 access token
    if (apiKey.startsWith('AIza')) {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
    } else {
      // 如果是 access token，使用 Vertex AI 格式
      // 注意：这需要正确的项目 ID 和 location
      const projectId = 'your-project-id'; // 用户需要在配置中提供
      const location = 'us-central1';
      endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
    }

    console.log('[Google API] Using endpoint:', endpoint);

    let response;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 如果是 access token，添加 Authorization header
      if (!apiKey.startsWith('AIza') && !endpoint.includes('key=')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      console.log('[Google API] Response status:', response.status);
    } catch (fetchErr: any) {
      console.error('[Google API] Fetch failed:', fetchErr);
      return NextResponse.json(
        { error: `Network error: ${fetchErr?.message || 'Failed to connect to Google API'}` },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Google API] Error:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.error?.message || `API Error: ${response.status}` },
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
    console.log('[Google API] Response keys:', Object.keys(data));

    // 解析 Google 的响应
    // Vertex AI Imagen 返回格式:
    // {
    //   "predictions": [
    //     {
    //       "bytesBase64Encoded": "...",
    //       "mimeType": "image/png"
    //     }
    //   ]
    // }
    //
    // Generative Language API 返回格式:
    // {
    //   "predictions": [
    //     {
    //       "image": {
    //         "bytesBase64Encoded": "..."
    //       }
    //     }
    //   ]
    // }

    let images: string[] = [];

    // 处理 Vertex AI 格式
    if (data.predictions && Array.isArray(data.predictions)) {
      for (const pred of data.predictions) {
        let base64Data: string | undefined;

        // 尝试不同的格式
        if (pred.bytesBase64Encoded) {
          base64Data = pred.bytesBase64Encoded;
        } else if (pred.image?.bytesBase64Encoded) {
          base64Data = pred.image.bytesBase64Encoded;
        } else if (pred.image) {
          base64Data = typeof pred.image === 'string' ? pred.image : pred.image.bytesBase64Encoded;
        }

        if (base64Data) {
          const mimeType = pred.mimeType || 'image/png';
          images.push(`data:${mimeType};base64,${base64Data}`);
        }
      }
    }

    // 处理 Generative Language API 格式
    if (data.candidates && Array.isArray(data.candidates)) {
      for (const candidate of data.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.image?.bytesBase64Encoded) {
              images.push(`data:image/png;base64,${part.image.bytesBase64Encoded}`);
            }
          }
        }
      }
    }

    if (images.length > 0) {
      console.log('[Google API] Returning', images.length, 'images');
      if (images.length === 1) {
        return NextResponse.json({ image: images[0] });
      }
      return NextResponse.json({ images });
    }

    console.error('[Google API] No images in response:', JSON.stringify(data).substring(0, 500));
    return NextResponse.json({ error: 'No image in response', details: data }, { status: 500 });

  } catch (error) {
    console.error('[Google API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

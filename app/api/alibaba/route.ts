import { NextRequest, NextResponse } from 'next/server';

// 千问 API 端点
const DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com/api/v1/services/aigc';

// 图像编辑端点
const IMAGE_EDIT_ENDPOINT = `${DASHSCOPE_BASE}/multimodal-generation/generation`;
// 万相图像编辑端点
const WAN_IMAGE_EDIT_ENDPOINT = `${DASHSCOPE_BASE}/image-edit/edit`;
// 文生图端点
const IMAGE_GEN_ENDPOINT = `${DASHSCOPE_BASE}/image-generation/generation`;

// 模型分类映射
const MODEL_CATEGORIES: Record<string, string> = {
  // 千问图像编辑
  'qwen-image-edit-max': 'qwen-edit',
  'qwen-image-edit-max-2026-01-16': 'qwen-edit',
  'qwen-image-edit-plus': 'qwen-edit',
  'qwen-image-edit-plus-2025-12-15': 'qwen-edit',
  'qwen-image-edit-plus-2025-10-30': 'qwen-edit',
  'qwen-image-edit': 'qwen-edit',
  // 千问文生图
  'qwen-image-2.0-pro': 'qwen-t2i',
  'qwen-image-2.0-pro-2026-03-03': 'qwen-t2i',
  'qwen-image-2.0': 'qwen-t2i',
  'qwen-image-2.0-2026-03-03': 'qwen-t2i',
  'qwen-image-plus': 'qwen-t2i',
  'qwen-image-max': 'qwen-t2i',
  // 万相文生图
  'wan2.6-t2i': 'wan-t2i',
  'wan2.5-t2i-preview': 'wan-t2i',
  'wan2.2-t2i-plus': 'wan-t2i',
  'wan2.2-t2i-flash': 'wan-t2i',
  // 万相图像编辑
  'wan2.6-image-edit': 'wan-edit',
  'wan2.5-image-edit': 'wan-edit',
  'wan2.1-image-edit': 'wan-edit',
};

// 获取模型分类
function getModelCategory(model: string): string {
  return MODEL_CATEGORIES[model] || 'qwen-edit';
}

// 获取 API 端点
function getEndpoint(category: string): string {
  switch (category) {
    case 'qwen-edit':
      return IMAGE_EDIT_ENDPOINT;
    case 'qwen-t2i':
      return IMAGE_GEN_ENDPOINT;
    case 'wan-t2i':
    case 'wan-edit':
      return WAN_IMAGE_EDIT_ENDPOINT;
    default:
      return IMAGE_EDIT_ENDPOINT;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, images: additionalImages, mask, model, prompt, apiKey, category, outputCount, size } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    if (!image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    // 保留完整的 data URL 前缀
    const imageDataUrl = image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
    const modelName = model || 'qwen-image-edit-max';
    const modelCategory = category || getModelCategory(modelName);
    const endpoint = getEndpoint(modelCategory);

    console.log('[API] Model:', modelName);
    console.log('[API] Category:', modelCategory);
    console.log('[API] Endpoint:', endpoint);

    // 构建请求
    let requestBody: any;

    if (modelCategory === 'qwen-edit' || modelCategory === 'qwen-t2i') {
      // 千问图像编辑/文生图 API 格式
      const messages: any[] = [
        { image: imageDataUrl },
        { text: prompt || 'enhance this image' }
      ];

      // 添加额外图片 (多图输入)
      if (additionalImages && additionalImages.length > 0) {
        for (const img of additionalImages) {
          const imgDataUrl = img.startsWith('data:') ? img : `data:image/png;base64,${img}`;
          messages.push({ image: imgDataUrl });
        }
      }

      requestBody = {
        model: modelName,
        input: {
          messages: [
            {
              role: 'user',
              content: messages
            }
          ]
        },
        parameters: {
          n: outputCount || 1, // 多图输出
          size: size || '1024x1024',
          watermark: false,
        }
      };
    } else if (modelCategory === 'wan-edit') {
      // 万相图像编辑 API 格式
      const inputImages = [imageDataUrl];
      if (additionalImages && additionalImages.length > 0) {
        for (const img of additionalImages) {
          const imgDataUrl = img.startsWith('data:') ? img : `data:image/png;base64,${img}`;
          inputImages.push(imgDataUrl);
        }
      }

      requestBody = {
        model: modelName,
        input: {
          images: inputImages,
          prompt: prompt || 'enhance this image',
        },
        parameters: {
          n: outputCount || 1,
          size: size || '1024x1024',
        }
      };
    } else if (modelCategory === 'wan-t2i') {
      // 万相文生图 API 格式
      requestBody = {
        model: modelName,
        input: {
          prompt: prompt || 'a beautiful image',
        },
        parameters: {
          n: outputCount || 1,
          size: size || '1024x1024',
        }
      };
    }

    console.log('[API] Request body:', JSON.stringify(requestBody).substring(0, 500));

    const response = await fetch(endpoint, {
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

    // 解析响应
    const images: string[] = [];

    // 千问响应格式
    if (data.output?.choices?.[0]?.message?.content) {
      const content = data.output.choices[0].message.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.image) {
            images.push(item.image);
          }
        }
      }
    }

    // 万相响应格式
    if (data.output?.images) {
      for (const img of data.output.images) {
        if (img.image) {
          images.push(img.image);
        }
      }
    }

    if (images.length > 0) {
      // 如果是多图输出，返回所有图片
      if (images.length > 1) {
        // 下载所有图片
        const downloadedImages: string[] = [];
        for (const imgUrl of images) {
          try {
            const imageResponse = await fetch(imgUrl);
            const imageBlob = await imageResponse.blob();
            const base64 = await blobToBase64(imageBlob);
            downloadedImages.push(base64);
          } catch (e) {
            console.error('[API] Failed to download image:', e);
          }
        }
        return NextResponse.json({ images: downloadedImages });
      }

      // 单图返回
      console.log('[API] Fetching image from:', images[0]);
      const imageResponse = await fetch(images[0]);
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

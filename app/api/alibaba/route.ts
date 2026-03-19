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
    case 'qwen-t2i':
      // 千问编辑和千问文生图都使用 multimodal-generation 端点
      return IMAGE_EDIT_ENDPOINT;
    case 'wan-t2i':
      // 万相文生图使用 image-generation 端点
      return IMAGE_GEN_ENDPOINT;
    case 'wan-edit':
      return WAN_IMAGE_EDIT_ENDPOINT;
    default:
      return IMAGE_EDIT_ENDPOINT;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, images: additionalImages, mask, model, prompt, apiKey, category, outputCount, size, mode, direction, ratio, negative_prompt, prompt_extend, seed, strength } = body;

    console.log('[API] Received image:', !!image, 'mode:', mode, 'model:', model, 'category:', category, 'direction:', direction, 'ratio:', ratio, 'negative_prompt:', negative_prompt, 'prompt_extend:', prompt_extend, 'seed:', seed);

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    // 文生图模式不需要图片
    const modelName = model || 'qwen-image-edit-max';
    const modelCategory = category || getModelCategory(modelName);

    // 根据 mode 或 category 判断是否需要图片
    // t2i 模式不需要图片
    const needsImage = mode !== 't2i' && modelCategory !== 'wan-t2i' && modelCategory !== 'qwen-t2i';

    console.log('[API] needsImage:', needsImage, 'modelCategory:', modelCategory);

    if (needsImage && !image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    // 保留完整的 data URL 前缀 (只有存在图片时才处理)
    const imageDataUrl = image ? (image.startsWith('data:') ? image : `data:image/png;base64,${image}`) : undefined;
    const endpoint = getEndpoint(modelCategory);

    console.log('[API] Model:', modelName);
    console.log('[API] Category:', modelCategory);
    console.log('[API] Endpoint:', endpoint);

    // 构建请求
    let requestBody: any;

    if (modelCategory === 'qwen-edit') {
      // 千问图像编辑 API 格式
      // 注意：千问编辑不需要 mask 参数，局部重绘通过提示词描述即可
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

      // 构建输入消息
      const inputMessages: any = {
        role: 'user',
        content: messages
      };

      // 智能扩图模式 - 千问编辑模型支持 extra.outpaint 参数
      const input: any = { messages: [inputMessages] };
      if (mode === 'outpaint' && direction && ratio) {
        console.log('[API] Outpaint for qwen-edit - direction:', direction, 'ratio:', ratio);
        input.extra = {
          outpaint: {
            direction: direction === 'all' ? ['top', 'bottom', 'left', 'right'] : [direction],
            ratio: ratio / 100,
          }
        };
      }

      requestBody = {
        model: modelName,
        input,
        parameters: {
          n: outputCount || 1, // 多图输出
          size: size || '1024*1024',
          watermark: false,
          // 千问新增参数
          ...(negative_prompt && { negative_prompt }),
          prompt_extend: prompt_extend !== false, // 默认开启
          ...(seed !== undefined && seed !== null && { seed }),
        }
      };
    } else if (modelCategory === 'qwen-t2i') {
      // 千问文生图 API 格式 (不需要图片)
      const messages: any[] = [
        { text: prompt || 'a beautiful image' }
      ];

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
          n: outputCount || 1,
          size: size || '1024*1024',
          watermark: false,
          prompt_extend: true,
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

      // 处理 mask (局部重绘)
      const maskDataUrl = mask ? (mask.startsWith('data:') ? mask : `data:image/png;base64,${mask}`) : undefined;

      // 根据 mode 设置正确的 function
      let functionName = 'description_edit'; // 默认指令编辑
      if (mode === 'inpaint' && maskDataUrl) {
        functionName = 'description_edit_with_mask';
      } else if (mode === 'outpaint') {
        functionName = 'image_expand';
      }

      // 构建 input 对象
      const input: any = {
        function: functionName,
        images: inputImages,
        prompt: prompt || 'enhance this image',
      };

      // 局部重绘模式需要 mask
      if (mode === 'inpaint' && maskDataUrl) {
        input.mask = maskDataUrl;
      }

      // 智能扩图模式 - 万相使用 image_expand function，通过 extra 指定扩图参数
      if (mode === 'outpaint' && direction && ratio) {
        input.extra = {
          image_expand: {
            direction: direction === 'all' ? ['top', 'bottom', 'left', 'right'] : [direction],
            ratio: ratio / 100, // 转换为百分比 (10-50 -> 0.1-0.5)
          }
        };
      }

      requestBody = {
        model: modelName,
        input,
        parameters: {
          n: outputCount || 1,
          size: size || '1024*1024',
          // 万相 strength 参数，控制修改幅度 (0.0-1.0，默认 0.5)
          ...(strength !== undefined && { strength: strength || 0.5 }),
        }
      };
    } else if (modelCategory === 'wan-t2i') {
      // 万相文生图 API 格式 - 使用 messages 格式
      requestBody = {
        model: modelName,
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { text: prompt || 'a beautiful image' }
              ]
            }
          ]
        },
        parameters: {
          n: outputCount || 1,
          size: size || '1024*1024',
        }
      };
    }

    console.log('[API] Request body:', JSON.stringify(requestBody).substring(0, 500));

    // 检查是否需要异步调用
    const needsAsync = modelCategory === 'wan-t2i';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(needsAsync ? { 'X-DashScope-Async': 'enable' } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] Response status:', response.status);

    // 如果返回错误状态码
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

    const responseData = await response.json();

    // 如果返回task_id，说明是异步调用，需要轮询获取结果
    if (responseData.request_id && needsAsync) {
      console.log('[API] Async task started, request_id:', responseData.request_id);

      // 轮询任务状态
      const taskId = responseData.request_id;
      const maxRetries = 60; // 最多等待60次
      const pollInterval = 3000; // 3秒轮询一次

      for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const taskResponse = await fetch(`${DASHSCOPE_BASE}/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        const taskData = await taskResponse.json();
        console.log('[API] Task status:', taskData.output?.task_status);

        if (taskData.output?.task_status === 'SUCCEEDED') {
          // 任务成功，获取图片
          if (taskData.output?.choices?.[0]?.message?.content?.[0]?.image) {
            const imageUrl = taskData.output.choices[0].message.content[0].image;
            // 下载图片
            const imageResponse = await fetch(imageUrl);
            const imageBlob = await imageResponse.blob();
            const base64 = await blobToBase64(imageBlob);
            return NextResponse.json({ image: base64 });
          }
        } else if (taskData.output?.task_status === 'FAILED') {
          throw new Error(taskData.message || 'Task failed');
        }
      }

      throw new Error('Task timeout');
    }

    const data = responseData;
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

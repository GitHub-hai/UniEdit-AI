// MiniMax provider for prompt optimization and image generation

import { ImageProvider, EditRequest } from '../types';

const API_ROUTE = '/api/minimax';
const MINI_MAX_API_ENDPOINT = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

// MiniMax 模型分类
const MODEL_CATEGORIES: Record<string, string> = {
  'image-01': 'minimax-t2i',        // image-01 支持 T2I 和 I2I
  'image-01-live': 'minimax-live',   // image-01-live 仅支持 T2I
};

// 获取模型分类
function getModelCategory(model: string): string {
  return MODEL_CATEGORIES[model] || 'minimax-t2i';
}

const SYSTEM_PROMPT = `You are an expert image editing prompt engineer. Your task is to transform simple user instructions into detailed, professional English prompts for AI image generation models.

Guidelines:
1. Start with the main subject and composition
2. Add specific details about lighting (soft, dramatic, golden hour, etc.)
3. Include texture and material descriptions
4. Specify color palette and mood
5. Add technical quality descriptors (high detail, 8k, photorealistic, etc.)
6. Keep prompts concise but descriptive (50-150 words)
7. Output ONLY the optimized prompt, no explanations`;

export async function optimizePrompt(
  userInstruction: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('MiniMax API key is required');
  }

  if (!userInstruction.trim()) {
    throw new Error('Please enter an instruction to optimize');
  }

  const response = await fetch(MINI_MAX_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.5',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userInstruction,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to optimize prompt');
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid response from MiniMax API');
  }

  return data.choices[0].message.content.trim();
}

export async function validateMiniMaxKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(MINI_MAX_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export const minimaxProvider: ImageProvider = {
  id: 'minimax',
  name: 'MiniMax',
  models: [
    { id: 'image-01', name: 'Image 01' },
    { id: 'image-01-live', name: 'Image 01 Live' },
  ],

  getModelCategory,

  async validateKey(key: string): Promise<boolean> {
    return key.length > 0;
  },

  async generate(req: EditRequest, apiKey: string): Promise<Blob> {
    console.log('[MiniMax] Starting generation...');
    console.log('[MiniMax] Mode:', req.mode);
    console.log('[MiniMax] Model:', req.model);

    // 处理图片
    let imageBase64: string | undefined;
    if (req.image) {
      imageBase64 = await blobToBase64(req.image);
      console.log('[MiniMax] Image base64 length:', imageBase64?.length);
    }

    // 获取模型分类
    const model = req.model || 'image-01';
    const modelCategory = getModelCategory(model);

    // 判断是否是 I2I 模式 (有图片输入或 subject_reference)
    const isI2I = !!imageBase64;

    // 构建 subject_reference (用于 I2I)
    let subjectReference: Array<{ type: string; image_file: string }> | undefined;
    if (isI2I && imageBase64) {
      // MiniMax I2I 需要将图片上传或使用 URL
      // 这里我们直接使用 base64 格式
      subjectReference = [
        {
          type: 'character',
          image_file: imageBase64, // MiniMax 支持 base64
        },
      ];
    } else if (!isI2I) {
      // T2I 模式不发送任何图片相关字段
      subjectReference = undefined;
    }

    // 获取 aspect_ratio
    let aspectRatio = '1:1';
    if (req.dimensions) {
      const { width, height } = req.dimensions;
      const ratio = width / height;
      if (Math.abs(ratio - 1) < 0.1) aspectRatio = '1:1';
      else if (Math.abs(ratio - 16 / 9) < 0.1) aspectRatio = '16:9';
      else if (Math.abs(ratio - 4 / 3) < 0.1) aspectRatio = '4:3';
      else if (Math.abs(ratio - 3 / 2) < 0.1) aspectRatio = '3:2';
      else if (Math.abs(ratio - 2 / 3) < 0.1) aspectRatio = '2:3';
      else if (Math.abs(ratio - 3 / 4) < 0.1) aspectRatio = '3:4';
      else if (Math.abs(ratio - 9 / 16) < 0.1) aspectRatio = '9:16';
      else if (Math.abs(ratio - 21 / 9) < 0.1) aspectRatio = '21:9';
    }

    // 确定 size
    let size: string | undefined;
    if (req.size) {
      size = req.size;
    } else if (req.scale) {
      // 根据 scale 计算输出尺寸
      const maxSize = req.scale >= 4 ? 2048 : 1024 * req.scale;
      size = `${maxSize}*${maxSize}`;
    }

    try {
      const response = await fetch(API_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 只在 I2I 模式发送图片
          ...(isI2I && { image: imageBase64 }),
          model: model,
          prompt: req.prompt || 'enhance this image',
          apiKey: apiKey,
          // 额外参数
          outputCount: req.outputCount || 1,
          size: size,
          aspect_ratio: aspectRatio,
          // MiniMax 支持的参数
          negative_prompt: req.negative_prompt,
          seed: req.seed,
          n: req.outputCount || 1,
          prompt_optimizer: req.prompt_extend,
          aigc_watermark: false,
          response_format: 'url',
          // I2I 模式
          subject_reference: subjectReference,
        }),
      });

      console.log('[MiniMax] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MiniMax] Error response text:', errorText);
        let errorObj: { error?: string; message?: string } = {};
        try {
          errorObj = JSON.parse(errorText);
        } catch {}
        const errorMsg = errorObj.error || errorObj.message || `API Error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('[MiniMax] Response received');

      if (data.images && data.images.length > 0) {
        // 多图返回，取第一张
        const firstImage = data.images[0];
        const responseBlob = await fetch(firstImage).then(r => r.blob());
        return responseBlob;
      }

      if (data.image) {
        const responseBlob = await fetch(data.image).then(r => r.blob());
        return responseBlob;
      }

      throw new Error('No image in response');
    } catch (error) {
      console.error('[MiniMax] Fetch error:', error);
      throw error;
    }
  },
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

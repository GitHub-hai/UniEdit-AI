import { ImageProvider, EditRequest } from '../types';

const API_ROUTE = '/api/alibaba';

// 千问模型分类
const MODEL_CATEGORIES: Record<string, string> = {
  // 图像编辑
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
  // 万相文生图 (wanx-v1)
  'wanx-v1': 'wan-t2i',
  // 万相图像编辑 (已废弃，API Key不支持)
  // 'wan2.6-image-edit': 'wan-edit', // Model not exist
};

export const alibabaProvider: ImageProvider = {
  id: 'alibaba',
  name: 'Alibaba DashScope',
  models: [
    // 千问图像编辑 (推荐)
    { id: 'qwen-image-edit-max', name: 'Qwen Image Edit Max (推荐)' },
    { id: 'qwen-image-edit-plus', name: 'Qwen Image Edit Plus' },
    // 千问文生图
    { id: 'qwen-image-2.0-pro', name: 'Qwen Image 2.0 Pro (推荐)' },
    { id: 'qwen-image-2.0', name: 'Qwen Image 2.0' },
    // 万相文生图
    { id: 'wanx-v1', name: '万相 Wanx V1 (文生图)' },
  ],

  // 获取模型分类
  getModelCategory(model: string): string {
    return MODEL_CATEGORIES[model] || 'qwen-edit';
  },

  async validateKey(key: string): Promise<boolean> {
    return key.length > 0;
  },

  async generate(req: EditRequest, apiKey: string): Promise<Blob> {
    console.log('[Alibaba] Starting generation via proxy...');
    console.log('[Alibaba] Mode:', req.mode);
    console.log('[Alibaba] Model:', req.model);

    // 文生图模式不需要图片
    let imageBase64: string | undefined;
    console.log('[Alibaba] req.image:', !!req.image, 'req.image type:', req.image?.constructor?.name);
    if (req.image) {
      imageBase64 = await blobToBase64(req.image);
      console.log('[Alibaba] Image base64 length:', imageBase64?.length);
    }

    // 处理多图输入
    let additionalImages: string[] = [];
    if (req.images && req.images.length > 0) {
      for (const img of req.images) {
        const base64 = await blobToBase64(img);
        additionalImages.push(base64);
      }
    }

    let maskBase64: string | undefined;
    if (req.mask) {
      maskBase64 = await blobToBase64(req.mask);
    }

    // 获取模型分类
    const category = this.getModelCategory?.(req.model || 'qwen-image-edit-max') || 'qwen-edit';

    try {
      const response = await fetch(API_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          images: additionalImages,
          mask: maskBase64,
          model: req.model || 'qwen-image-edit-max',
          prompt: req.prompt || 'enhance this image',
          apiKey: apiKey,
          // 额外参数
          category: category,
          outputCount: req.outputCount || 1,
          // 画质增强模式：根据 scale 计算输出尺寸
          size: req.scale ? calculateUpscaleSize(req.scale) : (req.size || '1024*1024'),
          // 千问支持
          negative_prompt: req.negative_prompt,
          prompt_extend: req.prompt_extend,
          seed: req.seed,
          // 万相支持
          strength: req.strength,
        }),
      });

      console.log('[Alibaba] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Alibaba] Error response text:', errorText);
        let errorObj: { error?: string; message?: string } = {};
        try {
          errorObj = JSON.parse(errorText);
        } catch {}
        const errorMsg = errorObj.error || errorObj.message || `API Error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('[Alibaba] Response received');

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
      console.error('[Alibaba] Fetch error:', error);
      throw error;
    }
  },
};

// 根据 scale 计算输出尺寸
function calculateUpscaleSize(scale: number): string {
  // 假设原图最大边为 1024，增强后的尺寸
  // 2x = 2048, 4x = 4096 (但API最大支持2048)
  const maxSize = scale >= 4 ? 2048 : 1024 * scale;
  return `${maxSize}*${maxSize}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

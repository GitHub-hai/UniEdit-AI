import { ImageProvider, EditRequest } from '../types';

const API_ROUTE = '/api/alibaba';

// 千问模型分类
const MODEL_CATEGORIES: Record<string, string> = {
  // 图像编辑
  'qwen-image-edit-max': 'edit',
  'qwen-image-edit-max-2026-01-16': 'edit',
  'qwen-image-edit-plus': 'edit',
  'qwen-image-edit-plus-2025-12-15': 'edit',
  'qwen-image-edit-plus-2025-10-30': 'edit',
  'qwen-image-edit': 'edit',
  // 千问文生图
  'qwen-image-2.0-pro': 't2i',
  'qwen-image-2.0-pro-2026-03-03': 't2i',
  'qwen-image-2.0': 't2i',
  'qwen-image-2.0-2026-03-03': 't2i',
  'qwen-image-plus': 't2i',
  'qwen-image-max': 't2i',
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
    { id: 'wan2.6-t2i', name: '万相 2.6 文生图' },
    // 万相图像编辑
    { id: 'wan2.6-image-edit', name: '万相 2.6 图像编辑' },
  ],

  // 获取模型分类
  getModelCategory(model: string): string {
    return MODEL_CATEGORIES[model] || 'edit';
  },

  async validateKey(key: string): Promise<boolean> {
    return key.length > 0;
  },

  async generate(req: EditRequest, apiKey: string): Promise<Blob> {
    console.log('[Alibaba] Starting generation via proxy...');
    console.log('[Alibaba] Mode:', req.mode);
    console.log('[Alibaba] Model:', req.model);

    // 转换图片为 base64
    const imageBase64 = await blobToBase64(req.image);
    console.log('[Alibaba] Image size:', imageBase64.length);

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
          size: req.size || '1024x1024',
        }),
      });

      console.log('[Alibaba] Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[Alibaba] Error:', error);
        throw new Error(error.error || 'API Error');
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

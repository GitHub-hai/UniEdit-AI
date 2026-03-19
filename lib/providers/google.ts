// Google Vertex AI provider for Imagen models

import { ImageProvider, EditRequest } from '../types';

const API_ROUTE = '/api/google';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Google Vertex AI Imagen models
const MODEL_CATEGORIES: Record<string, string> = {
  'imagen-3': 'imagen',
  'imagen-2': 'imagen',
  'imagen-3-fast': 'imagen',
};

function getModelCategory(model: string): string {
  return MODEL_CATEGORIES[model] || 'imagen';
}

export const googleProvider: ImageProvider = {
  id: 'google',
  name: 'Google Vertex AI',
  models: [
    { id: 'imagen-3', name: 'Imagen 3' },
    { id: 'imagen-3-fast', name: 'Imagen 3 Fast' },
    { id: 'imagen-2', name: 'Imagen 2' },
  ],

  getModelCategory,

  async validateKey(key: string): Promise<boolean> {
    // Google API key validation is complex - requires project ID and location
    // For now, just check if key exists and has reasonable length
    return key.length > 10;
  },

  async generate(req: EditRequest, apiKey: string): Promise<Blob> {
    console.log('[Google] Starting generation...');
    console.log('[Google] Mode:', req.mode);
    console.log('[Google] Model:', req.model);

    const model = req.model || 'imagen-3';

    // 处理图片
    let imageBase64: string | undefined;
    if (req.image) {
      imageBase64 = await blobToBase64(req.image);
      console.log('[Google] Image base64 length:', imageBase64?.length);
    }

    // 处理 mask
    let maskBase64: string | undefined;
    if (req.mask) {
      maskBase64 = await blobToBase64(req.mask);
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
    }

    // 确定输出数量
    const sampleCount = req.outputCount || 1;

    try {
      console.log('[Google] Calling API route:', API_ROUTE);

      const response = await fetch(API_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: req.prompt || 'enhance this image',
          apiKey: apiKey,
          // 基础参数
          sampleCount: Math.min(Math.max(1, sampleCount), 4), // Google 限制 1-4
          aspectRatio: aspectRatio,
          // 图片编辑模式
          ...(imageBase64 && {
            image: imageBase64,
          }),
          ...(maskBase64 && {
            mask: maskBase64,
          }),
          // 高级参数
          ...(req.negative_prompt && {
            negativePrompt: req.negative_prompt,
          }),
          ...(req.seed !== undefined && req.seed !== null && {
            seed: req.seed,
          }),
          // Imagen 支持的参数
          mode: req.mode,
        }),
      });

      console.log('[Google] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Google] Error response text:', errorText);
        let errorObj: { error?: string; message?: string } = {};
        try {
          errorObj = JSON.parse(errorText);
        } catch {}
        const errorMsg = errorObj.error || errorObj.message || `API Error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('[Google] Response received');

      // 解析响应
      if (data.images && data.images.length > 0) {
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
      console.error('[Google] Fetch error:', error);
      throw error;
    }
  },
};

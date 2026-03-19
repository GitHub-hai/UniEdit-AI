// OpenAI provider for DALL-E and GPT Image models

import { ImageProvider, EditRequest } from '../types';

const API_ROUTE = '/api/openai';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const openAIProvider: ImageProvider = {
  id: 'openai',
  name: 'OpenAI',
  models: [
    { id: 'dall-e-3', name: 'DALL-E 3' },
    { id: 'dall-e-2', name: 'DALL-E 2' },
    { id: 'gpt-image-1', name: 'GPT Image 1' },
  ],

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async generate(req: EditRequest, apiKey: string): Promise<Blob> {
    console.log('[OpenAI] Starting generation...');
    console.log('[OpenAI] Mode:', req.mode);
    console.log('[OpenAI] Model:', req.model);

    const model = req.model || 'dall-e-3';

    // 处理图片
    let imageBase64: string | undefined;
    if (req.image) {
      imageBase64 = await blobToBase64(req.image);
      console.log('[OpenAI] Image base64 length:', imageBase64?.length);
    }

    // 处理 mask
    let maskBase64: string | undefined;
    if (req.mask) {
      maskBase64 = await blobToBase64(req.mask);
    }

    // 构建请求
    const requestBody: Record<string, any> = {
      model: model,
      prompt: req.prompt,
    };

    // gpt-image-1 支持 JSON 格式
    if (model === 'gpt-image-1') {
      // gpt-image-1: 新 API，JSON 格式
      requestBody.n = req.outputCount || 1;

      // 图片尺寸
      if (req.dimensions) {
        requestBody.width = req.dimensions.width;
        requestBody.height = req.dimensions.height;
      } else if (req.size) {
        // 解析 size 格式 "1024*1024"
        const [width, height] = req.size.split('*').map(Number);
        if (!isNaN(width) && !isNaN(height)) {
          requestBody.width = width;
          requestBody.height = height;
        }
      }

      // 如果是编辑模式且有图片
      if ((req.mode === 'edit' || req.mode === 'inpaint') && imageBase64) {
        requestBody.image = imageBase64;
        if (req.mode === 'inpaint' && maskBase64) {
          requestBody.mask = maskBase64;
        }
      }

      // GPT Image 支持 quality 参数
      if ((req as any).quality) {
        requestBody.quality = (req as any).quality;
      }

      // style 参数
      if ((req as any).style) {
        requestBody.style = (req as any).style;
      }

      console.log('[OpenAI] Using new GPT Image API');
    } else {
      // DALL-E API 使用旧格式 multipart/form-data
      const formData = new FormData();

      if (!req.image && (req.mode === 'edit' || req.mode === 'inpaint' || req.mode === 'upscale')) {
        throw new Error('DALL-E requires an image for editing modes');
      }

      // 添加图片
      if (req.image) {
        formData.append('image', req.image);
      }

      // 添加 mask（局部重绘需要）
      if (req.mode === 'inpaint' && req.mask) {
        formData.append('mask', req.mask);
      }

      // 添加提示词
      formData.append('prompt', req.prompt || 'enhance this image');

      // 添加模型
      formData.append('model', model);

      // 添加数量
      formData.append('n', String(req.outputCount || 1));

      // DALL-E 3 支持的尺寸
      const dallE3Sizes = ['1024x1024', '1024x1792', '1792x1024'];
      // DALL-E 2 支持的尺寸
      const dallE2Sizes = ['256x256', '512x512', '1024x1024'];

      // 根据尺寸确定 size
      let size = '1024x1024';
      if (req.dimensions) {
        const w = req.dimensions.width;
        const h = req.dimensions.height;
        size = `${w}x${h}`;
      } else if (req.size) {
        size = req.size.replace('*', 'x');
      }

      // 验证尺寸是否支持
      const supportedSizes = model === 'dall-e-3' ? dallE3Sizes : dallE2Sizes;
      if (!supportedSizes.includes(size)) {
        size = '1024x1024'; // 默认回退
      }

      formData.append('size', size);

      // 对于 DALL-E，调用不同的端点
      let endpoint = 'https://api.openai.com/v1/images/generations';
      if (req.mode === 'inpaint' && req.image && req.mask) {
        endpoint = 'https://api.openai.com/v1/images/edits';
      }

      console.log('[OpenAI] Using DALL-E API:', endpoint);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
          const imageUrl = data.data[0].url || data.data[0].b64_json;
          if (!imageUrl) {
            throw new Error('No image URL in response');
          }

          // 如果是 base64，直接返回
          if (data.data[0].b64_json) {
            const blob = await fetch(`data:image/png;base64,${data.data[0].b64_json}`).then(r => r.blob());
            return blob;
          }

          // 下载图片
          const imageResponse = await fetch(imageUrl);
          return imageResponse.blob();
        }

        throw new Error('No image in response');
      } catch (error) {
        console.error('[OpenAI] Fetch error:', error);
        throw error;
      }
    }

    // GPT Image API 调用（通过代理）
    try {
      const response = await fetch(API_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestBody,
          apiKey: apiKey,
        }),
      });

      console.log('[OpenAI] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenAI] Error response text:', errorText);
        let errorObj: { error?: string; message?: string } = {};
        try {
          errorObj = JSON.parse(errorText);
        } catch {}
        const errorMsg = errorObj.error || errorObj.message || `API Error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('[OpenAI] Response received');

      // 解析响应
      if (data.images && data.images.length > 0) {
        const firstImage = data.images[0];
        const responseBlob = await fetch(firstImage).then(r => r.blob());
        return responseBlob;
      }

      if (data.image) {
        // 检查是否是 base64 格式
        if (typeof data.image === 'string' && data.image.startsWith('data:')) {
          const blob = await fetch(data.image).then(r => r.blob());
          return blob;
        }
        const responseBlob = await fetch(data.image).then(r => r.blob());
        return responseBlob;
      }

      throw new Error('No image in response');
    } catch (error) {
      console.error('[OpenAI] Fetch error:', error);
      throw error;
    }
  },
};

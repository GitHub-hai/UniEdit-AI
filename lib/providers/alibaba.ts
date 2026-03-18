import { ImageProvider, EditRequest } from '../types';

// 华北2（北京）正确地址
const DASHSCOPE_API_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations';

export const alibabaProvider: ImageProvider = {
  id: 'alibaba',
  name: 'Alibaba DashScope',
  models: [
    { id: 'wanx-v2', name: 'Wanx v2' },
    { id: 'wanx-v1', name: 'Wanx v1' },
  ],

  async validateKey(key: string): Promise<boolean> {
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async generate(req: EditRequest, apiKey: string): Promise<Blob> {
    // Convert image to base64
    const imageBase64 = await blobToBase64(req.image);

    // Build request body based on mode
    const requestBody: any = {
      model: req.model || 'wanx-v2',
      prompt: req.prompt,
    };;

    // Different parameters for different modes
    if (req.mode === 'edit') {
      // Image editing - send as base64
      requestBody.image = imageBase64;
    } else if (req.mode === 'inpaint' && req.mask) {
      // Inpainting - need mask
      const maskBase64 = await blobToBase64(req.mask);
      requestBody.image = imageBase64;
      requestBody.mask = maskBase64;
    } else if (req.mode === 'outpaint') {
      // Outpainting
      requestBody.image = imageBase64;
      requestBody.size = '1920x1080';
    } else if (req.mode === 'upscale') {
      // Upscaling
      requestBody.image = imageBase64;
    }

    const response = await fetch(DASHSCOPE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.data && data.data[0] && data.data[0].url) {
      const imageUrl = data.data[0].url;
      const imageResponse = await fetch(imageUrl);
      return imageResponse.blob();
    }

    throw new Error('No image generated');
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

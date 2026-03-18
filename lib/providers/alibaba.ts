import { ImageProvider, EditRequest } from '../types';

// Use Next.js API route as proxy to avoid CORS
const API_ROUTE = '/api/alibaba';

export const alibabaProvider: ImageProvider = {
  id: 'alibaba',
  name: 'Alibaba DashScope',
  models: [
    { id: 'wanx-v2', name: 'Wanx v2' },
    { id: 'wanx-v1', name: 'Wanx v1' },
  ],

  async validateKey(key: string): Promise<boolean> {
    // Can't validate directly due to CORS, assume valid if not empty
    return key.length > 0;
  },

  async generate(req: EditRequest, apiKey: string): Promise<Blob> {
    console.log('[Alibaba] Starting generation via proxy...');
    console.log('[Alibaba] Mode:', req.mode);
    console.log('[Alibaba] Model:', req.model);

    // Convert image to base64
    const imageBase64 = await blobToBase64(req.image);
    console.log('[Alibaba] Image size:', imageBase64.length);

    let maskBase64: string | undefined;
    if (req.mask) {
      maskBase64 = await blobToBase64(req.mask);
    }

    try {
      const response = await fetch(API_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          mask: maskBase64,
          model: req.model || 'wanx-v2',
          prompt: req.prompt || 'enhance this image',
          apiKey: apiKey,
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

      if (data.image) {
        // Convert base64 back to blob
        const response = await fetch(data.image);
        return response.blob();
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

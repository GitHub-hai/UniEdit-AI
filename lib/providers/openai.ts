import { ImageProvider, EditRequest } from '../types';

export const openAIProvider: ImageProvider = {
  id: 'openai',
  name: 'OpenAI',
  models: [
    { id: 'dall-e-3', name: 'DALL-E 3' },
    { id: 'dall-e-2', name: 'DALL-E 2' },
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
    const formData = new FormData();

    // Add image
    formData.append('image', req.image);

    // Add prompt
    formData.append('prompt', req.prompt);

    // Add model
    formData.append('model', req.model || 'dall-e-3');

    // Add size (DALL-E 3 only supports 1024x1024, 1024x1792, 1792x1024)
    if (req.mode === 'edit' || req.mode === 'inpaint') {
      formData.append('size', '1024x1024');
    }

    // For inpainting, we need to send mask
    if (req.mode === 'inpaint' && req.mask) {
      formData.append('mask', req.mask);
    }

    // Add n (number of images)
    formData.append('n', '1');

    const endpoint = req.mode === 'inpaint'
      ? 'https://api.openai.com/v1/images/edits'
      : 'https://api.openai.com/v1/images/generations';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    const imageUrl = req.mode === 'inpaint'
      ? data.data[0].url
      : data.data[0].url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    return imageResponse.blob();
  },
};

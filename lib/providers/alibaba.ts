import { ImageProvider, EditRequest } from '../types';

const DASHSCOPE_API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

async function pollForResult(apiKey: string, requestId: string): Promise<Blob> {
  const maxRetries = 30;
  const interval = 2000;

  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));

    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/get-task`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) continue;

    const data = await response.json();

    if (data.output?.choices?.[0]?.message?.content?.[0]?.image) {
      const imageUrl = data.output.choices[0].message.content[0].image;
      const imageResponse = await fetch(imageUrl);
      return imageResponse.blob();
    }

    if (data.task_status === 'PENDING' || data.task_status === 'RUNNING') {
      continue;
    }

    throw new Error(data.message || 'Generation failed');
  }

  throw new Error('Timeout waiting for image generation');
}

export const alibabaProvider: ImageProvider = {
  id: 'alibaba',
  name: 'Alibaba DashScope',
  models: [
    { id: 'wanx-v2', name: 'Wanx v2' },
    { id: 'wanx-v1', name: 'Wanx v1' },
  ],

  async validateKey(key: string): Promise<boolean> {
    try {
      // Use a simple model list API to validate
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/models', {
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

    // Build the request based on mode
    let requestBody: any = {
      model: req.model || 'wanx-v2',
      input: {
        prompt: req.prompt,
      },
      parameters: {},
    };

    // For different modes
    if (req.mode === 'edit' || req.mode === 'inpaint') {
      requestBody.input.image = [
        {
          image: imageBase64.split(',')[1], // Remove data URL prefix
        },
      ];

      if (req.mode === 'inpaint' && req.mask) {
        // Add mask for inpainting
        const maskBase64 = await blobToBase64(req.mask);
        requestBody.input.image.push({
          mask: maskBase64.split(',')[1],
        });
      }
    } else if (req.mode === 'outpaint') {
      // Outpainting requires special handling
      requestBody.parameters = {
        size: '1920x1080',
        n: 1,
      };
      requestBody.input.image = [
        {
          image: imageBase64.split(',')[1],
        },
      ];
    } else if (req.mode === 'upscale') {
      // Upscaling
      requestBody.parameters = {
        scale: req.scale || 2,
      };
      requestBody.input.image = [
        {
          image: imageBase64.split(',')[1],
        },
      ];
    }

    const response = await fetch(DASHSCOPE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'disable',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    // Check for async or sync response
    if (data.output && data.output.choices && data.output.choices[0]) {
      const imageUrl = data.output.choices[0].message?.content?.[0]?.image;

      if (imageUrl) {
        // Fetch the generated image
        const imageResponse = await fetch(imageUrl);
        return imageResponse.blob();
      }
    }

    // If it's an async task, we need to poll for result
    if (data.request_id) {
      return await pollForResult(apiKey, data.request_id);
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

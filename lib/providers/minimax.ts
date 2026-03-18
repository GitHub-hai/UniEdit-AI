// MiniMax provider for prompt optimization

const MINI_MAX_API_ENDPOINT = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

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

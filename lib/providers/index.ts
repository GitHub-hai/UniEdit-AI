import { ImageProvider } from '../types';
import { openAIProvider } from './openai';
import { alibabaProvider } from './alibaba';

export const providers: Record<string, ImageProvider> = {
  openai: openAIProvider,
  alibaba: alibabaProvider,
  // Google, Replicate, Fal, MiniMax - add as needed
};

export function getProvider(id: string): ImageProvider | undefined {
  return providers[id];
}

export { openAIProvider } from './openai';
export { alibabaProvider } from './alibaba';
export { optimizePrompt, validateMiniMaxKey } from './minimax';

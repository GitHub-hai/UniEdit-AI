import { ImageProvider } from '../types';
import { openAIProvider } from './openai';
import { alibabaProvider } from './alibaba';
import { minimaxProvider } from './minimax';
import { googleProvider } from './google';

export const providers: Record<string, ImageProvider> = {
  openai: openAIProvider,
  alibaba: alibabaProvider,
  minimax: minimaxProvider,
  google: googleProvider,
};

export function getProvider(id: string): ImageProvider | undefined {
  return providers[id];
}

export { openAIProvider } from './openai';
export { alibabaProvider } from './alibaba';
export { minimaxProvider } from './minimax';
export { googleProvider } from './google';
export { optimizePrompt, validateMiniMaxKey } from './minimax';

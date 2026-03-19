import { ImageProvider } from '../types';
import { openAIProvider } from './openai';
import { alibabaProvider } from './alibaba';
import { minimaxProvider } from './minimax';

export const providers: Record<string, ImageProvider> = {
  openai: openAIProvider,
  alibaba: alibabaProvider,
  minimax: minimaxProvider,
};

export function getProvider(id: string): ImageProvider | undefined {
  return providers[id];
}

export { openAIProvider } from './openai';
export { alibabaProvider } from './alibaba';
export { minimaxProvider } from './minimax';
export { optimizePrompt, validateMiniMaxKey } from './minimax';

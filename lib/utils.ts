import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

export function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  return date.toLocaleDateString('zh-CN');
}

export function downloadImage(base64: string, filename: string = 'uniedit-result.png') {
  const link = document.createElement('a');
  link.href = base64;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', icon: '🔵' },
  { id: 'google', name: 'Google Vertex', icon: '🟢' },
  { id: 'alibaba', name: 'Alibaba DashScope', icon: '🟠' },
  { id: 'replicate', name: 'Replicate', icon: '⚫' },
  { id: 'fal', name: 'Fal', icon: '🟣' },
  { id: 'minimax', name: 'MiniMax', icon: '🔴' },
] as const;

export const MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: 'dall-e-3', name: 'DALL-E 3 (1024x1024)' },
    { id: 'dall-e-2', name: 'DALL-E 2 (1024x1024)' },
    { id: 'gpt-image-1', name: 'GPT Image 1' },
  ],
  google: [
    { id: 'imagen-3', name: 'Imagen 3' },
    { id: 'imagen-2', name: 'Imagen 2' },
  ],
  alibaba: [
    { id: 'wanx-v2', name: 'Wanx v2' },
    { id: 'wanx-v1', name: 'Wanx v1' },
  ],
  replicate: [
    { id: 'flux-pro', name: 'Flux Pro' },
    { id: 'flux-schnell', name: 'Flux Schnell' },
    { id: 'sdxl', name: 'Stable Diffusion XL' },
  ],
  fal: [
    { id: 'flux-pro-1.1', name: 'Flux Pro 1.1' },
    { id: 'sdxl-lightning', name: 'SDXL Lightning' },
  ],
  minimax: [
    { id: 'image-01', name: 'Image 01' },
  ],
};

export const MODE_TABS = [
  { id: 'edit', label: '智能编辑', icon: '✏️' },
  { id: 'inpaint', label: '局部重绘', icon: '🎨' },
  { id: 'outpaint', label: '智能扩图', icon: '🖼️' },
  { id: 'upscale', label: '画质增强', icon: '✨' },
] as const;

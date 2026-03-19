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

// 生成缩略图 - 将大图缩小到指定最大尺寸，减少存储大小
export async function generateThumbnail(
  base64: string,
  maxSize: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 计算缩放比例
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      // 创建画布并绘制缩略图
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // 输出为 base64 (使用 JPEG 格式减小体积)
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnail);
    };
    img.onerror = reject;
    img.src = base64;
  });
}

export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', icon: '🔵' },
  { id: 'google', name: 'Google Vertex', icon: '🟢' },
  { id: 'alibaba', name: 'Alibaba DashScope', icon: '🟠' },
  { id: 'replicate', name: 'Replicate', icon: '⚫' },
  { id: 'fal', name: 'Fal', icon: '🟣' },
  { id: 'minimax', name: 'MiniMax', icon: '🔴' },
] as const;

export const MODELS: Record<string, { id: string; name: string; category?: string }[]> = {
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
    // 千问图像编辑 (推荐)
    { id: 'qwen-image-edit-max', name: 'Qwen Image Edit Max (推荐)', category: 'edit' },
    { id: 'qwen-image-edit-plus', name: 'Qwen Image Edit Plus', category: 'edit' },
    // 千问文生图
    { id: 'qwen-image-2.0-pro', name: 'Qwen Image 2.0 Pro (推荐)', category: 't2i' },
    { id: 'qwen-image-2.0', name: 'Qwen Image 2.0', category: 't2i' },
    // 万相文生图
    { id: 'wan2.6-t2i', name: '万相 Wanx 2.6 (文生图)', category: 'qwen-t2i' },
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
    { id: 'image-01', name: 'Image 01', category: 't2i' },
    { id: 'image-01-live', name: 'Image 01 Live', category: 't2i' },
  ],
};

export const MODE_TABS = [
  { id: 'edit', label: '智能编辑', icon: '✏️' },
  { id: 'inpaint', label: '局部重绘', icon: '🎨' },
  { id: 'outpaint', label: '智能扩图', icon: '🖼️' },
  { id: 'upscale', label: '画质增强', icon: '✨' },
  { id: 't2i', label: '文生图', icon: '🌟' },
] as const;

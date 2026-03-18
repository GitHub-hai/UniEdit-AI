'use client';

import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useApp } from '@/lib/context';
import { formatFileSize, getImageDimensions } from '@/lib/utils';

export function ImageUploader() {
  const { originalImage, setOriginalImage } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; size: number } | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('文件大小不能超过 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setOriginalImage(base64);

      const dims = await getImageDimensions(base64);
      setImageInfo({
        ...dims,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  }, [setOriginalImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleClear = useCallback(() => {
    setOriginalImage(null);
    setImageInfo(null);
  }, [setOriginalImage]);

  if (originalImage) {
    return (
      <div className="space-y-3">
        <div className="relative h-32 rounded-xl overflow-hidden bg-[#2d2d2f] border border-white/5">
          <img
            src={originalImage}
            alt="Uploaded"
            className="w-full h-full object-contain"
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-all"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
        </div>
        {imageInfo && (
          <div className="text-xs text-[#86868b] space-y-1 px-1">
            <div className="flex justify-between">
              <span>尺寸</span>
              <span>{imageInfo.width} × {imageInfo.height}</span>
            </div>
            <div className="flex justify-between">
              <span>大小</span>
              <span>{formatFileSize(imageInfo.size)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`drop-zone rounded-xl p-6 text-center cursor-pointer transition-all ${
        isDragOver ? 'drag-over' : ''
      }`}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2997ff]/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-[#2997ff]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              点击上传图片
            </p>
            <p className="text-xs text-[#86868b] mt-1">
              或拖拽文件到此处
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#86868b]">
            <ImageIcon className="w-3 h-3" />
            <span>JPG, PNG, WebP (最大 20MB)</span>
          </div>
        </div>
      </label>
    </div>
  );
}

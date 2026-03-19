'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, RotateCcw, ImageIcon } from 'lucide-react';
import { useApp } from '@/lib/context';
import { downloadImage } from '@/lib/utils';
import { MaskCanvas } from './MaskCanvas';

interface ImageCompareProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onClearMask?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function ImageCompare({ onUndo, onRedo, onClearMask, canUndo, canRedo }: ImageCompareProps) {
  const { originalImage, resultImage, activeMode, brushSize, reset } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const position = (x / rect.width) * 100;
    setSliderPosition(position);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const position = (x / rect.width) * 100;
    setSliderPosition(position);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

  const handleReset = useCallback(() => {
    reset();
    onClearMask?.();
  }, [reset, onClearMask]);

  const handleDownload = useCallback(() => {
    if (resultImage) {
      downloadImage(resultImage, `uniedit-${Date.now()}.png`);
    }
  }, [resultImage]);

  // Show original only if no result
  if (!resultImage && originalImage) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-[#1d1d1f] m-4 rounded-2xl"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* Radial gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1d1d1f] via-[#0a0a0a] to-[#000000]" />

          {/* Image */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <img
              src={originalImage}
              alt="Original"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Mask Canvas (for inpainting) */}
          {activeMode === 'inpaint' && (
            <MaskCanvas
              imageSrc={originalImage}
              brushSize={brushSize}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 p-4 border-t border-white/5 bg-[#1d1d1f]">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
    );
  }

  // Show comparison view
  if (originalImage && resultImage) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-[#1d1d1f] m-4 rounded-2xl select-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* Radial gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1d1d1f] via-[#0a0a0a] to-[#000000]" />

          {/* Result image (full width) */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <img
              src={resultImage}
              alt="Result"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Original image (clipped) */}
          <div
            className="absolute inset-0 flex items-center justify-center p-6 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={originalImage}
              alt="Original"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg">
              原图
            </div>
          </div>

          {/* Result label */}
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg">
            结果
          </div>

          {/* Slider handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/30 cursor-ew-resize flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center -ml-5">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
                <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 p-4 border-t border-white/5 bg-[#1d1d1f]">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleDownload}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            下载结果
          </button>
        </div>
      </div>
    );
  }

  // Show result only (for t2i mode - no original image)
  if (resultImage && !originalImage) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-[#1d1d1f] m-4 rounded-2xl"
        >
          {/* Radial gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1d1d1f] via-[#0a0a0a] to-[#000000]" />

          {/* Result image */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <img
              src={resultImage}
              alt="Result"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Result label */}
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg">
            结果
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 p-4 border-t border-white/5 bg-[#1d1d1f]">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleDownload}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            下载结果
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] m-4 rounded-2xl">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-5 bg-[#1d1d1f] rounded-2xl flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-[#86868b]" />
        </div>
        <p className="text-[#86868b] text-[15px]">上传图片开始编辑</p>
        <p className="text-[#86868b]/60 text-xs mt-2">支持 PNG、JPG、WebP 格式</p>
      </div>
    </div>
  );
}

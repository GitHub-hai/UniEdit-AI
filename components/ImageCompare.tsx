'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, RotateCcw } from 'lucide-react';
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

  // Handle reset
  const handleReset = useCallback(() => {
    reset();
    onClearMask?.();
  }, [reset, onClearMask]);

  // Handle download
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
          className="flex-1 relative overflow-hidden bg-slate-100 m-4 rounded-xl"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* Image */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={originalImage}
              alt="Original"
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
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
        <div className="flex justify-center gap-3 p-4 border-t border-slate-200 bg-white">
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
          className="flex-1 relative overflow-hidden bg-slate-100 m-4 rounded-xl select-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* Result image (full width) */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={resultImage}
              alt="Result"
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />
          </div>

          {/* Original image (clipped) */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={originalImage}
              alt="Original"
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />
            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
              原图
            </div>
          </div>

          {/* Result label */}
          <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
            结果
          </div>

          {/* Slider handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-lg"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-3 bg-slate-400 rounded-full" />
                <div className="w-0.5 h-3 bg-slate-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 p-4 border-t border-slate-200 bg-white">
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
    <div className="flex-1 flex items-center justify-center bg-slate-100 m-4 rounded-xl">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
          <span className="text-4xl">🖼️</span>
        </div>
        <p className="text-slate-500">上传图片开始编辑</p>
      </div>
    </div>
  );
}

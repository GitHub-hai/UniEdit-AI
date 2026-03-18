'use client';

import { useRef, useCallback } from 'react';
import { useApp } from '@/lib/context';
import { ImageCompare } from './ImageCompare';

interface CanvasAreaProps {}

export function CanvasArea() {
  const { maskData, setMaskData } = useApp();
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);

  const handleMaskChange = useCallback((maskDataUrl: string) => {
    if (undoStackRef.current.length === 0 || undoStackRef.current[undoStackRef.current.length - 1] !== maskDataUrl) {
      undoStackRef.current.push(maskDataUrl);
      if (undoStackRef.current.length > 20) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length > 0) {
      const current = undoStackRef.current.pop();
      if (current) {
        redoStackRef.current.push(current);
      }
      const prev = undoStackRef.current[undoStackRef.current.length - 1];
      if (prev) {
        setMaskData(prev);
      } else {
        setMaskData(null);
      }
    }
  }, [setMaskData]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      const next = redoStackRef.current.pop();
      if (next) {
        undoStackRef.current.push(next);
        setMaskData(next);
      }
    }
  }, [setMaskData]);

  const handleClearMask = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setMaskData(null);
  }, [setMaskData]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0a]">
      <ImageCompare
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearMask={handleClearMask}
        canUndo={undoStackRef.current.length > 0}
        canRedo={redoStackRef.current.length > 0}
      />
    </div>
  );
}

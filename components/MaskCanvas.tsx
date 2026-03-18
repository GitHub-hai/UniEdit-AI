'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '@/lib/context';

interface MaskCanvasProps {
  imageSrc: string;
  brushSize: number;
  onMaskChange?: (maskDataUrl: string) => void;
}

export function MaskCanvas({ imageSrc, brushSize, onMaskChange }: MaskCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  const { maskData, setMaskData, activeMode } = useApp();

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Setup canvas
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scale = Math.min(
      (rect.width - 40) / imageRef.current.width,
      (rect.height - 40) / imageRef.current.height,
      1
    );

    canvas.width = imageRef.current.width * scale;
    canvas.height = imageRef.current.height * scale;

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // If there's existing mask data, draw it
    if (maskData) {
      const maskImg = new Image();
      maskImg.onload = () => {
        ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
      };
      maskImg.src = maskData;
    }
  }, [imageSrc, imageLoaded, maskData]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    // Save state for undo
    undoStack.current.push(canvas.toDataURL());
    redoStack.current = [];

    // Draw red circle (mask)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Update mask data
    const dataUrl = canvas.toDataURL();
    setMaskData(dataUrl);
    window.maskDataUrl = dataUrl;
    onMaskChange?.(dataUrl);
  }, [isDrawing, brushSize, getCanvasCoords, setMaskData, onMaskChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDrawing(true);
    draw(e);
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawing) {
      draw(e);
    }
  }, [isDrawing, draw]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    draw(e as any);
  }, [draw]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (isDrawing) {
      draw(e as any);
    }
  }, [isDrawing, draw]);

  const handleTouchEnd = useCallback(() => {
    setIsDrawing(false);
  }, []);

  if (activeMode !== 'inpaint') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-lg"
      style={{ touchAction: 'none' }}
    />
  );
}

// Expose undo/redo functions globally
export function useMaskUndo() {
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const { setMaskData } = useApp();

  const pushState = useCallback((dataUrl: string) => {
    undoStack.current.push(dataUrl);
    redoStack.current = [];
    if (undoStack.current.length > 20) {
      undoStack.current.shift();
    }
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length > 0) {
      const current = undoStack.current.pop();
      if (current) {
        redoStack.current.push(current);
        const prev = undoStack.current[undoStack.current.length - 1];
        if (prev) {
          setMaskData(prev);
        } else {
          setMaskData(null);
        }
      }
    }
  }, [setMaskData]);

  const redo = useCallback(() => {
    if (redoStack.current.length > 0) {
      const next = redoStack.current.pop();
      if (next) {
        undoStack.current.push(next);
        setMaskData(next);
      }
    }
  }, [setMaskData]);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    setMaskData(null);
  }, [setMaskData]);

  return {
    pushState,
    undo,
    redo,
    clear,
    canUndo: () => undoStack.current.length > 0,
    canRedo: () => redoStack.current.length > 0,
  };
}

// Add global reference for mask data
declare global {
  interface Window {
    maskDataUrl?: string;
  }
}

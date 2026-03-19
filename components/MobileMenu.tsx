'use client';

import { useEffect, useRef, useCallback } from 'react';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '@/lib/context';
import { ImageUploader } from './ImageUploader';
import { ModeTabs } from './ModeTabs';
import { ModeControls } from './ModeControls';
import { alibabaProvider } from '@/lib/providers';
import { Toaster, toast } from 'sonner';
import { preprocessImage } from '@/lib/preprocessor';
import { getProvider } from '@/lib/providers';
import { blobToBase64, base64ToBlob } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const {
    originalImage,
    setResultImage,
    apiProvider,
    apiKey,
    model,
    activeMode,
    prompt,
    upscaleScale,
    maskData,
    outpaintDirection,
    outpaintRatio,
    isLoading,
    setIsLoading,
    setIsSettingsOpen,
    addToHistory,
    negativePrompt,
    promptExtend,
    seed,
    strength,
  } = useApp();

  const drawerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Handle generate action
  const handleGenerate = useCallback(async () => {
    const modelCategory = alibabaProvider.getModelCategory!(model || 'qwen-image-edit-max');
    const isT2iMode = activeMode === 't2i' || modelCategory === 'qwen-t2i' || modelCategory === 'wan-t2i';

    if (!originalImage && !isT2iMode) {
      toast.error('请先上传图片');
      return;
    }

    if (!apiKey) {
      setIsSettingsOpen(true);
      toast.error('请先配置 API Key');
      return;
    }

    if ((activeMode === 'edit' || activeMode === 'inpaint' || activeMode === 't2i') && !prompt.trim()) {
      toast.error('请输入生成描述');
      return;
    }

    const finalPrompt = activeMode === 'upscale' ? 'enhance image quality, make it clearer and sharper' : prompt;
    const provider = getProvider(apiProvider);

    if (!provider) {
      toast.error('不支持的提供商');
      return;
    }

    setIsLoading(true);
    toast.loading('正在处理...', { id: 'generating-mobile' });

    try {
      let imageBlob: Blob | undefined;

      if (originalImage) {
        const processedImage = await preprocessImage(originalImage, { provider: apiProvider });
        imageBlob = base64ToBlob(processedImage, 'image/jpeg');
      }

      let maskBlob: Blob | undefined;
      if (activeMode === 'inpaint' && maskData) {
        maskBlob = base64ToBlob(maskData, 'image/png');
      }

      const scale = activeMode === 'upscale' ? upscaleScale : undefined;

      const resultBlob = await provider.generate(
        {
          image: imageBlob,
          mask: maskBlob,
          prompt: finalPrompt,
          mode: activeMode,
          model,
          scale,
          direction: activeMode === 'outpaint' ? outpaintDirection : undefined,
          ratio: activeMode === 'outpaint' ? outpaintRatio : undefined,
          negative_prompt: negativePrompt || undefined,
          prompt_extend: promptExtend,
          seed: seed ?? undefined,
          strength: strength,
        },
        apiKey
      );

      const resultBase64 = await blobToBase64(resultBlob);
      setResultImage(resultBase64);

      toast.success('生成完成!', { id: 'generating-mobile' });
      onClose(); // Close menu after successful generation
    } catch (error) {
      console.error('Generation error:', error);
      const errorMsg = error instanceof Error ? error.message : '生成失败，请重试';
      toast.error(errorMsg, { id: 'generating-mobile' });
    } finally {
      setIsLoading(false);
    }
  }, [
    originalImage, apiKey, apiProvider, model, activeMode, prompt, upscaleScale,
    negativePrompt, promptExtend, seed, strength, maskData, outpaintDirection, outpaintRatio,
    setIsLoading, setResultImage, setIsSettingsOpen, onClose
  ]);

  // Touch handlers for swipe to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;

    if (diff > 0 && diff < 150 && drawerRef.current) {
      drawerRef.current.style.transform = `translateX(${diff}px)`;
      drawerRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = currentXRef.current - startXRef.current;

    if (diff > 80 && drawerRef.current) {
      drawerRef.current.style.transform = 'translateX(100%)';
      drawerRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(onClose, 300);
    } else if (drawerRef.current) {
      drawerRef.current.style.transform = 'translateX(0)';
      drawerRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    }
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Check if can generate
  const modelCategory = alibabaProvider.getModelCategory!(model || 'qwen-image-edit-max');
  const needsImage = activeMode !== 't2i' && modelCategory !== 'qwen-t2i' && modelCategory !== 'wan-t2i';
  const canGenerate = (!needsImage || originalImage) && !isLoading && (
    activeMode === 'upscale' || activeMode === 't2i' || prompt.trim().length > 0
  );

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="mobile-overlay animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="mobile-drawer animate-slide-left safe-area-top"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="编辑菜单"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass-modal border-b border-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">编辑选项</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
              aria-label="关闭菜单"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          <Toaster position="top-center" theme="dark" />

          {/* Image Upload */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2">图片</h3>
            <ImageUploader />
          </div>

          {/* Mode Tabs */}
          <div className="-mx-4">
            <ModeTabs />
          </div>

          {/* Mode Controls */}
          <div className="space-y-4">
            <ModeControls />
          </div>
        </div>

        {/* Generate Button - Fixed at bottom */}
        <div className="sticky bottom-0 p-4 glass-modal border-t border-white/5 safe-area-bottom">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="btn-primary w-full flex items-center justify-center gap-2.5 h-12 text-[15px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
                <span>处理中...</span>
              </>
            ) : (
              <span>开始生成</span>
            )}
          </button>

          {!apiKey && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>请先配置 API Key</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

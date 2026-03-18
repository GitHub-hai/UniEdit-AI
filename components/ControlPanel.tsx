'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/lib/context';
import { ImageUploader } from './ImageUploader';
import { ModeTabs } from './ModeTabs';
import { ModeControls } from './ModeControls';
import { preprocessImage, createMaskFromDrawing } from '@/lib/preprocessor';
import { openAIProvider, alibabaProvider, getProvider } from '@/lib/providers';
import { blobToBase64 } from '@/lib/utils';
import { Toaster, toast } from 'sonner';

interface ControlPanelProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onClearMask?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function ControlPanel({ onUndo, onRedo, onClearMask, canUndo, canRedo }: ControlPanelProps) {
  const {
    originalImage,
    resultImage,
    setResultImage,
    apiProvider,
    apiKey,
    model,
    activeMode,
    prompt,
    isLoading,
    setIsLoading,
    setIsSettingsOpen,
    addToHistory,
    miniMaxKey,
  } = useApp();

  const handleGenerate = useCallback(async () => {
    if (!originalImage) {
      toast.error('请先上传图片');
      return;
    }

    if (!apiKey) {
      setIsSettingsOpen(true);
      toast.error('请先配置 API Key');
      return;
    }

    // Check prompt for edit/inpaint modes
    if ((activeMode === 'edit' || activeMode === 'inpaint') && !prompt.trim()) {
      toast.error('请输入编辑指令');
      return;
    }

    // Get the provider
    const provider = getProvider(apiProvider);
    if (!provider) {
      toast.error('不支持的提供商');
      return;
    }

    setIsLoading(true);
    toast.loading('正在处理...', { id: 'generating' });

    try {
      // Preprocess image
      const processedImage = await preprocessImage(originalImage, {
        provider: apiProvider,
      });

      // Convert to blob
      const imageBlob = await fetch(processedImage).then(r => r.blob());

      // For inpainting, we need to create mask
      let maskBlob: Blob | undefined;
      if (activeMode === 'inpaint' && window.maskDataUrl) {
        // The mask is drawn on the canvas, we need to get it
        // This will be handled by the canvas component
      }

      // Call provider API
      const resultBlob = await provider.generate(
        {
          image: imageBlob,
          mask: maskBlob,
          prompt,
          mode: activeMode,
          model,
        },
        apiKey
      );

      // Convert result to base64
      const resultBase64 = await blobToBase64(resultBlob);
      setResultImage(resultBase64);

      // Add to history
      addToHistory({
        thumbnail: resultBase64,
        prompt,
        mode: activeMode,
        provider: apiProvider,
        model,
      });

      toast.success('生成完成!', { id: 'generating' });
    } catch (error) {
      console.error('Generation error:', error);
      const errorMsg = error instanceof Error ? error.message : '生成失败，请重试';
      // Check for common errors
      if (errorMsg.includes('Failed to fetch')) {
        toast.error('网络请求失败，请检查网络或API Key是否正确', { id: 'generating' });
      } else {
        toast.error(errorMsg, { id: 'generating' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, apiKey, apiProvider, model, activeMode, prompt, setIsLoading, setResultImage, addToHistory, setIsSettingsOpen]);

  const canGenerate = originalImage && !isLoading && (
    activeMode === 'upscale' || prompt.trim().length > 0
  );

  return (
    <div className="w-full lg:w-96 xl:w-[500px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      <Toaster position="top-center" />

      {/* Image Upload */}
      <div className="p-4 border-b border-slate-200">
        <ImageUploader />
      </div>

      {/* Mode Tabs */}
      <ModeTabs />

      {/* Mode Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ModeControls
          onUndo={onUndo}
          onRedo={onRedo}
          onClearMask={onClearMask}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>

      {/* Generate Button */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              处理中...
            </>
          ) : (
            <>
              <span>开始生成</span>
            </>
          )}
        </button>

        {!apiKey && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            请先在设置中配置 API Key
          </p>
        )}
      </div>
    </div>
  );
}

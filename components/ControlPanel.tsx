'use client';

import { useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '@/lib/context';
import { ImageUploader } from './ImageUploader';
import { ModeTabs } from './ModeTabs';
import { ModeControls } from './ModeControls';
import { preprocessImage } from '@/lib/preprocessor';
import { getProvider, alibabaProvider } from '@/lib/providers';
import { blobToBase64, base64ToBlob, generateThumbnail } from '@/lib/utils';
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

  const handleGenerate = useCallback(async () => {
    // 检查是否需要图片：根据 mode 和 model category 共同判断
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

    // 画质增强模式使用默认 prompt
    const finalPrompt = activeMode === 'upscale' ? 'enhance image quality, make it clearer and sharper' : prompt;

    const provider = getProvider(apiProvider);
    if (!provider) {
      toast.error('不支持的提供商');
      return;
    }

    setIsLoading(true);
    toast.loading('正在处理...', { id: 'generating' });

    try {
      let imageBlob: Blob | undefined;

      console.log('[ControlPanel] originalImage:', !!originalImage, 'activeMode:', activeMode);

      // 文生图模式不需要图片，其他模式都需要图片
      if (originalImage) {
        try {
          const processedImage = await preprocessImage(originalImage, {
            provider: apiProvider,
          });
          console.log('[ControlPanel] processedImage length:', processedImage?.length);
          // Use base64ToBlob instead of fetch for data URLs
          imageBlob = base64ToBlob(processedImage, 'image/jpeg');
        } catch (err) {
          console.error('[ControlPanel] preprocess error:', err);
          toast.error('图片处理失败', { id: 'generating' });
          setIsLoading(false);
          return;
        }
      } else {
        console.log('[ControlPanel] No originalImage for mode:', activeMode);
      }

      let maskBlob: Blob | undefined;
      if (activeMode === 'inpaint' && maskData) {
        // 将 maskData (base64 data URL) 转换为 Blob
        maskBlob = base64ToBlob(maskData, 'image/png');
      }

      // 计算 scale 参数 (2x = 2048*2048, 4x 需要更大)
      const scale = activeMode === 'upscale' ? upscaleScale : undefined;

      const resultBlob = await provider.generate(
        {
          // 文生图模式不需要图片
          image: imageBlob,
          mask: maskBlob,
          prompt: finalPrompt,
          mode: activeMode,
          model,
          scale,
          // 扩图模式参数
          direction: activeMode === 'outpaint' ? outpaintDirection : undefined,
          ratio: activeMode === 'outpaint' ? outpaintRatio : undefined,
          // 千问/万相高级参数
          negative_prompt: negativePrompt || undefined,
          prompt_extend: promptExtend,
          seed: seed ?? undefined,
          strength: strength,
        },
        apiKey
      );

      const resultBase64 = await blobToBase64(resultBlob);
      setResultImage(resultBase64);

      // 生成缩略图以减少存储大小
      const thumbnail = await generateThumbnail(resultBase64, 200);

      addToHistory({
        thumbnail,
        prompt,
        mode: activeMode,
        provider: apiProvider,
        model,
      });

      toast.success('生成完成!', { id: 'generating' });
    } catch (error) {
      console.error('Generation error:', error);
      const errorMsg = error instanceof Error ? error.message : '生成失败，请重试';
      if (errorMsg.includes('Failed to fetch')) {
        toast.error('网络请求失败，请检查网络或API Key是否正确', { id: 'generating' });
      } else {
        toast.error(errorMsg, { id: 'generating' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, apiKey, apiProvider, model, activeMode, prompt, upscaleScale, negativePrompt, promptExtend, seed, strength, setIsLoading, setResultImage, addToHistory, setIsSettingsOpen]);

  // 文生图模式不需要图片，其他模式需要（根据 mode 和 model category 共同判断）
  const modelCategory = alibabaProvider.getModelCategory!(model || 'qwen-image-edit-max');
  const needsImage = activeMode !== 't2i' && modelCategory !== 'qwen-t2i' && modelCategory !== 'wan-t2i';
  const canGenerate = (!needsImage || originalImage) && !isLoading && (
    activeMode === 'upscale' || activeMode === 't2i' || prompt.trim().length > 0
  );

  return (
    <div className="w-full lg:w-96 xl:w-[480px] bg-[#1d1d1f] border-r border-white/5 flex flex-col h-full overflow-hidden">
      <Toaster position="top-center" theme="dark" />

      {/* Image Upload */}
      <div className="p-4 border-b border-white/5">
        <ImageUploader />
      </div>

      {/* Mode Tabs */}
      <ModeTabs />

      {/* Mode Controls */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
        <ModeControls
          onUndo={onUndo}
          onRedo={onRedo}
          onClearMask={onClearMask}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>

      {/* Generate Button */}
      <div className="p-5 border-t border-white/5">
        <button
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
            <span>请先在设置中配置 API Key</span>
          </div>
        )}
      </div>
    </div>
  );
}

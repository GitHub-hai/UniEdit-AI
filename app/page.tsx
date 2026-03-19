'use client';

import { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from '@/lib/context';
import { Header } from '@/components/Header';
import { ControlPanel } from '@/components/ControlPanel';
import { CanvasArea } from '@/components/CanvasArea';
import { SettingsModal } from '@/components/SettingsModal';
import { HistoryPanel } from '@/components/HistoryPanel';
import { MobileMenu } from '@/components/MobileMenu';
import { Sparkles, Loader2 } from 'lucide-react';
import { alibabaProvider } from '@/lib/providers';
import { preprocessImage } from '@/lib/preprocessor';
import { getProvider } from '@/lib/providers';
import { blobToBase64, base64ToBlob } from '@/lib/utils';
import { Toaster, toast } from 'sonner';

function MainContent() {
  const { setIsSettingsOpen, apiKey, setIsSettingsOpen: setSettingsOpen } = useApp();
  const hasOpenedSettings = useRef(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Show settings on first visit (when no API key is set)
  useEffect(() => {
    if (!apiKey && !hasOpenedSettings.current) {
      hasOpenedSettings.current = true;
      setIsSettingsOpen(true);
    }
  }, [apiKey, setIsSettingsOpen]);

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* Desktop Layout: Side panel + Canvas + History */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <ControlPanel />
        <CanvasArea />
      </div>

      {/* Mobile Layout: Full screen Canvas */}
      <div className="flex-1 lg:hidden flex flex-col overflow-hidden">
        <MobileCanvasArea onOpenMenu={() => setIsMobileMenuOpen(true)} />
      </div>

      {/* Desktop History */}
      <div className="hidden lg:block">
        <HistoryPanel />
      </div>

      {/* Mobile History (Bottom Sheet) */}
      <MobileHistorySheet />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </div>
  );
}

// Mobile-specific canvas with quick actions bar
function MobileCanvasArea({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { originalImage, apiProvider, apiKey, model, activeMode, prompt, upscaleScale, maskData,
    outpaintDirection, outpaintRatio, isLoading, setIsLoading, setIsSettingsOpen, setResultImage,
    negativePrompt, promptExtend, seed, strength } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
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

    const finalPrompt = activeMode === 'upscale' ? 'enhance image quality' : prompt;
    const provider = getProvider(apiProvider);
    if (!provider) return;

    setIsGenerating(true);
    toast.loading('正在处理...', { id: 'mobile-generate' });

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
      toast.success('生成完成!', { id: 'mobile-generate' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成失败', { id: 'mobile-generate' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if can generate
  const modelCategory = alibabaProvider.getModelCategory!(model || 'qwen-image-edit-max');
  const needsImage = activeMode !== 't2i' && modelCategory !== 'qwen-t2i' && modelCategory !== 'wan-t2i';
  const canGenerate = (!needsImage || originalImage) && !isGenerating && (
    activeMode === 'upscale' || activeMode === 't2i' || prompt.trim().length > 0
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CanvasArea />

      {/* Mobile Quick Actions Bar */}
      <div className="shrink-0 p-3 glass-panel border-t border-white/5 safe-area-bottom">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMenu}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 h-11"
          >
            <Sparkles className="w-4 h-4" />
            <span>编辑选项</span>
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="btn-primary flex-1 flex items-center justify-center gap-2 h-11"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>处理中...</span>
              </>
            ) : (
              <span>生成</span>
            )}
          </button>
        </div>
      </div>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

// Mobile History Bottom Sheet
function MobileHistorySheet() {
  const { history } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="lg:hidden">
      {/* Expand indicator */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 flex flex-col items-center gap-1"
      >
        <div className="w-8 h-1 bg-white/20 rounded-full" />
        <span className="text-xs text-[#86868b]">历史记录 ({history.length})</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-[#1d1d1f] border-t border-white/5 rounded-t-2xl animate-slide-up safe-area-bottom">
          <div className="p-4">
            <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="text-sm font-medium mb-3">历史记录</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {history.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#2d2d2f] hover:ring-2 hover:ring-[#2997ff] transition-all"
                  onClick={() => setIsExpanded(false)}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.prompt || '历史图片'}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed bar when not expanded */}
      {!isExpanded && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-[#1d1d1f]/90 backdrop-blur-lg border-t border-white/5 safe-area-bottom">
          <div className="flex items-center justify-center py-2">
            <span className="text-xs text-[#86868b]">
              {history.length} 个历史记录 - 点击展开
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

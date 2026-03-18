'use client';

import { useState } from 'react';
import { Undo2, Redo2, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/context';
import { optimizePrompt } from '@/lib/providers';

interface ModeControlsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onClearMask?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function ModeControls({ onUndo, onRedo, onClearMask, canUndo, canRedo }: ModeControlsProps) {
  const {
    activeMode,
    prompt,
    setPrompt,
    brushSize,
    setBrushSize,
    outpaintDirection,
    setOutpaintDirection,
    outpaintRatio,
    setOutpaintRatio,
    upscaleScale,
    setUpscaleScale,
    miniMaxKey,
  } = useApp();

  // Edit mode - show prompt textarea
  if (activeMode === 'edit') {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            编辑指令
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要的修改，如：添加更多的云朵，使画面更明亮..."
            className="textarea"
            rows={4}
          />
        </div>
        <PromptEnhancerInline />
      </div>
    );
  }

  // Inpainting mode - show brush controls
  if (activeMode === 'inpaint') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            笔刷大小: {brushSize}px
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
          >
            <Undo2 className="w-4 h-4" />
            撤销
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
          >
            <Redo2 className="w-4 h-4" />
            重做
          </button>
          <button
            onClick={onClearMask}
            className="btn-secondary flex items-center justify-center gap-1.5 px-3"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          在右侧画布上涂抹红色区域，标识需要重绘的部分
        </p>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            替换指令 (可选)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你希望在涂抹区域生成什么..."
            className="textarea"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // Outpainting mode - show direction controls
  if (activeMode === 'outpaint') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            扩展方向
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['top', 'bottom', 'left', 'right', 'all'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setOutpaintDirection(dir)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  outpaintDirection === dir
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dir === 'top' && '↑ 上'}
                {dir === 'bottom' && '↓ 下'}
                {dir === 'left' && '← 左'}
                {dir === 'right' && '→ 右'}
                {dir === 'all' && '⤢ 四周'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            扩展比例: {outpaintRatio}%
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={outpaintRatio}
            onChange={(e) => setOutpaintRatio(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>
    );
  }

  // Upscale mode - show scale controls
  if (activeMode === 'upscale') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            放大倍数
          </label>
          <div className="flex gap-2">
            {[2, 4].map((scale) => (
              <button
                key={scale}
                onClick={() => setUpscaleScale(scale)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  upscaleScale === scale
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          画质增强无需提示词，将自动提升图片分辨率和细节
        </p>
      </div>
    );
  }

  return null;
}

// Inline prompt enhancer for edit mode
function PromptEnhancerInline() {
  const { miniMaxKey, prompt, setPrompt } = useApp();
  const [input, setInput] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!input.trim()) return;

    if (!miniMaxKey) {
      setError('请先在设置中配置 MiniMax API Key');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const optimized = await optimizePrompt(input, miniMaxKey);
      setPrompt(optimized);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '优化失败');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入简单指令，使用 AI 优化..."
          className="input flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
        />
        <button
          onClick={handleOptimize}
          disabled={!input.trim() || isOptimizing || !miniMaxKey}
          className="btn-primary px-3 flex items-center gap-1.5"
        >
          {isOptimizing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!miniMaxKey && (
        <p className="text-xs text-amber-600">
          需要在设置中配置 MiniMax Key 才能使用提示词优化
        </p>
      )}
    </div>
  );
}

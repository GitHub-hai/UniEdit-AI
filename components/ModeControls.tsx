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

  const [isEditExpanded, setIsEditExpanded] = useState(true);

  // Edit mode - show prompt textarea with collapse
  if (activeMode === 'edit') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white">
            编辑指令
          </label>
          <button
            type="button"
            onClick={() => setIsEditExpanded(!isEditExpanded)}
            className="text-xs text-[#2997ff] hover:text-[#0a84ff]"
          >
            {isEditExpanded ? '收起' : '展开'}
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要的修改，如：添加更多的云朵，使画面更明亮..."
          className="textarea"
          rows={isEditExpanded ? 8 : 3}
        />
        <PromptEnhancerInline />
      </div>
    );
  }

  // Inpainting mode - show brush controls
  if (activeMode === 'inpaint') {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            笔刷大小: {brushSize}px
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-1.5 bg-[#3d3d3f] rounded-lg appearance-none cursor-pointer accent-[#2997ff]"
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

        <p className="text-xs text-[#86868b]">
          在右侧画布上涂抹红色区域，标识需要重绘的部分
        </p>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">
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
          <label className="text-sm font-medium text-white mb-2 block">
            扩展方向
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['top', 'bottom', 'left', 'right', 'all'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setOutpaintDirection(dir)}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  outpaintDirection === dir
                    ? 'bg-[#2997ff] text-white'
                    : 'bg-[#2d2d2f] text-[#86868b] hover:bg-[#3d3d3f] hover:text-white'
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
          <label className="text-sm font-medium text-white mb-2 block">
            扩展比例: {outpaintRatio}%
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={outpaintRatio}
            onChange={(e) => setOutpaintRatio(Number(e.target.value))}
            className="w-full h-1.5 bg-[#3d3d3f] rounded-lg appearance-none cursor-pointer accent-[#2997ff]"
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
          <label className="text-sm font-medium text-white mb-2 block">
            放大倍数
          </label>
          <div className="flex gap-2">
            {[2, 4].map((scale) => (
              <button
                key={scale}
                onClick={() => setUpscaleScale(scale)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  upscaleScale === scale
                    ? 'bg-[#2997ff] text-white'
                    : 'bg-[#2d2d2f] text-[#86868b] hover:bg-[#3d3d3f] hover:text-white'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#86868b]">
          画质增强无需提示词，将自动提升图片分辨率和细节
        </p>
      </div>
    );
  }

  // 文生图模式 - 只显示提示词输入
  if (activeMode === 't2i') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white">
            生成描述
          </label>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要的图片，如：一只可爱的猫咪坐在窗台上，阳光从窗外照进来..."
          className="textarea"
          rows={6}
        />
        <PromptEnhancerInline />
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
  const [selectedExamples, setSelectedExamples] = useState<string[]>([]);

  const examplePrompts = [
    '让天空更蓝',
    '添加夕阳效果',
    '换成冬天雪景',
    '添加更多云朵',
    '使画面更明亮',
    '添加复古滤镜',
    '添加彩虹',
    '换成夜景',
    '添加花朵',
    '增强色彩',
  ];

  const handleOptimize = async () => {
    if (!input.trim() && selectedExamples.length === 0) return;

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
      setSelectedExamples([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '优化失败');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setSelectedExamples((prev) => {
      if (prev.includes(example)) {
        return prev.filter((e) => e !== example);
      }
      return [...prev, example];
    });
  };

  const handleApplyExamples = () => {
    if (selectedExamples.length > 0) {
      const combined = selectedExamples.join('，');
      setInput(combined);
      setSelectedExamples([]);
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
          disabled={(!input.trim() && selectedExamples.length === 0) || isOptimizing || !miniMaxKey}
          className="btn-primary px-3 flex items-center gap-1.5"
        >
          {isOptimizing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#86868b]">试试可以这样写（可多选）：</p>
          {selectedExamples.length > 0 && (
            <button
              type="button"
              onClick={handleApplyExamples}
              className="text-xs text-[#2997ff] hover:text-[#0a84ff] font-medium"
            >
              填入编辑框 ({selectedExamples.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {examplePrompts.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                selectedExamples.includes(example)
                  ? 'bg-[#2997ff] text-white'
                  : 'bg-[#2d2d2f] text-[#86868b] hover:bg-[#3d3d3f] hover:text-white'
              }`}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-[#ff453a]">{error}</p>}
      {!miniMaxKey && (
        <p className="text-xs text-amber-400">
          需要在设置中配置 MiniMax Key 才能使用提示词优化
        </p>
      )}
    </div>
  );
}

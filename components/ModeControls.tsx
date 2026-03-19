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
    negativePrompt,
    setNegativePrompt,
    promptExtend,
    setPromptExtend,
    seed,
    setSeed,
    strength,
    setStrength,
  } = useApp();

  const [isEditExpanded, setIsEditExpanded] = useState(true);

  // Edit mode - show prompt textarea with collapse
  if (activeMode === 'edit') {
    return (
      <div className="space-y-3">
        {/* 模型提示 */}
        <div className="bg-[#2d2d2f] rounded-lg p-3 text-xs text-[#86868b]">
          <span className="text-[#2997ff] font-medium">💡 智能编辑</span> 需要上传图片，描述你想要的修改。
          <br />
          推荐模型：<span className="text-white">qwen-image-edit-max / qwen-image-edit-plus</span>
        </div>

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
        <AdvancedParams />
      </div>
    );
  }

  // Inpainting mode - show brush controls
  if (activeMode === 'inpaint') {
    return (
      <div className="space-y-4">
        {/* 模型提示 */}
        <div className="bg-[#2d2d2f] rounded-lg p-3 text-xs text-[#86868b]">
          <span className="text-[#2997ff] font-medium">💡 局部重绘</span> 需要上传图片并涂抹红色遮罩区域。
          <br />
          推荐模型：<span className="text-white">qwen-image-edit-max / qwen-image-edit-plus</span>
        </div>

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
        {/* 模型提示 */}
        <div className="bg-[#2d2d2f] rounded-lg p-3 text-xs text-[#86868b]">
          <span className="text-[#2997ff] font-medium">💡 智能扩图</span> 需要上传图片并设置扩展方向。
          <br />
          推荐模型：<span className="text-white">qwen-image-edit-max / qwen-image-edit-plus</span>
        </div>

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
        {/* 模型提示 */}
        <div className="bg-[#2d2d2f] rounded-lg p-3 text-xs text-[#86868b]">
          <span className="text-[#2997ff] font-medium">💡 画质增强</span> 需要上传图片，自动提升分辨率和细节。
          <br />
          推荐模型：<span className="text-white">qwen-image-edit-max / qwen-image-edit-plus</span>
        </div>

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
        {/* 模型提示 */}
        <div className="bg-[#2d2d2f] rounded-lg p-3 text-xs text-[#86868b]">
          <span className="text-[#2997ff] font-medium">💡 文生图</span> 无需上传图片，直接通过文字描述生成图片。
          <br />
          推荐模型：<span className="text-white">qwen-image-2.0-pro / wan2.6-t2i</span>
        </div>

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
        <AdvancedParams />
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

// Advanced parameters for Qianwen/Wanxiang models
function AdvancedParams() {
  const {
    apiProvider,
    negativePrompt,
    setNegativePrompt,
    promptExtend,
    setPromptExtend,
    seed,
    setSeed,
    strength,
    setStrength,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  // Only show for Alibaba provider
  if (apiProvider !== 'alibaba') {
    return null;
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between bg-[#2d2d2f] hover:bg-[#3d3d3f] transition-colors"
      >
        <span className="text-sm font-medium text-white">高级参数</span>
        <span className={`text-xs text-[#86868b] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          {isExpanded ? '收起' : '展开'}
        </span>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-4 bg-[#1d1d1f]">
          {/* Negative Prompt */}
          <div>
            <label className="text-xs font-medium text-white mb-1.5 block">
              反向提示词 (千问)
            </label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="描述不希望出现的内容，如：模糊、多余的手指..."
              className="input text-sm"
            />
          </div>

          {/* Prompt Extend Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-medium text-white">提示词扩展</label>
              <p className="text-xs text-[#86868b]">智能改写提示词，提升生成效果</p>
            </div>
            <button
              type="button"
              aria-label={promptExtend ? '关闭提示词扩展' : '开启提示词扩展'}
              onClick={() => setPromptExtend(!promptExtend)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                promptExtend ? 'bg-[#2997ff]' : 'bg-[#3d3d3f]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  promptExtend ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Seed */}
          <div>
            <label className="text-xs font-medium text-white mb-1.5 block">
              随机种子 (千问)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={seed ?? ''}
                onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : null)}
                placeholder="留空则随机生成"
                className="input text-sm flex-1"
              />
              {seed !== null && (
                <button
                  type="button"
                  onClick={() => setSeed(null)}
                  className="btn-secondary px-3 text-sm"
                >
                  重置
                </button>
              )}
            </div>
          </div>

          {/* Strength */}
          <div>
            <label className="text-xs font-medium text-white mb-1.5 block">
              修改幅度 (万相): {strength.toFixed(2)}
            </label>
            <input
              type="range"
              aria-label="修改幅度"
              min="0"
              max="1"
              step="0.05"
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="w-full h-1.5 bg-[#3d3d3f] rounded-lg appearance-none cursor-pointer accent-[#2997ff]"
            />
            <div className="flex justify-between text-xs text-[#86868b] mt-1">
              <span>保持原图</span>
              <span>大幅修改</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

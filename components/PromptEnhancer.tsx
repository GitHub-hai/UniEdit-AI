'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/context';
import { optimizePrompt } from '@/lib/providers';

export function PromptEnhancer() {
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
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">
        提示词优化器
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入简单指令，如：让天空更蓝"
          className="input flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
        />
        <button
          onClick={handleOptimize}
          disabled={!input.trim() || isOptimizing || !miniMaxKey}
          className="btn-primary px-3 flex items-center gap-1.5 whitespace-nowrap"
        >
          {isOptimizing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">优化</span>
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!miniMaxKey && (
        <p className="text-xs text-amber-600">
          需要在设置中配置 MiniMax Key 才能使用此功能
        </p>
      )}
    </div>
  );
}

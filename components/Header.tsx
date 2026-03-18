'use client';

import { Settings, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/context';

export function Header() {
  const { setIsSettingsOpen } = useApp();

  return (
    <header className="h-14 glass-panel flex items-center justify-between px-6 shrink-0 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">UniEdit AI</h1>
        </div>
        <span className="text-xs text-[#86868b] hidden sm:inline">
          通用 AI 图像编辑平台
        </span>
      </div>
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="p-2.5 rounded-xl hover:bg-white/5 transition-all duration-300"
        aria-label="Settings"
      >
        <Settings className="w-[18px] h-[18px] text-[#86868b] hover:text-white transition-colors" />
      </button>
    </header>
  );
}

'use client';

import { Settings } from 'lucide-react';
import { useApp } from '@/lib/context';

export function Header() {
  const { setIsSettingsOpen } = useApp();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold gradient-text">UniEdit AI</h1>
        <span className="text-xs text-slate-400 hidden sm:inline">
          通用 AI 图像编辑平台
        </span>
      </div>
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5 text-slate-600" />
      </button>
    </header>
  );
}

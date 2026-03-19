'use client';

import { Settings, Sparkles, Menu, Github } from 'lucide-react';
import { useApp } from '@/lib/context';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { setIsSettingsOpen } = useApp();

  return (
    <header className="h-14 glass-panel flex items-center justify-between px-4 lg:px-6 shrink-0 border-b border-white/5 safe-area-top">
      {/* Left: Menu button (mobile) + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl hover:bg-white/5 transition-all duration-300 active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="w-[18px] h-[18px] text-[#86868b]" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">UniEdit AI</h1>
        </div>
        <span className="text-xs text-[#86868b] hidden md:inline">
          通用 AI 图像编辑平台
        </span>
      </div>

      {/* Right: GitHub + Settings */}
      <div className="flex items-center gap-1">
        <a
          href="https://github.com/GitHub-hai/UniEdit-AI"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl hover:bg-white/5 transition-all duration-300 active:scale-95"
          aria-label="GitHub"
        >
          <Github className="w-[18px] h-[18px] text-[#86868b] hover:text-white transition-colors" />
        </a>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2.5 rounded-xl hover:bg-white/5 transition-all duration-300 active:scale-95"
          aria-label="Settings"
        >
          <Settings className="w-[18px] h-[18px] text-[#86868b] hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  );
}

'use client';

import { useApp } from '@/lib/context';
import { Trash2 } from 'lucide-react';

export function HistoryPanel() {
  const { history, clearHistory, setPrompt, setActiveMode } = useApp();

  if (history.length === 0) {
    return null;
  }

  const handleItemClick = (item: typeof history[0]) => {
    setPrompt(item.prompt);
    setActiveMode(item.mode);
  };

  return (
    <div className="border-t border-white/5 bg-[#1d1d1f]/95 backdrop-blur-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-white">历史记录</h3>
        <button
          onClick={clearHistory}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          title="清空历史"
        >
          <Trash2 className="w-4 h-4 text-[#86868b]" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="shrink-0 group"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#2d2d2f] border-2 border-transparent group-hover:border-[#2997ff] transition-all">
              <img
                src={item.thumbnail}
                alt={item.prompt}
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

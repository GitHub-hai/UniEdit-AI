'use client';

import { useApp } from '@/lib/context';
import { formatTimestamp } from '@/lib/utils';
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
    <div className="border-t border-slate-200 bg-white/95 backdrop-blur-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-700">历史记录</h3>
        <button
          onClick={clearHistory}
          className="p-1 rounded hover:bg-slate-100 transition-colors"
          title="清空历史"
        >
          <Trash2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="shrink-0 group"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border-2 border-transparent group-hover:border-blue-500 transition-colors">
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

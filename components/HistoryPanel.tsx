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
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">历史记录</h3>
        <button
          onClick={clearHistory}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="清空历史"
        >
          <Trash2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="shrink-0 group relative"
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border-2 border-transparent group-hover:border-blue-500 transition-colors">
              <img
                src={item.thumbnail}
                alt={item.prompt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-0 right-0 text-center">
              <span className="text-xs text-slate-400">
                {formatTimestamp(item.timestamp)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

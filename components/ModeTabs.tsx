'use client';

import { useApp } from '@/lib/context';
import { MODE_TABS, cn } from '@/lib/utils';
import { EditMode } from '@/lib/types';

export function ModeTabs() {
  const { activeMode, setActiveMode } = useApp();

  return (
    <div className="border-b border-slate-200">
      <nav className="flex" aria-label="Mode tabs">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMode(tab.id as EditMode)}
            className={cn(
              'mode-tab flex items-center gap-1.5 text-sm flex-1 justify-center py-3',
              activeMode === tab.id && 'active'
            )}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

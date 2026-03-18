'use client';

import { useEffect, useRef } from 'react';
import { AppProvider, useApp } from '@/lib/context';
import { Header } from '@/components/Header';
import { ControlPanel } from '@/components/ControlPanel';
import { CanvasArea } from '@/components/CanvasArea';
import { SettingsModal } from '@/components/SettingsModal';
import { HistoryPanel } from '@/components/HistoryPanel';

function MainContent() {
  const { setIsSettingsOpen, apiKey } = useApp();
  const hasOpenedSettings = useRef(false);

  // Show settings on first visit (when no API key is set)
  useEffect(() => {
    if (!apiKey && !hasOpenedSettings.current) {
      hasOpenedSettings.current = true;
      setIsSettingsOpen(true);
    }
  }, [apiKey, setIsSettingsOpen]);

  return (
    <div className="h-screen flex flex-col bg-black">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <ControlPanel />

        {/* Right Canvas */}
        <CanvasArea />
      </div>

      {/* History */}
      <HistoryPanel />

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

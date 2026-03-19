'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { Trash2, X, Download } from 'lucide-react';

export function HistoryPanel() {
  const { history, clearHistory, setPrompt, setActiveMode, setResultImage, clearOriginalImageOnly } = useApp();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (history.length === 0) {
    return null;
  }

  const handleItemClick = (item: typeof history[0]) => {
    setPrompt(item.prompt);
    setActiveMode(item.mode);
    // 对于文生图模式，恢复结果图片并清空原图
    if (item.mode === 't2i') {
      clearOriginalImageOnly();
      setResultImage(item.thumbnail);
    }
  };

  const handleDownload = (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `uniedit-${Date.now()}.png`;
    link.click();
  };

  return (
    <>
      <div className="border-t border-white/5 bg-[#1d1d1f]/95 backdrop-blur-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">历史记录</h3>
          <button
            type="button"
            onClick={clearHistory}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="清空历史"
          >
            <Trash2 className="w-4 h-4 text-[#86868b]" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {history.map((item) => (
            <div key={item.id} className="shrink-0 group relative">
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className="w-16 h-16 rounded-xl overflow-hidden bg-[#2d2d2f] border-2 border-transparent group-hover:border-[#2997ff] transition-all cursor-pointer"
                title={item.prompt}
              >
                <img
                  src={item.thumbnail}
                  alt={item.prompt}
                  className="w-full h-full object-cover"
                />
              </button>
              <button
                type="button"
                onClick={(e) => handleDownload(e, item.thumbnail)}
                className="absolute bottom-0 right-0 w-6 h-6 bg-black/60 rounded-bl-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="下载图片"
              >
                <Download className="w-3 h-3 text-white" />
              </button>
              {/* 预览按钮 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage(item.thumbnail);
                }}
                className="absolute top-0 right-0 w-6 h-6 bg-black/60 rounded-tr-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="预览大图"
              >
                <span className="text-white text-xs font-bold">+</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="关闭预览"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            type="button"
            onClick={(e) => handleDownload(e, previewImage)}
            className="absolute bottom-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
            aria-label="下载图片"
          >
            <Download className="w-5 h-5 text-white" />
            <span className="text-white text-sm">下载</span>
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
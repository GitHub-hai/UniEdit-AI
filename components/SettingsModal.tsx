'use client';

import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/context';
import { PROVIDERS, MODELS } from '@/lib/utils';
import { getProvider, validateMiniMaxKey } from '@/lib/providers';

export function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    apiProvider,
    setApiProvider,
    apiKey,
    setApiKey,
    model,
    setModel,
    miniMaxKey,
    setMiniMaxKey,
  } = useApp();

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [isTestingMiniMax, setIsTestingMiniMax] = useState(false);
  const [miniMaxResult, setMiniMaxResult] = useState<'success' | 'error' | null>(null);

  if (!isSettingsOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const provider = getProvider(apiProvider);
      if (!provider) {
        setTestResult('error');
        return;
      }
      const isValid = await provider.validateKey(apiKey);
      setTestResult(isValid ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestMiniMax = async () => {
    if (!miniMaxKey) return;

    setIsTestingMiniMax(true);
    setMiniMaxResult(null);

    try {
      const isValid = await validateMiniMaxKey(miniMaxKey);
      setMiniMaxResult(isValid ? 'success' : 'error');
    } catch {
      setMiniMaxResult('error');
    } finally {
      setIsTestingMiniMax(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    setApiProvider(provider as any);
    const models = MODELS[provider];
    if (models && models.length > 0) {
      setModel(models[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={() => setIsSettingsOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-[#1d1d1f] rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slide-in overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">API 配置</h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-[#86868b]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              服务提供商
            </label>
            <select
              value={apiProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="select"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              模型
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="select"
            >
              {MODELS[apiProvider]?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              API Key <span className="text-[#ff453a]">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="input flex-1"
              />
              <button
                onClick={handleTestConnection}
                disabled={!apiKey || isTesting}
                className="btn-secondary whitespace-nowrap"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : testResult === 'success' ? (
                  <Check className="w-4 h-4 text-[#30d158]" />
                ) : testResult === 'error' ? (
                  <X className="w-4 h-4 text-[#ff453a]" />
                ) : (
                  '测试连接'
                )}
              </button>
            </div>
            <p className="text-xs text-[#86868b] mt-2">
              Key 仅保存在内存中，刷新页面后自动清除
            </p>
          </div>

          {/* MiniMax Key (Optional) */}
          <div className="pt-5 border-t border-white/5">
            <label className="block text-sm font-medium text-white mb-2">
              MiniMax Key <span className="text-[#86868b] font-normal">(可选，用于提示词优化)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={miniMaxKey}
                onChange={(e) => setMiniMaxKey(e.target.value)}
                placeholder="输入 MiniMax API Key"
                className="input flex-1"
              />
              <button
                onClick={handleTestMiniMax}
                disabled={!miniMaxKey || isTestingMiniMax}
                className="btn-secondary whitespace-nowrap"
              >
                {isTestingMiniMax ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : miniMaxResult === 'success' ? (
                  <Check className="w-4 h-4 text-[#30d158]" />
                ) : miniMaxResult === 'error' ? (
                  <X className="w-4 h-4 text-[#ff453a]" />
                ) : (
                  '测试'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[#2d2d2f]">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="btn-primary w-full h-11"
          >
            保存并关闭
          </button>
        </div>
      </div>
    </div>
  );
}

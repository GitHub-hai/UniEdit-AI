'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppContextType, AppState, HistoryItem, Provider, EditMode } from './types';

const initialState: AppState = {
  originalImage: null,
  resultImage: null,
  apiProvider: 'openai',
  apiKey: '',
  model: 'dall-e-3',
  miniMaxKey: '',
  activeMode: 'edit',
  maskData: null,
  history: [],
  isLoading: false,
  isSettingsOpen: false,
  prompt: '',
  brushSize: 20,
  outpaintDirection: 'all',
  outpaintRatio: 20,
  upscaleScale: 2,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('uniedit-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setState(prev => ({ ...prev, history: parsed }));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }

    // Load saved settings (except API keys)
    const savedProvider = localStorage.getItem('uniedit-provider');
    const savedModel = localStorage.getItem('uniedit-model');
    if (savedProvider) {
      setState(prev => ({ ...prev, apiProvider: savedProvider as Provider }));
    }
    if (savedModel) {
      setState(prev => ({ ...prev, model: savedModel }));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (state.history.length > 0) {
      localStorage.setItem('uniedit-history', JSON.stringify(state.history.slice(0, 10)));
    }
  }, [state.history]);

  // Save provider and model (not keys)
  useEffect(() => {
    localStorage.setItem('uniedit-provider', state.apiProvider);
    localStorage.setItem('uniedit-model', state.model);
  }, [state.apiProvider, state.model]);

  const setOriginalImage = useCallback((image: string | null) => {
    setState(prev => ({ ...prev, originalImage: image, resultImage: null }));
  }, []);

  const setResultImage = useCallback((image: string | null) => {
    setState(prev => ({ ...prev, resultImage: image }));
  }, []);

  const setApiProvider = useCallback((provider: Provider) => {
    setState(prev => ({ ...prev, apiProvider: provider }));
  }, []);

  const setApiKey = useCallback((key: string) => {
    setState(prev => ({ ...prev, apiKey: key }));
  }, []);

  const setModel = useCallback((model: string) => {
    setState(prev => ({ ...prev, model }));
  }, []);

  const setMiniMaxKey = useCallback((key: string) => {
    setState(prev => ({ ...prev, miniMaxKey: key }));
  }, []);

  const setActiveMode = useCallback((mode: EditMode) => {
    setState(prev => ({ ...prev, activeMode: mode, maskData: null }));
  }, []);

  const setMaskData = useCallback((mask: string | null) => {
    setState(prev => ({ ...prev, maskData: mask }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setIsSettingsOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isSettingsOpen: open }));
  }, []);

  const setPrompt = useCallback((prompt: string) => {
    setState(prev => ({ ...prev, prompt }));
  }, []);

  const setBrushSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, brushSize: size }));
  }, []);

  const setOutpaintDirection = useCallback((direction: 'top' | 'bottom' | 'left' | 'right' | 'all') => {
    setState(prev => ({ ...prev, outpaintDirection: direction }));
  }, []);

  const setOutpaintRatio = useCallback((ratio: number) => {
    setState(prev => ({ ...prev, outpaintRatio: ratio }));
  }, []);

  const setUpscaleScale = useCallback((scale: number) => {
    setState(prev => ({ ...prev, upscaleScale: scale }));
  }, []);

  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setState(prev => ({
      ...prev,
      history: [newItem, ...prev.history].slice(0, 10),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }));
    localStorage.removeItem('uniedit-history');
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      originalImage: null,
      resultImage: null,
      maskData: null,
      prompt: '',
    }));
  }, []);

  const value: AppContextType = {
    ...state,
    setOriginalImage,
    setResultImage,
    setApiProvider,
    setApiKey,
    setModel,
    setMiniMaxKey,
    setActiveMode,
    setMaskData,
    setIsLoading,
    setIsSettingsOpen,
    setPrompt,
    setBrushSize,
    setOutpaintDirection,
    setOutpaintRatio,
    setUpscaleScale,
    addToHistory,
    clearHistory,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

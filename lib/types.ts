// Types for UniEdit AI

export type EditMode = 'edit' | 'inpaint' | 'outpaint' | 'upscale' | 't2i';

export type Provider = 'openai' | 'google' | 'alibaba' | 'replicate' | 'fal' | 'minimax';

export interface EditRequest {
  image: Blob;
  mask?: Blob;
  prompt: string;
  mode: EditMode;
  model?: string;
  dimensions?: { width: number; height: number };
  scale?: number;
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'all';
  ratio?: number;
  // 阿里千问新增参数
  outputCount?: number; // 输出图片数量 1-6
  images?: Blob[]; // 多图输入 1-3张
  size?: string; // 分辨率如 "1024x1024"
}

export interface ImageProvider {
  id: Provider;
  name: string;
  models: { id: string; name: string }[];
  validateKey: (key: string) => Promise<boolean>;
  generate: (req: EditRequest, apiKey: string) => Promise<Blob>;
  getModelCategory?: (model: string) => string;
}

export interface HistoryItem {
  id: string;
  thumbnail: string;
  prompt: string;
  mode: EditMode;
  provider: Provider;
  model: string;
  timestamp: number;
}

export interface AppState {
  originalImage: string | null;
  resultImage: string | null;
  apiProvider: Provider;
  apiKey: string;
  model: string;
  miniMaxKey: string;
  activeMode: EditMode;
  maskData: string | null;
  history: HistoryItem[];
  isLoading: boolean;
  isSettingsOpen: boolean;
  prompt: string;
  brushSize: number;
  outpaintDirection: 'top' | 'bottom' | 'left' | 'right' | 'all';
  outpaintRatio: number;
  upscaleScale: number;
}

export interface AppActions {
  setOriginalImage: (image: string | null) => void;
  setResultImage: (image: string | null) => void;
  setApiProvider: (provider: Provider) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setMiniMaxKey: (key: string) => void;
  setActiveMode: (mode: EditMode) => void;
  setMaskData: (mask: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setPrompt: (prompt: string) => void;
  setBrushSize: (size: number) => void;
  setOutpaintDirection: (direction: 'top' | 'bottom' | 'left' | 'right' | 'all') => void;
  setOutpaintRatio: (ratio: number) => void;
  setUpscaleScale: (scale: number) => void;
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  reset: () => void;
}

export type AppContextType = AppState & AppActions;

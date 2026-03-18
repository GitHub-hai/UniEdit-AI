# UniEdit AI - Specification Document

## 1. Project Overview

**Project Name**: UniEdit AI
**Type**: Web Application (AI Image Editing Platform)
**Core Functionality**: A universal AI image editing platform that allows users to call global mainstream image models (OpenAI, Google, Alibaba, Replicate, etc.) for professional image editing through their own API keys.
**Target Users**: Designers, content creators, and developers who need AI-powered image editing capabilities.

## 2. UI/UX Specification

### Layout Structure

**Main Layout**: Two-column layout
- Left sidebar: Control panel (480px max width on desktop)
- Right area: Canvas preview (flexible, fills remaining space)
- Header: Minimal top bar with logo and settings button
- Bottom: History panel (collapsible)

**Responsive Breakpoints**:
- Desktop: >= 1024px (side-by-side layout)
- Tablet: 768px - 1023px (stacked layout)
- Mobile: < 768px (full-width stacked, touch-friendly controls)

### Visual Design - Apple Dark Theme

**Color Palette**:
- Background: `#000000` (pure black)
- Surface Primary: `#1d1d1f`
- Surface Secondary: `#2d2d2f`
- Surface Tertiary: `#3d3d3f`
- Primary: `#2997ff` (Apple Blue)
- Primary Hover: `#0a84ff`
- Secondary: `#86868b` (Apple Gray)
- Text Primary: `#f5f5f7`
- Text Secondary: `#86868b`
- Border: `#2d2d2d` / `rgba(255,255,255,0.08)`
- Success: `#30d158`
- Error: `#ff453a`
- Warning: `#ffd60a`

**Glassmorphism Effects**:
- Header & Modals: `backdrop-filter: saturate(180%) blur(20px)`
- Glass background: `rgba(29, 29, 31, 0.72)`
- Glass border: `rgba(255, 255, 255, 0.08)`

**Typography**:
- Font Family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif
- Headings:
  - H1: 24px, font-weight 700
  - H2: 20px, font-weight 600
  - H3: 16px, font-weight 600
- Body: 14px, font-weight 400
- Small: 12px, font-weight 400

**Spacing System**:
- Base unit: 4px
- Padding: 16px (card), 20px (section)
- Gap: 12px (between elements), 20px (between sections)
- Border Radius: 10px (buttons), 12px (cards), 16px (modals), 20px (panels)

**Visual Effects**:
- Transitions: `cubic-bezier(0.16, 1, 0.3, 1)` 250ms
- Button hover: scale(1.01) + brightness
- Canvas: Radial gradient background `radial-gradient(ellipse at center, #1d1d1f 0%, #000000 100%)`

### Components

**Header**:
- Logo (left): "UniEdit AI" with gradient + sparkles icon
- Subtitle: "通用 AI 图像编辑平台"
- Settings button (right): Gear icon with hover effect

**Left Sidebar - Control Panel**:
1. **Upload Section**
   - Drag & drop zone with dashed border
   - File input button
   - Preview thumbnail after upload
   - Image info (dimensions, size)

2. **Mode Tabs** (5 tabs now)
   - ✏️ 智能编辑 | 🎨 局部重绘 | 🖼️ 智能扩图 | ✨ 画质增强 | 🌟 文生图
   - Active tab: Apple Blue underline + bold text
   - Inactive: `#86868b` text

3. **Mode-specific Controls**
   - **智能编辑**: Prompt textarea (collapsible)
   - **局部重绘**: Brush size slider (5-50px), Undo/Redo, Clear mask
   - **智能扩图**: Direction selector (上/下/左/右/四周), Expansion ratio (10%-50%)
   - **画质增强**: Scale selector (2x, 4x)
   - **文生图**: Prompt textarea only (no image required)

4. **Prompt Enhancer**
   - Input field for simple instruction
   - Multi-select example prompts
   - "✨ AI优化" button
   - Output: Enhanced prompt (English, professional)

5. **Generate Button**
   - Full-width, Apple Blue background
   - Loading state: spinner + "处理中..."
   - Disabled when no image/prompt (except t2i mode)

**Right Canvas Area**:
1. **Image Comparison View**
   - Split view with draggable slider
   - Original image on left, result on right
   - Labels: "原图" / "结果" (with glassmorphism style)

2. **Canvas Layer** (Inpainting mode only)
   - Transparent overlay on image
   - Red mask painting with adjustable brush

3. **Action Buttons**
   - Download button
   - Reset button

**Settings Modal**:
- Glassmorphism background
- Provider dropdown: OpenAI, Google, Alibaba DashScope, Replicate, Fal, MiniMax
- API Key input (password type)
- Model selector (dynamic based on provider)
- MiniMax Key (optional, for prompt optimization)
- Test Connection button with status icon

**History Panel**:
- Horizontal scrollable gallery
- Thumbnail cards (56x56px, rounded-xl)
- Glassmorphism background
- Delete button on hover

### Interactive Behaviors

- Hover: All buttons have hover states with subtle scale/brightness
- Loading: Spinner animation
- Error: Toast notifications (dark theme)
- Success: Toast notifications (dark theme)
- Drag & Drop: Visual feedback with border color change

## 3. Functionality Specification

### Core Features

**A. API Configuration**
- Store API keys in React state only (never localStorage for keys)
- Support multiple providers with dynamic model lists
- Validate keys via test endpoint
- Persist provider/model selection (not keys) in localStorage

**B. Image Upload**
- Accept: JPG, PNG, WebP
- Max size: 20MB
- Auto-analyze dimensions
- Show preview immediately

**C. Text-to-Edit Mode**
- Input: Natural language prompt
- Process: Preprocess image → Call provider API → Return result
- Display: Show loading → Show result in comparison view

**D. Inpainting Mode**
- Canvas layer with painting
- Paint red mask on areas to redraw
- Brush size adjustment
- Undo/Redo stack (max 20 steps)
- Send both image + mask to API

**E. Outpainting Mode**
- Direction selection: Top, Bottom, Left, Right, All
- Ratio selection: 10% - 50%
- Smart fill using AI

**F. Upscale Mode**
- Scale options: 2x, 4x
- No prompt needed
- Direct API call

**G. Text-to-Image Mode (NEW)**
- No image required
- Only prompt needed
- Supports Alibaba Qwen T2I models
- Can optionally provide reference image

**H. Prompt Optimization**
- Call MiniMax M2.5 API
- System prompt: "You are an expert image editing prompt engineer..."
- Convert simple instructions to detailed English prompts
- Multi-select example prompts
- Auto-fill to main prompt field

**I. Auto Preprocessor**
- Check image dimensions against model requirements
- OpenAI: Square (1024x1024 or 512x512), white fill if needed
- Alibaba/Google: Max 2048px, maintain aspect ratio
- Convert to JPG (quality 90%) unless PNG required

**J. History**
- Store last 5 generations in localStorage
- Include: thumbnail, prompt, mode, timestamp
- Click to restore settings (not image data)

### Alibaba Qwen Model Support (Enhanced)

**Model Categories**:
| Category | Models | API Endpoint |
|----------|--------|--------------|
| **Qwen Image Edit** | qwen-image-edit-max, qwen-image-edit-plus, etc. | `/multimodal-generation/generation` |
| **Qwen Text-to-Image** | qwen-image-2.0-pro, qwen-image-2.0, etc. | `/image-generation/generation` |
| **Wanxiang Text-to-Image** | wan2.6-t2i, wan2.5-t2i-preview, etc. | `/image-edit/edit` |
| **Wanxiang Image Edit** | wan2.6-image-edit, wan2.5-image-edit, etc. | `/image-edit/edit` |

**Multi-Image Support**:
- Input: 1-3 images
- Output: 1-6 images (via `n` parameter)
- Resolution: Customizable (512-2048px)

**Provider Interface Extended**:
```typescript
interface EditRequest {
  image: Blob;
  mask?: Blob;
  prompt: string;
  mode: EditMode;
  model?: string;
  dimensions?: { width: number; height: number };
  scale?: number;
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'all';
  ratio?: number;
  // Alibaba specific
  outputCount?: number; // 1-6
  images?: Blob[]; // additional images
  size?: string; // "1024x1024"
}
```

### Data Handling

**State Management (React Context)**:
```typescript
type EditMode = 'edit' | 'inpaint' | 'outpaint' | 'upscale' | 't2i';

interface AppState {
  // Image
  originalImage: string | null;
  resultImage: string | null;

  // Configuration
  apiProvider: string;
  apiKey: string;
  model: string;
  miniMaxKey: string;

  // Mode
  activeMode: EditMode;

  // Mask (Inpainting)
  maskData: string | null;

  // History
  history: HistoryItem[];

  // UI State
  isLoading: boolean;
  isSettingsOpen: boolean;

  // Controls
  prompt: string;
  brushSize: number;
  outpaintDirection: 'top' | 'bottom' | 'left' | 'right' | 'all';
  outpaintRatio: number;
  upscaleScale: number;
}
```

### Edge Cases

- No API key: Show modal on first use
- Invalid API key: Show error toast, don't save
- Image too large: Compress automatically
- API rate limit: Show warning, suggest retry
- Network error: Show retry button
- Unsupported format: Show error message
- T2I mode without prompt: Show error "请输入生成描述"

## 4. Acceptance Criteria

### Visual Checkpoints
- [x] Apple dark theme applied (black background, glassmorphism)
- [x] Two-column layout on desktop
- [x] All 5 tabs switch correctly
- [x] Canvas mask painting works smoothly
- [x] Image comparison slider is functional
- [x] Settings modal opens/closes properly
- [x] Toast notifications use dark theme

### Functional Checkpoints
- [x] Can upload images (drag & drop + click)
- [x] API configuration saves correctly
- [x] All 5 modes have appropriate controls
- [x] Prompt optimizer calls MiniMax API
- [x] Image preprocessing works correctly
- [x] History saves and loads
- [x] Download button works
- [x] Error handling shows appropriate messages
- [x] T2I mode works without image

### Alibaba Qwen Checkpoints
- [x] Model list shows all available models
- [x] Different models use correct API endpoints
- [x] Multi-image input supported
- [x] Multi-image output supported (1-6)
- [x] Custom resolution supported

### Performance Checkpoints
- [ ] Initial load < 3 seconds
- [ ] Image operations don't freeze UI
- [ ] Smooth canvas painting (60fps)

## 5. Technical Architecture

### File Structure
```
/app
  /layout.tsx
  /page.tsx
  /globals.css
  /api
    /alibaba
      /route.ts (Qwen API proxy)
/components
  /Header.tsx
  /ControlPanel.tsx
  /CanvasArea.tsx
  /SettingsModal.tsx
  /ImageUploader.tsx
  /ModeTabs.tsx
  /ModeControls.tsx
  /MaskCanvas.tsx
  /ImageCompare.tsx
  /HistoryPanel.tsx
/lib
  /providers/
    - openai.ts
    - google.ts
    - alibaba.ts (enhanced with model categories)
    - replicate.ts
    - minimax.ts
    - index.ts
  /utils.ts (MODELS now includes all Qwen models)
  /preprocessor.ts
  /context.tsx
  /types.ts (EditMode includes 't2i')
```

### Provider Interface
```typescript
interface ImageProvider {
  id: Provider;
  name: string;
  models: { id: string; name: string; category?: string }[];
  validateKey: (key: string) => Promise<boolean>;
  generate: (req: EditRequest, apiKey: string) => Promise<Blob>;
  getModelCategory?: (model: string) => string; // NEW
}
```

---

**Last Updated**: 2026-03-18
**Version**: 1.2.0
**Changes**:
- Apple dark theme redesign
- Alibaba Qwen model optimization
- Text-to-Image (t2i) mode added
- Multi-image input/output support
- Custom resolution support

# UniEdit AI - Specification Document

## 1. Project Overview

**Project Name**: UniEdit AI
**Type**: Web Application (AI Image Editing Platform)
**Core Functionality**: A universal AI image editing platform that allows users to call global mainstream image models (OpenAI, Google, Alibaba, Replicate, etc.) for professional image editing through their own API keys.
**Target Users**: Designers, content creators, and developers who need AI-powered image editing capabilities.

## 2. UI/UX Specification

### Layout Structure

**Main Layout**: Two-column layout
- Left sidebar: Control panel (320px fixed width on desktop)
- Right area: Canvas preview (flexible, fills remaining space)
- Header: Minimal top bar with logo and settings button

**Responsive Breakpoints**:
- Desktop: >= 1024px (side-by-side layout)
- Tablet: 768px - 1023px (stacked layout)
- Mobile: < 768px (full-width stacked, touch-friendly controls)

### Visual Design

**Color Palette**:
- Background: `bg-slate-50` (#f8fafc)
- Card Background: `bg-white` (#ffffff)
- Primary: `blue-600` (#2563eb)
- Primary Hover: `blue-700` (#1d4ed8)
- Secondary: `slate-600` (#475569)
- Text Primary: `slate-900` (#0f172a)
- Text Secondary: `slate-500` (#64748b)
- Border: `slate-200` (#e2e8f0)
- Success: `green-500` (#22c55e)
- Error: `red-500` (#ef4444)
- Warning: `amber-500` (#f59e0b)

**Typography**:
- Font Family: Inter, system-ui, sans-serif
- Headings:
  - H1: 24px, font-weight 700
  - H2: 20px, font-weight 600
  - H3: 16px, font-weight 600
- Body: 14px, font-weight 400
- Small: 12px, font-weight 400

**Spacing System**:
- Base unit: 4px
- Padding: 16px (card), 24px (section)
- Gap: 12px (between elements), 24px (between sections)
- Border Radius: 8px (buttons), 12px (cards), 16px (modals)

**Visual Effects**:
- Card shadows: `shadow-sm` (default), `shadow-md` (hover)
- Transitions: 150ms ease-in-out
- Button hover: scale(1.02) + brightness increase

### Components

**Header**:
- Logo (left): "UniEdit AI" with gradient text
- Settings button (right): Gear icon

**Left Sidebar - Control Panel**:
1. **Upload Section**
   - Drag & drop zone with dashed border
   - File input button
   - Preview thumbnail after upload
   - Image info (dimensions, size)

2. **Mode Tabs**
   - 4 tabs: 智能编辑 | 局部重绘 | 智能扩图 | 画质增强
   - Active tab: blue-600 underline + bold text
   - Inactive: slate-500 text

3. **Mode-specific Controls**
   - **智能编辑**: Prompt textarea
   - **局部重绘**: Brush size slider (5-50px), Undo/Redo buttons, Clear mask button
   - **智能扩图**: Direction selector (上/下/左/右), Expansion ratio (10%-50%)
   - **画质增强**: Scale selector (2x, 4x)

4. **Prompt Enhancer**
   - Input field for simple instruction
   - "✨ 优化指令" button
   - Output: Enhanced prompt (English, professional)

5. **Generate Button**
   - Full-width, blue-600 background
   - Loading state: spinner + "处理中..."
   - Disabled when no image/prompt

**Right Canvas Area**:
1. **Image Comparison View**
   - Split view with draggable slider
   - Original image on left, result on right
   - Labels: "原图" / "结果"

2. **Canvas Layer** (Inpainting mode only)
   - Transparent overlay on image
   - Red mask painting with adjustable brush

3. **Action Buttons**
   - Download button (bottom right)
   - Reset button

**Settings Modal**:
- Provider dropdown: OpenAI, Google Vertex, Alibaba DashScope, Replicate, Fal, MiniMax
- API Key input (password type)
- Model selector (dynamic based on provider)
- MiniMax Key (optional, for prompt optimization)
- Test Connection button
- Save button

**History Panel**:
- Horizontal scrollable gallery
- Thumbnail cards (80x80px)
- Timestamp labels
- Click to reload

### Interactive Behaviors

- Hover: All buttons have hover states with subtle scale/brightness
- Loading: Skeleton screens for async operations
- Error: Toast notifications with red background
- Success: Toast notifications with green background
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
- Canvas layer with Konva
- Paint red mask on areas to redraw
- Brush size adjustment
- Undo/Redo stack (max 20 steps)
- Send both image + mask to API

**E. Outpainting Mode**
- Direction selection: Top, Bottom, Left, Right, All
- Ratio selection: 10% - 50%
- Preview of expansion area
- Smart fill using AI

**F. Upscale Mode**
- Scale options: 2x, 4x
- No prompt needed
- Direct API call

**G. Prompt Optimization**
- Call MiniMax M2.5 API
- System prompt: "You are an expert image editing prompt engineer..."
- Convert simple instructions to detailed English prompts
- Auto-fill to main prompt field

**H. Auto Preprocessor**
- Check image dimensions against model requirements
- OpenAI: Square (1024x1024 or 512x512), white fill if needed
- Alibaba/Google: Max 2048px, maintain aspect ratio
- Convert to JPG (quality 90%) unless PNG required

**I. History**
- Store last 10 generations in localStorage
- Include: thumbnail, prompt, mode, timestamp
- Click to restore settings (not image data)

### Data Handling

**State Management (React Context)**:
```typescript
interface AppState {
  // Image
  originalImage: string | null; // Base64
  resultImage: string | null; // Base64

  // Configuration
  apiProvider: string;
  apiKey: string;
  model: string;
  miniMaxKey: string;

  // Mode
  activeMode: 'edit' | 'inpaint' | 'outpaint' | 'upscale';

  // Mask (Inpainting)
  maskData: string | null;

  // History
  history: HistoryItem[];

  // UI State
  isLoading: boolean;
  isSettingsOpen: boolean;
}
```

### Edge Cases

- No API key: Show modal on first use
- Invalid API key: Show error toast, don't save
- Image too large: Compress automatically
- API rate limit: Show warning, suggest retry
- Network error: Show retry button
- Unsupported format: Show error message

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Clean white/blue color scheme applied
- [ ] Two-column layout on desktop
- [ ] Stacked layout on mobile
- [ ] All tabs switch correctly
- [ ] Canvas mask painting works smoothly
- [ ] Image comparison slider is functional
- [ ] Settings modal opens/closes properly

### Functional Checkpoints
- [ ] Can upload images (drag & drop + click)
- [ ] API configuration saves correctly
- [ ] All 4 modes have appropriate controls
- [ ] Prompt optimizer calls MiniMax API
- [ ] Image preprocessing works correctly
- [ ] History saves and loads
- [ ] Download button works
- [ ] Error handling shows appropriate messages

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
/components
  /Header.tsx
  /ControlPanel.tsx
  /CanvasArea.tsx
  /SettingsModal.tsx
  /ImageUploader.tsx
  /ModeTabs.tsx
  /PromptEnhancer.tsx
  /MaskCanvas.tsx
  /ImageCompare.tsx
  /HistoryPanel.tsx
  /ui (shadcn components)
/lib
  /providers/
    - openai.ts
    - google.ts
    - alibaba.ts
    - replicate.ts
    - minimax.ts
  /utils.ts
  /preprocessor.ts
  /context.tsx
```

### Provider Interface
```typescript
interface ImageProvider {
  id: string;
  name: string;
  models: { id: string; name: string }[];
  validateKey: (key: string) => Promise<boolean>;
  generate: (req: EditRequest, apiKey: string) => Promise<Blob>;
  preprocess: (image: Blob, req: EditRequest) => Promise<Blob>;
}
```

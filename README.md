# UniEdit AI

一个基于 AI 的图像编辑 Web 应用，支持多种图像处理功能。

## 功能特点

| 模式 | 说明 |
|------|------|
| ✏️ **智能编辑** | 修改图片中的文字、物体、风格等 |
| 🎨 **局部重绘** | 涂抹选中区域进行 AI 重绘 |
| 🖼️ **智能扩图** | 根据原图智能扩展画面边界 |
| ✨ **画质增强** | AI 增强图片分辨率和细节（会重新生成） |

## 支持的 AI 提供商

- **阿里云 DashScope** - 千问图像模型
  - `qwen-image-2.0-pro` (推荐)
  - `qwen-image-2.0`
  - `qwen-image-edit-max`
  - `qwen-image-edit-plus`

- **OpenAI** - DALL·E 图像编辑

- **MiniMax** - 海螺图像模型

- **Fal.ai** - Flux Pro 模型

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

首次使用需要配置 AI 提供商的 API Key：

1. 点击右上角设置按钮 ⚙️
2. 选择 AI 提供商
3. 输入对应的 API Key

**获取 API Key：**
- [阿里云 DashScope](https://dashscope.console.aliyun.com/)
- [OpenAI](https://platform.openai.com/)
- [MiniMax](https://platform.minimaxi.com/)
- [Fal.ai](https://fal.ai/)

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

## 使用说明

### 智能编辑模式

1. 上传图片
2. 在文本框中描述你想做的修改
3. 点击生成

示例提示词：
- "把天空改成夕阳"
- "把衣服改成红色"
- "添加一行文字：Hello World"

### 局部重绘模式

1. 上传图片
2. 切换到"局部重绘"模式
3. 用画笔涂抹想要重绘的区域
4. 描述你想生成的内容
5. 点击生成

### 智能扩图模式

1. 上传图片
2. 切换到"智能扩图"模式
3. 选择扩展方向和比例
4. 点击生成

### 画质增强模式

> ⚠️ 注意：此功能使用 AI 重新生成图像，不是真正的超分辨率。生成结果可能与原图有差异。

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript
- **样式**: Tailwind CSS 4
- **图像处理**: Konva (Canvas)
- **UI 组件**: Radix UI, Lucide React

## 注意事项

- 上传图片大小不超过 10MB
- 生成的图像分辨率为 2048×2048
- API 调用会产生费用，请留意使用量

## License

MIT

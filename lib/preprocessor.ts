import imageCompression from 'browser-image-compression';

export interface PreprocessorOptions {
  provider: string;
  targetSize?: 'square' | 'landscape' | 'portrait';
  maxDimension?: number;
  quality?: number;
}

export async function preprocessImage(
  base64Image: string,
  options: PreprocessorOptions
): Promise<string> {
  const { provider, maxDimension = 2048, quality = 0.9 } = options;

  // Convert base64 to blob
  const blob = await fetch(base64Image).then(res => res.blob());

  // Get original dimensions
  const img = await loadImage(base64Image);
  let { width, height } = { width: img.width, height: img.height };

  // Provider-specific preprocessing
  let targetWidth = width;
  let targetHeight = height;

  switch (provider) {
    case 'openai':
      // OpenAI requires square images
      const size = Math.min(width, height, 1024);
      targetWidth = size;
      targetHeight = size;
      break;
    case 'google':
    case 'alibaba':
      // Keep aspect ratio, max 2048px
      const maxDim = Math.min(width, height, maxDimension);
      if (width > maxDim || height > maxDim) {
        const ratio = maxDim / Math.max(width, height);
        targetWidth = Math.round(width * ratio);
        targetHeight = Math.round(height * ratio);
      }
      break;
    case 'replicate':
    case 'fal':
    case 'minimax':
      // Generally flexible, use 2048 as max
      const repMaxDim = Math.min(width, height, maxDimension);
      if (width > repMaxDim || height > repMaxDim) {
        const repRatio = repMaxDim / Math.max(width, height);
        targetWidth = Math.round(width * repRatio);
        targetHeight = Math.round(height * repRatio);
      }
      break;
  }

  // Resize using canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill with white if converting to square
  if (provider === 'openai' && (width !== height)) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Convert to blob with quality
  const processedBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      'image/jpeg',
      quality
    );
  });

  // Compress if still too large
  if (processedBlob.size > 10 * 1024 * 1024) {
    // Convert Blob to File for imageCompression
    const file = new File([processedBlob], 'image.jpg', { type: 'image/jpeg' });
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: 8,
      maxWidthOrHeight: Math.max(targetWidth, targetHeight),
      useWebWorker: true,
    });
    return blobToBase64(compressedBlob);
  }

  return blobToBase64(processedBlob);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function createMaskFromDrawing(
  drawingDataUrl: string,
  originalImageWidth: number,
  originalImageHeight: number,
  canvasWidth: number,
  canvasHeight: number
): Promise<string> {
  // Create a canvas with the original image dimensions
  const canvas = document.createElement('canvas');
  canvas.width = originalImageWidth;
  canvas.height = originalImageHeight;
  const ctx = canvas.getContext('2d')!;

  // Load the drawing
  const drawingImg = await loadImage(drawingDataUrl);

  // Calculate scale to fit drawing to original image
  const scaleX = originalImageWidth / canvasWidth;
  const scaleY = originalImageHeight / canvasHeight;

  // Draw the mask (white areas become transparent, red areas become white for inpainting)
  ctx.drawImage(drawingImg, 0, 0, canvasWidth, canvasHeight, 0, 0, originalImageWidth, originalImageHeight);

  // Get image data and invert colors (red becomes white for mask)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // If there's red (mask area), make it white
    if (data[i] > 128 && data[i + 1] < 100 && data[i + 2] < 100) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    } else {
      // Transparent for non-mask areas
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

export async function expandImageForOutpaint(
  base64Image: string,
  direction: 'top' | 'bottom' | 'left' | 'right' | 'all',
  ratio: number
): Promise<string> {
  const img = await loadImage(base64Image);
  const { width, height } = { width: img.width, height: img.height };

  const expandPixels = Math.round(Math.min(width, height) * (ratio / 100));

  let newWidth = width;
  let newHeight = height;
  let offsetX = 0;
  let offsetY = 0;

  switch (direction) {
    case 'top':
      newHeight += expandPixels;
      offsetY = expandPixels;
      break;
    case 'bottom':
      newHeight += expandPixels;
      break;
    case 'left':
      newWidth += expandPixels;
      offsetX = expandPixels;
      break;
    case 'right':
      newWidth += expandPixels;
      break;
    case 'all':
      newWidth += expandPixels * 2;
      newHeight += expandPixels * 2;
      offsetX = expandPixels;
      offsetY = expandPixels;
      break;
  }

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill with white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, newWidth, newHeight);

  // Draw original image
  ctx.drawImage(img, offsetX, offsetY, width, height);

  return canvas.toDataURL('image/jpeg', 0.9);
}

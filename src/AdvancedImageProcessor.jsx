import React, { useState, useRef } from 'react';
import { Upload, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const AdvancedImageProcessor = () => {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [settings, setSettings] = useState({
    algorithm: 'lanczos',
    width: 800,
    height: 600,
    maintainAspect: true,
    quality: 90,
    sharpness: 0,
    format: 'png',
    gamma: 1.0,
    dpi: 72
  });
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  
  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const workerRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        setImageData(imgData);
        
        // Update settings with image dimensions
        setSettings(prev => ({
          ...prev,
          width: img.width,
          height: img.height
        }));

        // Calculate stats
        const fileSize = file.size;
        const pixels = img.width * img.height;
        setStats({
          originalSize: fileSize,
          originalDimensions: `${img.width} × ${img.height}`,
          pixels: pixels,
          channels: 4,
          colorDepth: '8-bit',
          format: file.type
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const updateDimension = (key, value) => {
    const numValue = parseInt(value) || 1;
    
    if (settings.maintainAspect && image) {
      const aspectRatio = image.width / image.height;
      
      if (key === 'width') {
        setSettings(prev => ({
          ...prev,
          width: numValue,
          height: Math.round(numValue / aspectRatio)
        }));
      } else {
        setSettings(prev => ({
          ...prev,
          height: numValue,
          width: Math.round(numValue * aspectRatio)
        }));
      }
    } else {
      setSettings(prev => ({ ...prev, [key]: numValue }));
    }
  };

  // Lanczos resampling - industry standard for high quality
  const lanczosKernel = (x, a = 3) => {
    if (x === 0) return 1;
    if (Math.abs(x) >= a) return 0;
    
    const piX = Math.PI * x;
    return (a * Math.sin(piX) * Math.sin(piX / a)) / (piX * piX);
  };

  const lanczosResize = (srcData, srcW, srcH, dstW, dstH, sharpness) => {
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    const filterSize = 3; // Lanczos3
    
    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        const srcX = (x + 0.5) * xRatio;
        const srcY = (y + 0.5) * yRatio;
        
        const xStart = Math.floor(srcX) - filterSize + 1;
        const yStart = Math.floor(srcY) - filterSize + 1;
        
        const dstIdx = (y * dstW + x) * 4;
        
        for (let c = 0; c < 4; c++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let ky = 0; ky < filterSize * 2; ky++) {
            for (let kx = 0; kx < filterSize * 2; kx++) {
              const srcXi = Math.max(0, Math.min(srcW - 1, xStart + kx));
              const srcYi = Math.max(0, Math.min(srcH - 1, yStart + ky));
              
              const weight = lanczosKernel(srcX - srcXi) * lanczosKernel(srcY - srcYi);
              const srcIdx = (srcYi * srcW + srcXi) * 4;
              
              sum += srcData.data[srcIdx + c] * weight;
              weightSum += weight;
            }
          }
          
          let value = sum / (weightSum || 1);
          
          // Apply sharpening using unsharp mask
          if (sharpness > 0 && c < 3) {
            const centerX = Math.floor(srcX);
            const centerY = Math.floor(srcY);
            const centerIdx = (centerY * srcW + centerX) * 4;
            const originalValue = srcData.data[centerIdx + c];
            value = value + (originalValue - value) * sharpness;
          }
          
          dstData[dstIdx + c] = Math.max(0, Math.min(255, Math.round(value)));
        }
      }
    }
    
    return dstData;
  };

  // Mitchell-Netravali - balanced quality/speed
  const mitchellNetravali = (x) => {
    const B = 1/3;
    const C = 1/3;
    const ax = Math.abs(x);
    
    if (ax < 1) {
      return ((12 - 9*B - 6*C) * ax*ax*ax + 
              (-18 + 12*B + 6*C) * ax*ax + 
              (6 - 2*B)) / 6;
    } else if (ax < 2) {
      return ((-B - 6*C) * ax*ax*ax + 
              (6*B + 30*C) * ax*ax + 
              (-12*B - 48*C) * ax + 
              (8*B + 24*C)) / 6;
    }
    return 0;
  };

  const mitchellResize = (srcData, srcW, srcH, dstW, dstH) => {
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    const filterSize = 2;
    
    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        const srcX = (x + 0.5) * xRatio;
        const srcY = (y + 0.5) * yRatio;
        
        const xStart = Math.floor(srcX) - filterSize + 1;
        const yStart = Math.floor(srcY) - filterSize + 1;
        
        const dstIdx = (y * dstW + x) * 4;
        
        for (let c = 0; c < 4; c++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let ky = 0; ky < filterSize * 2; ky++) {
            for (let kx = 0; kx < filterSize * 2; kx++) {
              const srcXi = Math.max(0, Math.min(srcW - 1, xStart + kx));
              const srcYi = Math.max(0, Math.min(srcH - 1, yStart + ky));
              
              const weight = mitchellNetravali(srcX - srcXi) * mitchellNetravali(srcY - srcYi);
              const srcIdx = (srcYi * srcW + srcXi) * 4;
              
              sum += srcData.data[srcIdx + c] * weight;
              weightSum += weight;
            }
          }
          
          dstData[dstIdx + c] = Math.max(0, Math.min(255, Math.round(sum / (weightSum || 1))));
        }
      }
    }
    
    return dstData;
  };

  // Box filter - fast for downscaling
  const boxResize = (srcData, srcW, srcH, dstW, dstH) => {
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    
    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        const xStart = Math.floor(x * xRatio);
        const xEnd = Math.ceil((x + 1) * xRatio);
        const yStart = Math.floor(y * yRatio);
        const yEnd = Math.ceil((y + 1) * yRatio);
        
        const dstIdx = (y * dstW + x) * 4;
        let count = 0;
        
        for (let c = 0; c < 4; c++) {
          let sum = 0;
          count = 0;
          
          for (let sy = yStart; sy < yEnd && sy < srcH; sy++) {
            for (let sx = xStart; sx < xEnd && sx < srcW; sx++) {
              const srcIdx = (sy * srcW + sx) * 4;
              sum += srcData.data[srcIdx + c];
              count++;
            }
          }
          
          dstData[dstIdx + c] = Math.round(sum / count);
        }
      }
    }
    
    return dstData;
  };

  // Gamma correction
  const applyGamma = (data, gamma) => {
    if (gamma === 1.0) return data;
    
    const corrected = new Uint8ClampedArray(data.length);
    const invGamma = 1 / gamma;
    
    for (let i = 0; i < data.length; i += 4) {
      corrected[i] = Math.pow(data[i] / 255, invGamma) * 255;
      corrected[i + 1] = Math.pow(data[i + 1] / 255, invGamma) * 255;
      corrected[i + 2] = Math.pow(data[i + 2] / 255, invGamma) * 255;
      corrected[i + 3] = data[i + 3]; // Alpha unchanged
    }
    
    return corrected;
  };

  const processImage = async () => {
    if (!imageData) return;
    
    setProcessing(true);
    const startTime = performance.now();
    
    const srcW = imageData.width;
    const srcH = imageData.height;
    const dstW = settings.width;
    const dstH = settings.height;
    
    let result;
    
    // Choose algorithm
    switch (settings.algorithm) {
      case 'lanczos':
        result = lanczosResize(imageData, srcW, srcH, dstW, dstH, settings.sharpness);
        break;
      case 'mitchell':
        result = mitchellResize(imageData, srcW, srcH, dstW, dstH);
        break;
      case 'box':
        result = boxResize(imageData, srcW, srcH, dstW, dstH);
        break;
      default:
        result = lanczosResize(imageData, srcW, srcH, dstW, dstH, settings.sharpness);
    }
    
    // Apply gamma correction
    result = applyGamma(result, settings.gamma);
    
    const endTime = performance.now();
    
    // Draw to canvas
    const canvas = processedCanvasRef.current;
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext('2d');
    const newImageData = new ImageData(result, dstW, dstH);
    ctx.putImageData(newImageData, 0, 0);
    
    setProcessedData(newImageData);
    
    // Estimate output size
    canvas.toBlob((blob) => {
      setStats(prev => ({
        ...prev,
        processedSize: blob.size,
        processedDimensions: `${dstW} × ${dstH}`,
        processingTime: (endTime - startTime).toFixed(2),
        compressionRatio: (prev.originalSize / blob.size).toFixed(2),
        algorithm: settings.algorithm
      }));
    }, `image/${settings.format}`, settings.quality / 100);
    
    setProcessing(false);
  };

  const downloadImage = () => {
    if (!processedCanvasRef.current) return;
    
    processedCanvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resized_${settings.width}x${settings.height}.${settings.format}`;
      a.click();
      URL.revokeObjectURL(url);
    }, `image/${settings.format}`, settings.quality / 100);
  };

  const quickResize = (preset) => {
    if (!image) return;
    
    const presets = {
      'thumbnail': { width: 150, height: 150 },
      'small': { width: 640, height: 480 },
      'medium': { width: 1280, height: 720 },
      'hd': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 }
    };
    
    const { width, height } = presets[preset];
    const aspectRatio = image.width / image.height;
    
    if (settings.maintainAspect) {
      if (width / height > aspectRatio) {
        setSettings(prev => ({
          ...prev,
          width: Math.round(height * aspectRatio),
          height: height
        }));
      } else {
        setSettings(prev => ({
          ...prev,
          width: width,
          height: Math.round(width / aspectRatio)
        }));
      }
    } else {
      setSettings(prev => ({ ...prev, width, height }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Professional Image Resizer
          </h1>
          <p className="text-gray-400">Industry-grade algorithms with advanced controls</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upload & Quick Presets */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload size={20} />
              Upload & Quick Resize
            </h2>
            
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition mb-4">
              <div className="text-center">
                <Upload className="mx-auto mb-2" size={32} />
                <span className="text-sm text-gray-400">Click to upload image</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>

            {image && (
              <>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">Quick Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => quickResize('thumbnail')} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm transition">150×150</button>
                    <button onClick={() => quickResize('small')} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm transition">640×480</button>
                    <button onClick={() => quickResize('medium')} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm transition">1280×720</button>
                    <button onClick={() => quickResize('hd')} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm transition">1920×1080</button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={settings.maintainAspect}
                      onChange={(e) => setSettings(prev => ({ ...prev, maintainAspect: e.target.checked }))}
                      className="rounded"
                    />
                    Maintain Aspect Ratio
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Dimensions & Algorithm */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Maximize2 size={20} />
              Dimensions & Algorithm
            </h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Width (px)</label>
                <input 
                  type="number" 
                  value={settings.width}
                  onChange={(e) => updateDimension('width', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Height (px)</label>
                <input 
                  type="number" 
                  value={settings.height}
                  onChange={(e) => updateDimension('height', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Resampling Algorithm</label>
              <select 
                value={settings.algorithm} 
                onChange={(e) => setSettings(prev => ({ ...prev, algorithm: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="lanczos">Lanczos3 (Best Quality)</option>
                <option value="mitchell">Mitchell-Netravali (Balanced)</option>
                <option value="box">Box Filter (Fast Downscale)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Sharpness: {settings.sharpness.toFixed(2)}</label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={settings.sharpness}
                onChange={(e) => setSettings(prev => ({ ...prev, sharpness: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Gamma: {settings.gamma.toFixed(2)}</label>
              <input 
                type="range" 
                min="0.5" 
                max="2.5" 
                step="0.1" 
                value={settings.gamma}
                onChange={(e) => setSettings(prev => ({ ...prev, gamma: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Output Settings */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Download size={20} />
              Output Settings
            </h2>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Format</label>
              <select 
                value={settings.format} 
                onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="png">PNG (Lossless)</option>
                <option value="jpeg">JPEG (Compressed)</option>
                <option value="webp">WebP (Modern)</option>
              </select>
            </div>

            {settings.format !== 'png' && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Quality: {settings.quality}%</label>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={settings.quality}
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">DPI</label>
              <input 
                type="number" 
                value={settings.dpi}
                onChange={(e) => setSettings(prev => ({ ...prev, dpi: parseInt(e.target.value) || 72 }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
            </div>

            <button 
              onClick={processImage}
              disabled={!imageData || processing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition mb-2"
            >
              {processing ? 'Processing...' : 'Resize Image'}
            </button>
            
            <button 
              onClick={downloadImage}
              disabled={!processedData}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 mb-6">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Original</div>
                <div className="text-lg font-bold">{stats.originalDimensions}</div>
                <div className="text-gray-500">{(stats.originalSize / 1024).toFixed(1)} KB</div>
              </div>
              {stats.processedDimensions && (
                <>
                  <div>
                    <div className="text-gray-400">Processed</div>
                    <div className="text-lg font-bold">{stats.processedDimensions}</div>
                    <div className="text-gray-500">{(stats.processedSize / 1024).toFixed(1)} KB</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Processing Time</div>
                    <div className="text-lg font-bold">{stats.processingTime} ms</div>
                    <div className="text-gray-500">{stats.algorithm}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Compression</div>
                    <div className="text-lg font-bold">{stats.compressionRatio}x</div>
                    <div className="text-gray-500">{((1 - stats.processedSize / stats.originalSize) * 100).toFixed(1)}% smaller</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Image Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Original</h2>
              <div className="flex gap-2">
                <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="p-2 bg-gray-700 rounded hover:bg-gray-600"><ZoomOut size={16} /></button>
                <span className="px-3 py-2 bg-gray-700 rounded text-sm">{zoom}%</span>
                <button onClick={() => setZoom(Math.min(200, zoom + 25))} className="p-2 bg-gray-700 rounded hover:bg-gray-600"><ZoomIn size={16} /></button>
              </div>
            </div>
            <div className="bg-gray-700 rounded p-4 overflow-auto max-h-96 flex items-center justify-center">
              <canvas ref={canvasRef} style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top left' }} className="border border-gray-600" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Processed</h2>
              <button 
                onClick={() => setCompareMode(!compareMode)}
                className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
              >
                {compareMode ? 'Exit Compare' : 'Compare'}
              </button>
            </div>
            <div className="bg-gray-700 rounded p-4 overflow-auto max-h-96 flex items-center justify-center">
              <canvas ref={processedCanvasRef} style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top left' }} className="border border-gray-600" />
            </div>
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Algorithm Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-900/50 p-4 rounded">
              <h3 className="font-bold text-blue-400 mb-2">Lanczos3</h3>
              <p className="text-gray-400 mb-2">Uses sinc function with 3-lobe window. Samples 6×6 pixel grid.</p>
              <p className="text-xs text-gray-500">Best for: High-quality photos, upscaling</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded">
              <h3 className="font-bold text-purple-400 mb-2">Mitchell-Netravali</h3>
              <p className="text-gray-400 mb-2">Cubic filter with B=C=1/3. Samples 4×4 pixel grid.</p>
              <p className="text-xs text-gray-500">Best for: Balanced quality and speed</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded">
              <h3 className="font-bold text-green-400 mb-2">Box Filter</h3>
              <p className="text-gray-400 mb-2">Averages all pixels in target area. Simple and fast.</p>
              <p className="text-xs text-gray-500">Best for: Quick thumbnails, downscaling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedImageProcessor;
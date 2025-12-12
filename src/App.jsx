import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download } from 'lucide-react';

const App = () => {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [algorithm, setAlgorithm] = useState('nearest');
  const [scale, setScale] = useState(0.5);
  const [logs, setLogs] = useState([]);
  
  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        
        // Draw original image to canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get raw pixel data
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        setImageData(imgData);
        
        addLog(`Image loaded: ${img.width}x${img.height} pixels`);
        addLog(`Raw data size: ${imgData.data.length} bytes (${imgData.data.length/4} pixels)`);
        addLog(`Each pixel = 4 bytes [R, G, B, A]`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // NEAREST NEIGHBOR - Simplest algorithm
  const nearestNeighbor = (srcData, srcW, srcH, dstW, dstH) => {
    addLog(`\n--- NEAREST NEIGHBOR RESIZE ---`);
    addLog(`Scaling from ${srcW}x${srcH} to ${dstW}x${dstH}`);
    
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    
    addLog(`X ratio: ${xRatio.toFixed(3)}, Y ratio: ${yRatio.toFixed(3)}`);
    
    let samplesShown = 0;
    
    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        // Map destination pixel back to source
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);
        
        // Calculate array indices
        const dstIdx = (y * dstW + x) * 4;
        const srcIdx = (srcY * srcW + srcX) * 4;
        
        // Copy pixel data
        dstData[dstIdx] = srcData.data[srcIdx];         // R
        dstData[dstIdx + 1] = srcData.data[srcIdx + 1]; // G
        dstData[dstIdx + 2] = srcData.data[srcIdx + 2]; // B
        dstData[dstIdx + 3] = srcData.data[srcIdx + 3]; // A
        
        // Show first few samples
        if (samplesShown < 3) {
          addLog(`Pixel (${x},${y}) → source (${srcX},${srcY})`);
          samplesShown++;
        }
      }
    }
    
    return dstData;
  };

  // BILINEAR INTERPOLATION - Better quality
  const bilinearInterpolation = (srcData, srcW, srcH, dstW, dstH) => {
    addLog(`\n--- BILINEAR INTERPOLATION ---`);
    addLog(`Scaling from ${srcW}x${srcH} to ${dstW}x${dstH}`);
    
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = (srcW - 1) / dstW;
    const yRatio = (srcH - 1) / dstH;
    
    let samplesShown = 0;
    
    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        // Map to source position (floating point)
        const srcX = x * xRatio;
        const srcY = y * yRatio;
        
        // Get 4 surrounding pixels
        const x1 = Math.floor(srcX);
        const y1 = Math.floor(srcY);
        const x2 = Math.min(x1 + 1, srcW - 1);
        const y2 = Math.min(y1 + 1, srcH - 1);
        
        // Calculate weights
        const dx = srcX - x1;
        const dy = srcY - y1;
        
        // Get 4 pixel positions
        const idx1 = (y1 * srcW + x1) * 4; // top-left
        const idx2 = (y1 * srcW + x2) * 4; // top-right
        const idx3 = (y2 * srcW + x1) * 4; // bottom-left
        const idx4 = (y2 * srcW + x2) * 4; // bottom-right
        
        const dstIdx = (y * dstW + x) * 4;
        
        // Interpolate each channel (R, G, B, A)
        for (let c = 0; c < 4; c++) {
          const p1 = srcData.data[idx1 + c];
          const p2 = srcData.data[idx2 + c];
          const p3 = srcData.data[idx3 + c];
          const p4 = srcData.data[idx4 + c];
          
          // Bilinear formula
          const value = (1 - dx) * (1 - dy) * p1 +
                       dx * (1 - dy) * p2 +
                       (1 - dx) * dy * p3 +
                       dx * dy * p4;
          
          dstData[dstIdx + c] = Math.round(value);
        }
        
        if (samplesShown < 2) {
          addLog(`Pixel (${x},${y}) blends 4 pixels around (${srcX.toFixed(2)},${srcY.toFixed(2)})`);
          addLog(`  Weights: dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)}`);
          samplesShown++;
        }
      }
    }
    
    return dstData;
  };

  // BICUBIC INTERPOLATION - Best quality
  const bicubicWeight = (x) => {
    const a = -0.5; // Standard bicubic parameter
    const absX = Math.abs(x);
    
    if (absX <= 1) {
      return ((a + 2) * absX * absX * absX) - ((a + 3) * absX * absX) + 1;
    } else if (absX < 2) {
      return (a * absX * absX * absX) - (5 * a * absX * absX) + (8 * a * absX) - (4 * a);
    }
    return 0;
  };

  const bicubicInterpolation = (srcData, srcW, srcH, dstW, dstH) => {
    addLog(`\n--- BICUBIC INTERPOLATION ---`);
    addLog(`Scaling from ${srcW}x${srcH} to ${dstW}x${dstH}`);
    addLog(`Using 4x4 pixel grid for each output pixel`);
    
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = (srcW - 1) / dstW;
    const yRatio = (srcH - 1) / dstH;
    
    let samplesShown = 0;
    
    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        const srcX = x * xRatio;
        const srcY = y * yRatio;
        
        const x1 = Math.floor(srcX);
        const y1 = Math.floor(srcY);
        
        const dstIdx = (y * dstW + x) * 4;
        
        // For each color channel
        for (let c = 0; c < 4; c++) {
          let sum = 0;
          let weightSum = 0;
          
          // Sample 4x4 grid
          for (let dy = -1; dy <= 2; dy++) {
            for (let dx = -1; dx <= 2; dx++) {
              const srcXi = Math.max(0, Math.min(srcW - 1, x1 + dx));
              const srcYi = Math.max(0, Math.min(srcH - 1, y1 + dy));
              
              const weight = bicubicWeight(srcX - srcXi) * bicubicWeight(srcY - srcYi);
              const srcIdx = (srcYi * srcW + srcXi) * 4;
              
              sum += srcData.data[srcIdx + c] * weight;
              weightSum += weight;
            }
          }
          
          dstData[dstIdx + c] = Math.max(0, Math.min(255, Math.round(sum / weightSum)));
        }
        
        if (samplesShown < 1) {
          addLog(`Pixel (${x},${y}) weighted blend of 16 pixels around (${srcX.toFixed(2)},${srcY.toFixed(2)})`);
          samplesShown++;
        }
      }
    }
    
    return dstData;
  };

  const processImage = () => {
    if (!imageData) return;
    
    setLogs([]);
    addLog(`Starting resize with ${algorithm} algorithm...`);
    
    const startTime = performance.now();
    
    const srcW = imageData.width;
    const srcH = imageData.height;
    const dstW = Math.floor(srcW * scale);
    const dstH = Math.floor(srcH * scale);
    
    let result;
    
    switch (algorithm) {
      case 'nearest':
        result = nearestNeighbor(imageData, srcW, srcH, dstW, dstH);
        break;
      case 'bilinear':
        result = bilinearInterpolation(imageData, srcW, srcH, dstW, dstH);
        break;
      case 'bicubic':
        result = bicubicInterpolation(imageData, srcW, srcH, dstW, dstH);
        break;
      default:
        result = nearestNeighbor(imageData, srcW, srcH, dstW, dstH);
    }
    
    const endTime = performance.now();
    addLog(`\nProcessing complete in ${(endTime - startTime).toFixed(2)}ms`);
    
    // Draw to canvas
    const canvas = processedCanvasRef.current;
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext('2d');
    const newImageData = new ImageData(result, dstW, dstH);
    ctx.putImageData(newImageData, 0, 0);
    
    setProcessedData(newImageData);
  };

  const downloadImage = () => {
    if (!processedCanvasRef.current) return;
    
    processedCanvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resized_${algorithm}_${scale}x.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Image Resizer</h1>
        <p className="text-gray-400 mb-8">Understanding pixel manipulation at the byte level</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Controls */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Controls</h2>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Upload Image</label>
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <div className="text-center">
                  <Upload className="mx-auto mb-2" size={32} />
                  <span className="text-sm text-gray-400">Click to upload</span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Algorithm</label>
              <select 
                value={algorithm} 
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="nearest">Nearest Neighbor (Fast, Low Quality)</option>
                <option value="bilinear">Bilinear (Medium Quality)</option>
                <option value="bicubic">Bicubic (Best Quality)</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Scale: {scale}x</label>
              <input 
                type="range" 
                min="0.1" 
                max="2" 
                step="0.1" 
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.1x (smaller)</span>
                <span>2x (larger)</span>
              </div>
            </div>
            
            <button 
              onClick={processImage}
              disabled={!imageData}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition mb-2"
            >
              Process Image
            </button>
            
            <button 
              onClick={downloadImage}
              disabled={!processedData}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download Result
            </button>
          </div>
          
          {/* Processing Log */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Processing Log</h2>
            <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500">Upload and process an image to see logs...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-green-400 mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Image Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Original Image</h2>
            <div className="bg-gray-700 rounded p-4 flex items-center justify-center min-h-64">
              <canvas ref={canvasRef} className="max-w-full h-auto border border-gray-600" />
            </div>
            {image && (
              <div className="mt-2 text-sm text-gray-400">
                {image.width} × {image.height} pixels
              </div>
            )}
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Processed Image</h2>
            <div className="bg-gray-700 rounded p-4 flex items-center justify-center min-h-64">
              <canvas ref={processedCanvasRef} className="max-w-full h-auto border border-gray-600" />
            </div>
            {processedData && (
              <div className="mt-2 text-sm text-gray-400">
                {processedData.width} × {processedData.height} pixels
              </div>
            )}
          </div>
        </div>
        
        {/* Algorithm Explanation */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <strong className="text-white">Nearest Neighbor:</strong> Simply picks the closest pixel. Fast but produces blocky results when scaling up.
              Formula: <code className="bg-gray-900 px-2 py-1 rounded">srcX = floor(dstX × ratio)</code>
            </div>
            <div>
              <strong className="text-white">Bilinear:</strong> Averages 4 surrounding pixels using distance-based weights. Smoother results.
              Formula: <code className="bg-gray-900 px-2 py-1 rounded">P = (1-dx)(1-dy)×P1 + dx(1-dy)×P2 + (1-dx)dy×P3 + dx×dy×P4</code>
            </div>
            <div>
              <strong className="text-white">Bicubic:</strong> Uses 16 surrounding pixels (4×4 grid) with cubic polynomial weights. Best quality but slowest.
              Uses cubic interpolation function for smooth curves.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
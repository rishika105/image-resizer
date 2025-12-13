  // Bicubic
  const bicubicWeight = (x) => {
    const a = -0.5;
    const absX = Math.abs(x);
    
    if (absX <= 1) {
      return ((a + 2) * absX * absX * absX) - ((a + 3) * absX * absX) + 1;
    } else if (absX < 2) {
      return (a * absX * absX * absX) - (5 * a * absX * absX) + (8 * a * absX) - (4 * a);
    }
    return 0;
  };

 export const bicubicInterpolation = (srcData, srcW, srcH, dstW, dstH) => {
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = (srcW - 1) / dstW;
    const yRatio = (srcH - 1) / dstH;
    
    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        const srcX = x * xRatio;
        const srcY = y * yRatio;
        
        const x1 = Math.floor(srcX);
        const y1 = Math.floor(srcY);
        
        const dstIdx = (y * dstW + x) * 4;
        
        for (let c = 0; c < 4; c++) {
          let sum = 0;
          let weightSum = 0;
          
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
      }
    }
    
    return dstData;
  };
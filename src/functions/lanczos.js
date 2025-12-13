  const lanczosKernel = (x, a = 3) => {
    if (x === 0) return 1;
    if (Math.abs(x) >= a) return 0;
    
    const piX = Math.PI * x;
    return (a * Math.sin(piX) * Math.sin(piX / a)) / (piX * piX);
  };

export const lanczosResize = (srcData, srcW, srcH, dstW, dstH) => {
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    const filterSize = 3;
    
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
          
          dstData[dstIdx + c] = Math.max(0, Math.min(255, Math.round(sum / (weightSum || 1))));
        }
      }
    }
    
    return dstData;
  };

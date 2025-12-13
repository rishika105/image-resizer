  // Nearest Neighbor
export const nearestNeighbor = (srcData, srcW, srcH, dstW, dstH) => {
    const dstData = new Uint8ClampedArray(dstW * dstH * 4);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;
    
    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);
        
        const dstIdx = (y * dstW + x) * 4;
        const srcIdx = (srcY * srcW + srcX) * 4;
        
        dstData[dstIdx] = srcData.data[srcIdx];
        dstData[dstIdx + 1] = srcData.data[srcIdx + 1];
        dstData[dstIdx + 2] = srcData.data[srcIdx + 2];
        dstData[dstIdx + 3] = srcData.data[srcIdx + 3];
      }
    }
    
    return dstData;
  };


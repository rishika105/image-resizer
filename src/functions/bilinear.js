// Bilinear
export const bilinearInterpolation = (srcData, srcW, srcH, dstW, dstH, { addLog = () => { } } = {}) => {
  addLog(`\n🔷 BILINEAR INTERPOLATION`);
  addLog(`Target size: ${dstW}×${dstH}`);
  addLog(`Sampling 4 pixels per output pixel`);

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
      const x2 = Math.min(x1 + 1, srcW - 1);
      const y2 = Math.min(y1 + 1, srcH - 1);

      const dx = srcX - x1;
      const dy = srcY - y1;

      const idx1 = (y1 * srcW + x1) * 4;
      const idx2 = (y1 * srcW + x2) * 4;
      const idx3 = (y2 * srcW + x1) * 4;
      const idx4 = (y2 * srcW + x2) * 4;

      const dstIdx = (y * dstW + x) * 4;

      for (let c = 0; c < 4; c++) {
        const p1 = srcData.data[idx1 + c];
        const p2 = srcData.data[idx2 + c];
        const p3 = srcData.data[idx3 + c];
        const p4 = srcData.data[idx4 + c];

        const value =
          (1 - dx) * (1 - dy) * p1 +
          dx * (1 - dy) * p2 +
          (1 - dx) * dy * p3 +
          dx * dy * p4;

        dstData[dstIdx + c] = Math.round(value);
      }

      if (samplesShown < 2) {
        addLog(
          `  Dst(${x},${y}) blends 4 pixels around (${srcX.toFixed(
            1
          )},${srcY.toFixed(1)})`
        );
        addLog(`    Weights: dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)}`);
        samplesShown++;
      }
    }
  }

  addLog(`✓ Blended ${dstW * dstH * 4} pixels`);
  return dstData;
};
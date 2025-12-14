// Box Filter
export const boxResize = (srcData, srcW, srcH, dstW, dstH, { addLog = () => { } } = {}) => {
    addLog(`\n🔷 BOX FILTER`);
    addLog(`Target size: ${dstW}×${dstH}`);
    addLog(`Averaging all pixels in each box region`);

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

            for (let c = 0; c < 4; c++) {
                let sum = 0;
                let count = 0;

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

    addLog(`✓ Averaged ${dstW * dstH} box regions`);
    return dstData;
};

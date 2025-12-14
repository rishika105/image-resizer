// Mitchell-Netravali
const mitchellNetravali = (x) => {
    const B = 1 / 3;
    const C = 1 / 3;
    const ax = Math.abs(x);

    if (ax < 1) {
        return (
            ((12 - 9 * B - 6 * C) * ax * ax * ax +
                (-18 + 12 * B + 6 * C) * ax * ax +
                (6 - 2 * B)) /
            6
        );
    } else if (ax < 2) {
        return (
            ((-B - 6 * C) * ax * ax * ax +
                (6 * B + 30 * C) * ax * ax +
                (-12 * B - 48 * C) * ax +
                (8 * B + 24 * C)) /
            6
        );
    }
    return 0;
};

export const mitchellResize = (srcData, srcW, srcH, dstW, dstH, { addLog = () => { } } = {}) => {
    addLog(`\n🔷 MITCHELL-NETRAVALI FILTER`);
    addLog(`Target size: ${dstW}×${dstH}`);
    addLog(`Using 4×4 kernel with B=C=1/3`);

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

                        const weight =
                            mitchellNetravali(srcX - srcXi) *
                            mitchellNetravali(srcY - srcYi);
                        const srcIdx = (srcYi * srcW + srcXi) * 4;

                        sum += srcData.data[srcIdx + c] * weight;
                        weightSum += weight;
                    }
                }

                dstData[dstIdx + c] = Math.max(
                    0,
                    Math.min(255, Math.round(sum / (weightSum || 1)))
                );
            }
        }
    }

    addLog(`✓ Applied Mitchell-Netravali filter to ${dstW * dstH} pixels`);
    return dstData;
};

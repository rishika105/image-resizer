import React from "react";

const TheoryMaths = () => {
  return (
    <>
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-green-400">
            📐 The Mathematics Behind Interpolation
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-3">
                What is Interpolation?
              </h3>
              <p className="text-gray-300 mb-4">
                Interpolation is estimating unknown values between known data
                points. In image resizing, we know the original pixel colors and
                need to estimate new pixel colors at positions that didn't exist
                before.
              </p>
              <div className="bg-black rounded p-4 text-sm font-mono text-green-400">
                Known: Pixels at integer coordinates (0,0), (1,0), (0,1), (1,1)
                <br />
                Unknown: Pixel at (0.5, 0.7) ← Need to interpolate this!
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-3">
                Nearest Neighbor - The Simplest
              </h3>
              <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                f(x, y) = pixel[floor(x), floor(y)]
              </div>
              <p className="text-gray-300 mb-3">
                Just round down to nearest integer coordinate. No math, no
                blending!
              </p>
              <div className="bg-gray-700 rounded p-4">
                <strong className="text-blue-300">Example:</strong>
                <div className="text-gray-300 text-sm mt-2">
                  Want pixel at (3.7, 2.3)?
                  <br />
                  floor(3.7) = 3, floor(2.3) = 2<br />→ Use pixel (3, 2)
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-3">
                Bilinear - Linear in 2D
              </h3>
              <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                f(x,y) = (1-dx)(1-dy)·P₁ + dx(1-dy)·P₂ + (1-dx)dy·P₃ + dx·dy·P₄
                <br />
                where dx = x - floor(x), dy = y - floor(y)
              </div>
              <p className="text-gray-300 mb-3">
                Weighted average of 4 surrounding pixels. Weights based on
                distance.
              </p>
              <div className="bg-gray-700 rounded p-4">
                <strong className="text-blue-300">Visual Example:</strong>
                <div className="text-gray-300 text-sm mt-2 font-mono">
                  P₁(100)────────P₂(200)
                  <br />
                  &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;•(x,y)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│
                  <br />
                  P₃(150)────────P₄(180)
                  <br />
                  <br />
                  At (0.3, 0.6) between these pixels:
                  <br />
                  dx=0.3, dy=0.6
                  <br />
                  Result = 0.7×0.4×100 + 0.3×0.4×200 + 0.7×0.6×150 + 0.3×0.6×180
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 28 + 24 + 63 +
                  32.4 = 147.4 ≈ 147
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-3">
                Bicubic - Smooth Curves
              </h3>
              <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                {"Kernel function (a = -0.5):"}
                <br />
                {"w(x) = (a+2)|x|³ - (a+3)|x|² + 1             if |x| ≤ 1"}
                <br />
                {"w(x) = a|x|³ - 5a|x|² + 8a|x| - 4a    if 1 < |x| < 2"}
                <br />
                {"w(x) = 0                                          if |x| ≥ 2"}
              </div>
              <p className="text-gray-300 mb-3">
                Uses cubic polynomials to create smooth curves between points.
                Samples 4×4 grid.
              </p>
              <div className="bg-gray-700 rounded p-4">
                <strong className="text-blue-300">Why Cubic?</strong>
                <div className="text-gray-300 text-sm mt-2">
                  • Linear (bilinear): Piecewise linear → visible edges
                  <br />
                  • Cubic: Smooth curves → natural transitions
                  <br />
                  • Higher order: Wiggles and artifacts → worse!
                  <br />
                  <br />
                  Cubic is the sweet spot for smoothness vs complexity.
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-3">
                Lanczos - The Sinc Function
              </h3>
              <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                L(x) = sinc(x) · sinc(x/a)&nbsp;&nbsp;&nbsp;&nbsp;where a=3
                (Lanczos3)
                <br />
                <br />
                sinc(x) = sin(πx) / (πx)&nbsp;&nbsp;&nbsp;&nbsp;for x ≠ 0
                <br />
                sinc(0) = 1
              </div>
              <p className="text-gray-300 mb-3">
                Based on signal processing theory. The sinc function is the
                ideal reconstruction filter!
              </p>
              <div className="bg-gray-700 rounded p-4">
                <strong className="text-blue-300">Why Sinc?</strong>
                <div className="text-gray-300 text-sm mt-2">
                  From Shannon-Nyquist sampling theorem:
                  <br />
                  • Images are band-limited signals
                  <br />
                  • Perfect reconstruction requires infinite sinc
                  <br />
                  • Lanczos windowing makes it practical
                  <br />• Mathematically "optimal" for bandwidth-limited images
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-3">
                Frequency Domain Perspective
              </h3>
              <p className="text-gray-300 mb-3">
                Every image can be decomposed into frequency components (like
                Fourier transform):
              </p>
              <div className="bg-gray-700 rounded p-4 space-y-3 text-sm">
                <div>
                  <strong className="text-blue-300">Low frequencies:</strong>
                  <span className="text-gray-300 ml-2">
                    Smooth areas, gradual changes, overall structure
                  </span>
                </div>
                <div>
                  <strong className="text-blue-300">High frequencies:</strong>
                  <span className="text-gray-300 ml-2">
                    Edges, textures, fine details, noise
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <strong className="text-green-300">
                    Algorithm behavior:
                  </strong>
                  <br />
                  <span className="text-gray-300">
                    • Nearest: Preserves all frequencies → aliasing artifacts
                    <br />
                    • Bilinear: Low-pass filter → removes high freq → blur
                    <br />
                    • Bicubic: Better frequency response → less blur
                    <br />• Lanczos: Sharpest freq cutoff → maximum detail
                    retention
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-3">
                Computational Complexity
              </h3>
              <div className="bg-gray-700 rounded p-4">
                <div className="text-sm space-y-3 text-gray-300">
                  <div>
                    <strong className="text-blue-300">Nearest Neighbor:</strong>
                    <br />
                    Time: O(W×H) - one lookup per output pixel
                    <br />
                    Space: O(1) - no extra memory needed
                  </div>
                  <div>
                    <strong className="text-blue-300">Bilinear:</strong>
                    <br />
                    Time: O(4×W×H) - 4 pixel lookups + 3 multiplications
                    <br />
                    Space: O(1)
                  </div>
                  <div>
                    <strong className="text-blue-300">Bicubic:</strong>
                    <br />
                    Time: O(16×W×H) - 16 pixels + weight calculations
                    <br />
                    Space: O(1)
                  </div>
                  <div>
                    <strong className="text-blue-300">Lanczos3:</strong>
                    <br />
                    Time: O(36×W×H) - 36 pixels + sinc calculations
                    <br />
                    Space: O(1) or O(kernel) if pre-computed
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">
                🎯 Key Mathematical Insights
              </h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div>
                  <strong className="text-green-300">
                    1. Trade-off Triangle:
                  </strong>{" "}
                  Quality ↔ Speed ↔ Simplicity - can only pick two!
                </div>
                <div>
                  <strong className="text-green-300">
                    2. Interpolation Order:
                  </strong>{" "}
                  Higher order isn't always better - overfitting can create
                  artifacts
                </div>
                <div>
                  <strong className="text-green-300">3. Separability:</strong>{" "}
                  2D interpolation can be done as two 1D operations (horizontal
                  then vertical) for speed
                </div>
                <div>
                  <strong className="text-green-300">4. Aliasing:</strong> When
                  downscaling, must low-pass filter first to prevent aliasing
                  (Moiré patterns)
                </div>
                <div>
                  <strong className="text-green-300">
                    5. The Shannon Theorem:
                  </strong>{" "}
                  You can't truly recover information that wasn't captured -
                  upscaling is educated guessing!
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-green-400">
            🔧 Implementation Details
          </h2>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded p-4">
              <h4 className="font-bold text-blue-300 mb-2">Memory Layout</h4>
              <div className="bg-black rounded p-3 text-xs font-mono text-green-400">
                // Image stored as flat array: [R,G,B,A, R,G,B,A, R,G,B,A, ...]
                <br />
                <br />
                // To access pixel at (x, y):
                <br />
                index = (y * width + x) * 4<br />
                red&nbsp;&nbsp;&nbsp;= data[index]
                <br />
                green = data[index + 1]
                <br />
                blue&nbsp;&nbsp;= data[index + 2]
                <br />
                alpha = data[index + 3]
              </div>
            </div>

            <div className="bg-gray-900 rounded p-4">
              <h4 className="font-bold text-blue-300 mb-2">
                Boundary Handling
              </h4>
              <p className="text-gray-300 text-sm mb-2">
                What happens at image edges?
              </p>
              <div className="bg-black rounded p-3 text-xs font-mono text-green-400">
                {"// Clamp: Repeat edge pixels"}
                <br />
                {"x_safe = Math.max(0, Math.min(width-1, x))"}
                <br />
                <br />
                {"// Wrap: Tile the image"}
                <br />
                {"x_safe = x % width"}
                <br />
                <br />
                {"// Mirror: Reflect at boundaries"}
                <br />
                {"x_safe = x < 0 ? -x : (x >= width ? 2*width-x-1 : x)"}
              </div>
            </div>

            <div className="bg-gray-900 rounded p-4">
              <h4 className="font-bold text-blue-300 mb-2">
                Optimization Techniques
              </h4>
              <ul className="list-disc list-inside text-gray-300 space-y-2 text-sm">
                <li>
                  <strong>SIMD:</strong> Process 4-8 pixels simultaneously using
                  vector instructions
                </li>
                <li>
                  <strong>Cache locality:</strong> Process rows sequentially for
                  better CPU cache usage
                </li>
                <li>
                  <strong>Separable filters:</strong> 2D convolution as two 1D
                  passes (6N instead of N²)
                </li>
                <li>
                  <strong>Fixed-point math:</strong> Use integers instead of
                  floats (2-3x faster)
                </li>
                <li>
                  <strong>Lookup tables:</strong> Pre-compute weights for common
                  scale factors
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TheoryMaths;

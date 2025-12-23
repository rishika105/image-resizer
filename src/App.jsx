import React, { useState, useRef } from "react";
import { Upload, Download, Info, Zap, Brain } from "lucide-react";
import ModernAITech from "./components/ModernAITech";
import { nearestNeighbor } from "./functions/nearestNeighbor";
import { mitchellResize } from "./functions/mitchell-netravali";
import { bilinearInterpolation } from "./functions/bilinear";
import { bicubicInterpolation } from "./functions/bicubic";
import { lanczosResize } from "./functions/lanczos";
import { boxResize } from "./functions/boxfilter";

const App = () => {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [selectedAlgo, setSelectedAlgo] = useState("nearest");
  const [scale, setScale] = useState(0.5);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("algorithms");
  const [processing, setProcessing] = useState(false);

  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);

  const algorithms = {
    nearest: {
      name: "Nearest Neighbor",
      speed: "⚡⚡⚡ Lightning Fast",
      quality: "⭐ Low Quality",
      complexity: "O(n) - One lookup per pixel",
      description:
        "The simplest possible algorithm. For each output pixel, just pick the closest input pixel.",
      howItWorks:
        "Maps destination coordinates back to source using simple floor division. If you want pixel (3.7, 2.3), it rounds down to (3, 2) and uses that exact pixel.",
      visualExample:
        "Imagine zooming into a photo - you'll see blocky squares because each pixel is just repeated.",
      mathFormula: "dst[x,y] = src[floor(x×ratio), floor(y×ratio)]",
      realWorld:
        'Used in MS Paint\'s "Resize" when you uncheck "Maintain aspect ratio"',
    },
    bilinear: {
      name: "Bilinear Interpolation",
      speed: "⚡⚡ Fast",
      quality: "⭐⭐⭐ Good",
      complexity: "O(4n) - Blends 4 pixels",
      description:
        "The balanced choice. Looks at the 4 nearest pixels and creates a weighted average based on distance. Linear in both X and Y directions.",
      howItWorks:
        "For each output pixel, finds the 4 surrounding input pixels, calculates how far away each one is, then blends them proportionally. Closer pixels get more weight.",

      visualExample:
        "Smooth gradients and edges. No more blocky pixels, but fine details might look slightly blurred.",
      mathFormula: "P = (1-dx)(1-dy)×P₁ + dx(1-dy)×P₂ + (1-dx)dy×P₃ + dx×dy×P₄",
      realWorld:
        "Default algorithm in most photo viewers and basic image editors",
    },
    bicubic: {
      name: "Bicubic Interpolation",
      speed: "⚡ Moderate",
      quality: "⭐⭐⭐⭐ Excellent",
      complexity: "O(16n) - Uses 4×4 grid",
      description:
        "High quality resizing using cubic polynomials. Samples a 4×4 grid of pixels and uses smooth curves instead of straight lines.",
      howItWorks:
        "Uses cubic (x³) equations to create smooth curves between pixels. The cubic function allows for natural-looking transitions and preserves detail better than linear interpolation.",

      visualExample:
        "Very smooth results with good detail preservation. Edges look natural, gradients are silky smooth.",
      mathFormula:
        "Uses cubic convolution kernel: w(x) = (a+2)|x|³ - (a+3)|x|² + 1 for |x|≤1",
      realWorld:
        'Used in Photoshop\'s "Image Size" dialog, GIMP, professional photo software',
    },
    lanczos: {
      name: "Lanczos3",
      speed: "⚡ Slower",
      quality: "⭐⭐⭐⭐⭐ Best",
      complexity: "O(36n) - Uses 6×6 grid",
      description:
        "The gold standard for image resizing. Uses the sinc function (from signal processing theory) with a 3-lobe Lanczos window. Mathematically optimal for band-limited images.",
      howItWorks:
        "Samples a 6×6 grid using the windowed sinc function: sinc(x)×sinc(x/3). This is based on the Shannon-Nyquist sampling theorem - the theoretical perfect reconstruction filter.",

      visualExample:
        "Sharpest possible result. Preserves fine details, crisp edges, minimal blur. Can introduce slight ringing near high-contrast edges.",
      mathFormula: "L(x) = sinc(x) × sinc(x/3) where sinc(x) = sin(πx)/(πx)",
      realWorld:
        "Industry standard in ImageMagick, used by professional photographers and printers worldwide",
    },
    mitchell: {
      name: "Mitchell-Netravali",
      speed: "⚡⚡ Fast",
      quality: "⭐⭐⭐⭐ Very Good",
      complexity: "O(16n) - Uses 4×4 grid",
      description:
        "A carefully tuned cubic filter designed to balance sharpness and smoothness. Uses parameters B=1/3, C=1/3 for optimal visual results.",
      howItWorks:
        'Like Bicubic but with special parameters that reduce blur while avoiding ringing artifacts. It\'s a "Goldilocks" filter - not too sharp, not too soft.',

      visualExample:
        "Cleaner than bicubic with less ringing than Lanczos. Excellent for CGI and synthetic images.",
      mathFormula:
        "Cubic function with B=1/3, C=1/3: balanced sharpness and minimal artifacts",
      realWorld:
        "Used in video games, 3D rendering software, and professional video editing tools",
    },
    box: {
      name: "Box Filter",
      speed: "⚡⚡⚡ Very Fast",
      quality: "⭐⭐ Fair (for downscaling)",
      complexity: "O(variable) - Averages all pixels in box",
      description:
        "Simple averaging filter. For downscaling, averages all pixels that map to each output pixel. Very fast and prevents aliasing artifacts.",
      howItWorks:
        "Defines a box around each output pixel position and averages all input pixels within that box. Perfect for creating clean thumbnails.",

      visualExample:
        "When downscaling, produces clean results without moiré patterns. When upscaling, similar to nearest neighbor.",
      mathFormula: "Average of all pixels within the target box region",
      realWorld:
        "Used for thumbnail generation in websites, image CDNs, and content management systems",
    },
  };

  const addLog = (msg) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        setImageData(imgData);

        setLogs([]);
        addLog(`Image loaded: ${img.width}×${img.height} pixels`);
        addLog(`Total pixels: ${(img.width * img.height).toLocaleString()}`);
        addLog(`Raw data size: ${imgData.data.length.toLocaleString()} bytes`);
        addLog(`Format: RGBA (4 bytes per pixel)`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const processImage = () => {
    if (!imageData) return;

    setLogs([]);
    setProcessing(true);

    addLog(`🚀 Starting ${algorithms[selectedAlgo].name} resize...`);

    const startTime = performance.now();

    const srcW = imageData.width;
    const srcH = imageData.height;
    const dstW = Math.floor(srcW * scale);
    const dstH = Math.floor(srcH * scale);

    let result;

    switch (selectedAlgo) {
      case "nearest":
        result = nearestNeighbor(imageData, srcW, srcH, dstW, dstH, { addLog });
        break;
      case "bilinear":
        result = bilinearInterpolation(imageData, srcW, srcH, dstW, dstH, {
          addLog,
        });
        break;
      case "bicubic":
        result = bicubicInterpolation(imageData, srcW, srcH, dstW, dstH, {
          addLog,
        });
        break;
      case "lanczos":
        result = lanczosResize(imageData, srcW, srcH, dstW, dstH, { addLog });
        break;
      case "mitchell":
        result = mitchellResize(imageData, srcW, srcH, dstW, dstH, { addLog });
        break;
      case "box":
        result = boxResize(imageData, srcW, srcH, dstW, dstH, { addLog });
        break;
      default:
        result = nearestNeighbor(imageData, srcW, srcH, dstW, dstH, { addLog });
    }

    const endTime = performance.now();

    addLog(
      `\n⏱️  Total processing time: ${(endTime - startTime).toFixed(2)}ms`
    );
    addLog(
      `📊 Output size: ${dstW}×${dstH} (${(
        dstW * dstH
      ).toLocaleString()} pixels)`
    );

    const canvas = processedCanvasRef.current;
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext("2d");
    const newImageData = new ImageData(result, dstW, dstH);
    ctx.putImageData(newImageData, 0, 0);

    setProcessedData(newImageData);
    setProcessing(false);
  };

  const downloadImage = () => {
    if (!processedCanvasRef.current) return;

    processedCanvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resized_${selectedAlgo}_${scale}x.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const algoInfo = algorithms[selectedAlgo];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Image Resizing</h1>
        <p className="text-gray-400 mb-8">
          Understanding how every algorithm works from basics to neural networks
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("algorithms")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "algorithms"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Zap className="inline mr-2" size={18} />
            Traditional Algorithms
          </button>
          <button
            onClick={() => setActiveTab("modern")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "modern"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Brain className="inline mr-2" size={18} />
            Modern AI Techniques
          </button>
        </div>

        {/* Algorithm Comparison Tab */}
        {activeTab === "algorithms" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left: Controls */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Controls</h2>

                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">
                    Upload Image
                  </label>
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <div className="text-center">
                      <Upload className="mx-auto mb-2" size={32} />
                      <span className="text-sm text-gray-400">
                        Click to upload
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">
                    Select Algorithm
                  </label>
                  <select
                    value={selectedAlgo}
                    onChange={(e) => setSelectedAlgo(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  >
                    {Object.entries(algorithms).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">
                    Scale: {scale}x
                  </label>
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
                    <span>0.1x</span>
                    <span>2x</span>
                  </div>
                </div>

                <button
                  onClick={processImage}
                  disabled={!imageData || processing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition mb-2"
                >
                  {processing ? "Processing..." : "Process Image"}
                </button>

                <button
                  onClick={downloadImage}
                  disabled={!processedData}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Result
                  {/* jfjjfj */}
                </button>
              </div>

              {/* Right: Processing Log */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Processing Log</h2>
                <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-gray-500">
                      Upload an image and click "Process Image" to see logs...
                    </div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="text-green-400 mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Image Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Original Image</h2>
                <div className="bg-gray-700 rounded p-4 flex items-center justify-center min-h-64">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto border border-gray-600"
                  />
                </div>
                {image && (
                  <div className="mt-2 text-sm text-gray-400">
                    {image.width} × {image.height} pixels
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">
                  Processed Image (Download to visualize properly)
                </h2>
                <div className="bg-gray-700 rounded p-4 flex items-center justify-center min-h-64">
                  <canvas
                    ref={processedCanvasRef}
                    className="max-w-full h-auto border border-gray-600"
                  />
                </div>
                {processedData && (
                  <div className="mt-2 text-sm text-gray-400">
                    {processedData.width} × {processedData.height} pixels
                  </div>
                )}
              </div>
            </div>

            {/* Algorithm Explanation */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Info className="text-blue-400 mt-1" size={24} />
                <div>
                  <h2 className="text-2xl font-bold text-blue-400 mb-1">
                    {algoInfo.name}
                  </h2>
                  <div className="flex gap-4 text-sm text-gray-400 mb-3">
                    <span>{algoInfo.speed}</span>
                    <span>•</span>
                    <span>{algoInfo.quality}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    📖 What It Is
                  </h3>
                  <p className="text-gray-300">{algoInfo.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    ⚙️ How It Works
                  </h3>
                  <p className="text-gray-300">{algoInfo.howItWorks}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    👁️ Visual Result
                  </h3>
                  <p className="text-gray-300">{algoInfo.visualExample}</p>
                </div>

                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-300 mb-2">
                    📐 Technical Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Complexity:</span>
                      <span className="text-white ml-2">
                        {algoInfo.complexity}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Formula:</span>
                      <code className="text-green-400 ml-2 text-xs">
                        {algoInfo.mathFormula}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-400">Real-world use:</span>
                      <span className="text-white ml-2">
                        {algoInfo.realWorld}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modern AI Techniques Tab */}
        {activeTab === "modern" && <ModernAITech />}
      </div>
    </div>
  );
};

export default App;

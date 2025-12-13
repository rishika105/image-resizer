import React, { useState, useRef } from "react";
import { Upload, Download, Info, Zap, Brain } from "lucide-react";
import { nearestNeighbor } from "./functions/nearestNeighbor";
import { bilinearInterpolation } from "./functions/bilinear";
import { bicubicInterpolation } from "./functions/bicubic";
import { lanczosResize } from "./functions/lanczos";
import ModernAITech from "./components/ModernAITech";
import TheoryMaths from "./components/TheoryMaths";

const App = () => {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState("algorithms");
  const [scale, setScale] = useState(0.5);
  const [processing, setProcessing] = useState(false);
  const [selectedAlgo, setSelectedAlgo] = useState(null);

  const canvasRef = useRef(null);
  const resultCanvasRefs = useRef({});

  const algorithms = {
    nearest: {
      name: "Nearest Neighbor",
      complexity: "O(n)",
      speed: "⚡⚡⚡",
      quality: "⭐",
      description: "Simplest algorithm - picks the closest pixel",
      useCase: "Pixel art, fast previews",
      technical:
        "Maps each output pixel to nearest input pixel using floor(x × ratio)",
      kernel: "None (single pixel)",
      samples: "1 pixel",
    },
    bilinear: {
      name: "Bilinear Interpolation",
      complexity: "O(4n)",
      speed: "⚡⚡",
      quality: "⭐⭐⭐",
      description: "Averages 4 surrounding pixels using linear weights",
      useCase: "General purpose, decent quality",
      technical: "P = (1-dx)(1-dy)×P1 + dx(1-dy)×P2 + (1-dx)dy×P3 + dx×dy×P4",
      kernel: "2×2 grid",
      samples: "4 pixels",
    },
    bicubic: {
      name: "Bicubic Interpolation",
      complexity: "O(16n)",
      speed: "⚡",
      quality: "⭐⭐⭐⭐",
      description: "Uses 16 pixels with cubic polynomial curves",
      useCase: "High quality photos, smooth gradients",
      technical: "Cubic convolution kernel with 4×4 neighborhood",
      kernel: "4×4 grid",
      samples: "16 pixels",
    },
    lanczos: {
      name: "Lanczos3",
      complexity: "O(36n)",
      speed: "⚡",
      quality: "⭐⭐⭐⭐⭐",
      description: "Industry standard using sinc function",
      useCase: "Professional photography, printing",
      technical: "Windowed sinc: (a × sin(πx) × sin(πx/a)) / (πx)²",
      kernel: "6×6 grid",
      samples: "36 pixels",
    },
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
        setResults({});
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const processAllAlgorithms = async () => {
    if (!imageData) return;

    setProcessing(true);
    const newResults = {};

    const srcW = imageData.width;
    const srcH = imageData.height;
    const dstW = Math.floor(srcW * scale);
    const dstH = Math.floor(srcH * scale);

    const algos = [
      { key: "nearest", fn: nearestNeighbor },
      { key: "bilinear", fn: bilinearInterpolation },
      { key: "bicubic", fn: bicubicInterpolation },
      { key: "lanczos", fn: lanczosResize },
    ];

    for (const algo of algos) {
      const startTime = performance.now();
      const result = algo.fn(imageData, srcW, srcH, dstW, dstH);
      const endTime = performance.now();

      const canvas = document.createElement("canvas");
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext("2d");
      const newImageData = new ImageData(result, dstW, dstH);
      ctx.putImageData(newImageData, 0, 0);

      newResults[algo.key] = {
        canvas: canvas,
        time: (endTime - startTime).toFixed(2),
        width: dstW,
        height: dstH,
      };
    }

    setResults(newResults);
    setProcessing(false);
  };

  const downloadResult = (algoKey) => {
    if (!results[algoKey]) return;

    results[algoKey].canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${algoKey}_${scale}x.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          Image Resizing 
        </h1>
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
            Algorithm Comparison
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
          <button
            onClick={() => setActiveTab("theory")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "theory"
                ? "text-green-400 border-b-2 border-green-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Info className="inline mr-2" size={18} />
            Theory & Mathematics
          </button>
        </div>

        {/* Algorithm Comparison Tab */}
        {activeTab === "algorithms" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Upload */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Upload Image</h2>

                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition mb-4">
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

                {image && (
                  <div className="text-sm text-gray-400">
                    Original: {image.width} × {image.height} pixels
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Settings</h2>

                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium">
                    Scale Factor: {scale}x
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

                {image && (
                  <div className="text-sm text-gray-400 mb-4">
                    Target: {Math.floor(image.width * scale)} ×{" "}
                    {Math.floor(image.height * scale)} pixels
                  </div>
                )}

                <button
                  onClick={processAllAlgorithms}
                  disabled={!imageData || processing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition"
                >
                  {processing ? "Processing..." : "Compare All Algorithms"}
                </button>
              </div>

              {/* Original Preview */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Original Image</h2>
                <div className="bg-gray-700 rounded p-4 flex items-center justify-center h-48">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full border border-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {Object.keys(results).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {Object.entries(algorithms).map(([key, info]) => (
                  <div key={key} className="bg-gray-800 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-blue-400">
                          {info.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {info.description}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedAlgo(selectedAlgo === key ? null : key)
                        }
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition"
                      >
                        {selectedAlgo === key ? "Hide" : "Details"}
                      </button>
                    </div>

                    {selectedAlgo === key && (
                      <div className="bg-gray-900 rounded p-4 mb-4 text-sm space-y-2">
                        <div>
                          <strong className="text-blue-300">Complexity:</strong>{" "}
                          {info.complexity}
                        </div>
                        <div>
                          <strong className="text-blue-300">Speed:</strong>{" "}
                          {info.speed}
                        </div>
                        <div>
                          <strong className="text-blue-300">Quality:</strong>{" "}
                          {info.quality}
                        </div>
                        <div>
                          <strong className="text-blue-300">Kernel:</strong>{" "}
                          {info.kernel}
                        </div>
                        <div>
                          <strong className="text-blue-300">Samples:</strong>{" "}
                          {info.samples}
                        </div>
                        <div>
                          <strong className="text-blue-300">Best for:</strong>{" "}
                          {info.useCase}
                        </div>
                        <div className="pt-2 border-t border-gray-700">
                          <strong className="text-blue-300">Technical:</strong>
                          <div className="text-gray-400 mt-1 font-mono text-xs">
                            {info.technical}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-700 rounded p-4 flex items-center justify-center mb-4 h-64">
                      {results[key] && (
                        <canvas
                          ref={(el) => (resultCanvasRefs.current[key] = el)}
                          width={results[key].width}
                          height={results[key].height}
                          className="max-w-full max-h-full border border-gray-600"
                          style={{
                            imageRendering:
                              key === "nearest" ? "pixelated" : "auto",
                          }}
                        />
                      )}
                    </div>

                    {results[key] && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-gray-400">
                            Processing time:{" "}
                          </span>
                          <span className="text-green-400 font-bold">
                            {results[key].time}ms
                          </span>
                        </div>
                        <button
                          onClick={() => downloadResult(key)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2 transition"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Algorithm Cards */}
            {Object.keys(results).length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(algorithms).map(([key, info]) => (
                  <div key={key} className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-blue-400 mb-2">
                      {info.name}
                    </h3>
                    <p className="text-gray-300 mb-4">{info.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-gray-400">Complexity</div>
                        <div className="font-bold">{info.complexity}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Speed</div>
                        <div className="font-bold">{info.speed}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Quality</div>
                        <div className="font-bold">{info.quality}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Kernel Size</div>
                        <div className="font-bold">{info.kernel}</div>
                      </div>
                    </div>

                    <div className="bg-gray-900 rounded p-3 text-xs">
                      <div className="text-gray-400 mb-1">
                        Technical Formula:
                      </div>
                      <code className="text-green-400">{info.technical}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modern AI Techniques Tab */}
        {activeTab === "modern" && <ModernAITech />}

        {/* Theory Tab */}
        {activeTab === "theory" && <TheoryMaths />}
      </div>

      {/* Render results to canvases */}
      {Object.entries(results).map(([key, data]) => {
        if (resultCanvasRefs.current[key] && data.canvas) {
          const ctx = resultCanvasRefs.current[key].getContext("2d");
          ctx.drawImage(data.canvas, 0, 0);
        }
        return null;
      })}
    </div>
  );
};

export default App;

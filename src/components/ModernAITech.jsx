import React from 'react'

const ModernAITech = () => {
  return (
    <>
                <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">🧠 Modern Neural Network Approaches</h2>
              <p className="text-gray-300 mb-6">
                While traditional algorithms use mathematical formulas, modern AI learns from data to predict optimal pixel values.
                Here's how we evolved from simple interpolation to AI-powered super-resolution:
              </p>

              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">1. SRCNN (2014) - The Beginning</h3>
                  <p className="text-gray-300 mb-3">
                    Super-Resolution Convolutional Neural Network - first deep learning approach to image upscaling.
                  </p>
                  <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                    Input → Conv(64 filters, 9×9) → Conv(32 filters, 1×1) → Conv(1 filter, 5×5) → Output
                  </div>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                    <li>3 convolutional layers only</li>
                    <li>Learns mapping from low-res to high-res patches</li>
                    <li>Trained on millions of image pairs</li>
                    <li>10x better than bicubic for 2x upscaling</li>
                  </ul>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">2. ESPCN (2016) - Efficient Sub-Pixel</h3>
                  <p className="text-gray-300 mb-3">
                    Works in low-resolution space then upscales at the end using "pixel shuffle" - way faster!
                  </p>
                  <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                    LR Input → Conv Layers → Sub-Pixel Convolution (r² filters) → HR Output
                  </div>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                    <li>Processes in low-res space (faster computation)</li>
                    <li>Final layer rearranges pixels to high-res</li>
                    <li>Real-time video upscaling capable</li>
                    <li>Used in video streaming services</li>
                  </ul>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">3. SRGAN (2017) - Generative Adversarial</h3>
                  <p className="text-gray-300 mb-3">
                    Uses TWO networks: Generator creates high-res images, Discriminator judges if they're realistic.
                  </p>
                  <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                    Generator: Creates fake HR images<br/>
                    Discriminator: Real or Fake?<br/>
                    → They compete until Generator becomes expert!
                  </div>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                    <li>Generates photo-realistic textures</li>
                    <li>Can "hallucinate" details that weren't in original</li>
                    <li>Perceptual loss instead of pixel-perfect matching</li>
                    <li>4x upscaling with incredible detail recovery</li>
                  </ul>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">4. RCAN (2018) - Residual Channel Attention</h3>
                  <p className="text-gray-300 mb-3">
                    Very deep network (400 layers!) that learns which color channels matter most for each region.
                  </p>
                  <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                    Input → Residual Groups (with Channel Attention) × 10 → Upsampling → Output
                  </div>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                    <li>Attention mechanism: focuses on important features</li>
                    <li>Skip connections preserve original information</li>
                    <li>Won NTIRE 2018 Super-Resolution Challenge</li>
                    <li>State-of-art quality but computationally expensive</li>
                  </ul>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">5. Real-ESRGAN (2021) - Modern Standard</h3>
                  <p className="text-gray-300 mb-3">
                    Practical AI upscaling for real-world photos - handles noise, compression artifacts, and blur.
                  </p>
                  <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                    Trained on synthetic degradations:<br/>
                    - JPEG compression artifacts<br/>
                    - Camera blur<br/>
                    - Noise and grain<br/>
                    → Learns to reverse these!
                  </div>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                    <li>Works on anime, photos, and drawings</li>
                    <li>Open source and widely used</li>
                    <li>Can restore old, damaged photos</li>
                    <li>Used in Photoshop's "Super Resolution"</li>
                  </ul>
                </div>

                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">6. Diffusion Models (2023+) - Latest Frontier</h3>
                  <p className="text-gray-300 mb-3">
                    Same tech as Stable Diffusion/DALL-E - gradually "denoises" an image to add detail.
                  </p>
                  <div className="bg-black rounded p-4 text-sm font-mono text-green-400 mb-3">
                    Start: Noisy low-res → Denoise step 1 → Denoise step 2 → ... → Clean high-res
                  </div>
                  <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                    <li>Can generate multiple variations of upscaled image</li>
                    <li>Understands semantic content (faces, buildings, etc.)</li>
                    <li>Controllable with text prompts</li>
                    <li>Currently cutting-edge but very slow</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 mt-6">
                <h3 className="text-xl font-bold mb-3">🎯 Key Insight: From Math to Learning</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-bold text-blue-300 mb-2">Traditional (What we built):</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Fixed mathematical formulas</li>
                      <li>Same result every time</li>
                      <li>Fast and predictable</li>
                      <li>Works on any image immediately</li>
                      <li>10-100ms processing time</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-300 mb-2">Neural Networks:</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Learned from millions of examples</li>
                      <li>Can "hallucinate" realistic details</li>
                      <li>Requires GPU for speed</li>
                      <li>Needs training on specific image types</li>
                      <li>1-10 seconds processing time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">🔬 How Neural Networks Learn Upscaling</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-bold text-blue-300 mb-2">Step 1: Training Data</h4>
                  <p className="text-gray-300 text-sm">
                    Take high-res images → Downscale them → Now you have pairs: (low-res input, high-res target)
                  </p>
                  <div className="bg-black rounded p-3 mt-2 text-xs font-mono text-green-400">
                    Training Dataset: 800,000 image pairs<br/>
                    High-res: 1024×1024 | Low-res: 256×256
                  </div>
                </div>

                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-bold text-blue-300 mb-2">Step 2: Network Architecture</h4>
                  <p className="text-gray-300 text-sm mb-2">
                    The network is like a series of filters that learn to extract and combine features:
                  </p>
                  <div className="bg-black rounded p-3 text-xs font-mono text-green-400">
                    Layer 1: Detects edges and gradients<br/>
                    Layer 2-5: Detects textures (skin, fabric, grass)<br/>
                    Layer 6-10: Detects objects (eyes, buildings, trees)<br/>
                    Layer 11-15: Reconstructs high-res details<br/>
                    Output: Upscaled image
                  </div>
                </div>

                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-bold text-blue-300 mb-2">Step 3: Loss Functions</h4>
                  <p className="text-gray-300 text-sm mb-2">
                    How the network knows if it's doing well:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                    <li><strong>MSE Loss:</strong> Pixel-perfect matching → blurry but accurate</li>
                    <li><strong>Perceptual Loss:</strong> Compare high-level features → sharper results</li>
                    <li><strong>Adversarial Loss:</strong> Fool discriminator → photo-realistic</li>
                    <li><strong>Combined:</strong> Best of all three!</li>
                  </ul>
                </div>

                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-bold text-blue-300 mb-2">Step 4: Training Process</h4>
                  <div className="bg-black rounded p-3 text-xs font-mono text-green-400">
                    for 100,000 iterations:<br/>
                    &nbsp;&nbsp;1. Feed low-res image to network<br/>
                    &nbsp;&nbsp;2. Compare output with real high-res<br/>
                    &nbsp;&nbsp;3. Calculate error (loss)<br/>
                    &nbsp;&nbsp;4. Adjust network weights to reduce error<br/>
                    &nbsp;&nbsp;5. Repeat until loss converges<br/><br/>
                    Training time: 2-7 days on 8 GPUs!
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">⚡ Real-World Applications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-bold text-blue-300 mb-2">Video Streaming (Netflix, YouTube)</h4>
                  <p className="text-gray-300 text-sm">
                    Stream lower quality → Upscale on your device using AI → Save 40% bandwidth while maintaining quality
                  </p>
                </div>
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-bold text-blue-300 mb-2">Gaming (DLSS, FSR)</h4>
                  <p className="text-gray-300 text-sm">
                    Render at 720p → AI upscales to 4K → 2x performance boost with barely visible quality loss
                  </p>
                </div>
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-bold text-blue-300 mb-2">Photo Restoration</h4>
                  <p className="text-gray-300 text-sm">
                    Old family photos → Remove scratches, enhance resolution → Preserve memories in HD quality
                  </p>
                </div>
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-bold text-blue-300 mb-2">Medical Imaging</h4>
                  <p className="text-gray-300 text-sm">
                    MRI/CT scans → Enhance resolution → Better diagnosis without longer scan times
                  </p>
                </div>
              </div>
            </div>
          </div>
    </>
  )
}

export default ModernAITech

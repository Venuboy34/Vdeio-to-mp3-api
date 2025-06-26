// Cloudflare Worker for Video to MP3 Conversion API
// This worker handles video file uploads and converts them to MP3 format

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS()
  }

  // Route handling
  if (path === '/api/convert' && request.method === 'POST') {
    return handleVideoConversion(request)
  }
  
  if (path === '/api/status' && request.method === 'GET') {
    return handleStatusCheck(request)
  }

  if (path === '/' && request.method === 'GET') {
    return new Response(getHTMLInterface(), {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  return new Response('Not Found', { status: 404 })
}

async function handleVideoConversion(request) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video')
    
    if (!videoFile) {
      return createResponse({ error: 'No video file provided' }, 400)
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm']
    if (!allowedTypes.includes(videoFile.type)) {
      return createResponse({ error: 'Invalid file type. Supported formats: MP4, AVI, MOV, WMV, FLV, WEBM' }, 400)
    }

    // Check file size (limit to 50MB for Cloudflare Workers)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (videoFile.size > maxSize) {
      return createResponse({ error: 'File size exceeds 50MB limit' }, 400)
    }

    // Convert video to MP3
    const mp3Buffer = await convertVideoToMP3(videoFile)
    
    // Generate download URL or return file directly
    const response = new Response(mp3Buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${videoFile.name.replace(/\.[^/.]+$/, '')}.mp3"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

    return response
  } catch (error) {
    console.error('Conversion error:', error)
    return createResponse({ error: 'Conversion failed: ' + error.message }, 500)
  }
}

async function convertVideoToMP3(videoFile) {
  // Note: This is a simplified example. In a real implementation, you would need:
  // 1. A WebAssembly build of FFmpeg for client-side conversion, or
  // 2. Integration with a third-party conversion service
  // 3. Or use a more powerful serverless platform that supports FFmpeg
  
  // For demonstration, we'll simulate the conversion process
  // In reality, you'd use something like ffmpeg.wasm or call an external service
  
  try {
    // Simulate conversion delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // This is a placeholder - you would implement actual video-to-audio conversion here
    // Options include:
    // 1. Using ffmpeg.wasm (WebAssembly version of FFmpeg)
    // 2. Calling an external conversion API
    // 3. Using a media processing service
    
    throw new Error('Video conversion requires FFmpeg or external service integration')
    
  } catch (error) {
    throw new Error('Conversion failed: ' + error.message)
  }
}

// Alternative implementation using external API (example with a hypothetical service)
async function convertVideoToMP3External(videoFile) {
  const formData = new FormData()
  formData.append('video', videoFile)
  formData.append('output_format', 'mp3')
  
  const response = await fetch('https://api.example-converter.com/convert', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  })
  
  if (!response.ok) {
    throw new Error('External conversion service failed')
  }
  
  return await response.arrayBuffer()
}

async function handleStatusCheck(request) {
  return createResponse({
    status: 'online',
    timestamp: new Date().toISOString(),
    supported_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    max_file_size: '50MB'
  })
}

function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

function getHTMLInterface() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video to MP3 Converter API</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .upload-area {
            border: 2px dashed #ddd;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            transition: border-color 0.3s;
        }
        .upload-area:hover {
            border-color: #667eea;
        }
        .upload-area.dragover {
            border-color: #667eea;
            background-color: #f0f8ff;
        }
        input[type="file"] {
            display: none;
        }
        .upload-btn {
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        .upload-btn:hover {
            background: #5a6fd8;
        }
        .convert-btn {
            background: #764ba2;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 20px;
            transition: background 0.3s;
        }
        .convert-btn:hover {
            background: #6a4190;
        }
        .convert-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .status {
            margin: 20px 0;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
        }
        .status.loading {
            background: #d1ecf1;
            color: #0c5460;
        }
        .api-docs {
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .endpoint {
            background: #e7f3ff;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-family: monospace;
        }
        .progress {
            width: 100%;
            height: 20px;
            background: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-bar {
            height: 100%;
            background: #667eea;
            width: 0%;
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 Video to MP3 Converter API</h1>
        
        <div class="upload-area" id="uploadArea">
            <p>Drag and drop your video file here or click to select</p>
            <button class="upload-btn" onclick="document.getElementById('fileInput').click()">
                Choose Video File
            </button>
            <input type="file" id="fileInput" accept="video/*" onchange="handleFileSelect(event)">
        </div>
        
        <div id="fileInfo" style="display: none;">
            <p><strong>Selected file:</strong> <span id="fileName"></span></p>
            <p><strong>Size:</strong> <span id="fileSize"></span></p>
            <button class="convert-btn" onclick="convertVideo()">Convert to MP3</button>
        </div>
        
        <div class="progress" id="progressContainer" style="display: none;">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        
        <div id="status"></div>
        
        <div class="api-docs">
            <h3>API Documentation</h3>
            <p><strong>Base URL:</strong> <span id="baseUrl"></span></p>
            
            <h4>Endpoints:</h4>
            <div class="endpoint">
                <strong>POST /api/convert</strong><br>
                Convert video file to MP3<br>
                Content-Type: multipart/form-data<br>
                Body: video file (max 50MB)
            </div>
            
            <div class="endpoint">
                <strong>GET /api/status</strong><br>
                Check API status and supported formats
            </div>
            
            <h4>Supported Formats:</h4>
            <p>MP4, AVI, MOV, WMV, FLV, WEBM</p>
            
            <h4>Usage Example:</h4>
            <div class="endpoint">
curl -X POST \\<br>
&nbsp;&nbsp;-F "video=@your_video.mp4" \\<br>
&nbsp;&nbsp;<span id="curlUrl"></span>/api/convert \\<br>
&nbsp;&nbsp;-o output.mp3
            </div>
        </div>
    </div>

    <script>
        let selectedFile = null;
        
        // Set base URL
        document.getElementById('baseUrl').textContent = window.location.origin;
        document.getElementById('curlUrl').textContent = window.location.origin;
        
        // Drag and drop functionality
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
        
        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                handleFile(file);
            }
        }
        
        function handleFile(file) {
            selectedFile = file;
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            document.getElementById('fileInfo').style.display = 'block';
        }
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        async function convertVideo() {
            if (!selectedFile) return;
            
            const formData = new FormData();
            formData.append('video', selectedFile);
            
            const statusDiv = document.getElementById('status');
            const progressContainer = document.getElementById('progressContainer');
            const progressBar = document.getElementById('progressBar');
            
            statusDiv.innerHTML = '<div class="status loading">Converting video to MP3...</div>';
            progressContainer.style.display = 'block';
            
            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress > 90) progress = 90;
                progressBar.style.width = progress + '%';
            }, 500);
            
            try {
                const response = await fetch('/api/convert', {
                    method: 'POST',
                    body: formData
                });
                
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = selectedFile.name.replace(/\.[^/.]+$/, '') + '.mp3';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    statusDiv.innerHTML = '<div class="status success">✅ Video converted successfully! Download started.</div>';
                } else {
                    const error = await response.json();
                    statusDiv.innerHTML = '<div class="status error">❌ Error: ' + error.error + '</div>';
                }
            } catch (error) {
                clearInterval(progressInterval);
                statusDiv.innerHTML = '<div class="status error">❌ Error: ' + error.message + '</div>';
            } finally {
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressBar.style.width = '0%';
                }, 2000);
            }
        }
    </script>
</body>
</html>
  `;
}

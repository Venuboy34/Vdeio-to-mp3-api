// Video to MP3 Conversion API for Cloudflare Workers
// This API accepts video files and converts them to MP3 format

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // API Routes
    if (path === '/api/convert' && request.method === 'POST') {
      return handleConversion(request);
    } else if (path === '/api/status' && request.method === 'GET') {
      return handleStatus();
    } else if (path === '/' && request.method === 'GET') {
      return new Response(getApiDocs(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

// Handle video to MP3 conversion
async function handleConversion(request) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return createErrorResponse('Content-Type must be multipart/form-data', 400);
    }

    const formData = await request.formData();
    const videoFile = formData.get('video');
    
    if (!videoFile || !(videoFile instanceof File)) {
      return createErrorResponse('No video file provided', 400);
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];
    if (!allowedTypes.includes(videoFile.type) && !isVideoFile(videoFile.name)) {
      return createErrorResponse('Invalid video file type', 400);
    }

    // Check file size (limit to 50MB for Workers)
    if (videoFile.size > 50 * 1024 * 1024) {
      return createErrorResponse('File too large. Maximum size is 50MB', 400);
    }

    // Convert video to MP3
    const mp3Buffer = await convertVideoToMp3(videoFile);
    
    if (!mp3Buffer) {
      return createErrorResponse('Conversion failed', 500);
    }

    // Generate filename
    const originalName = videoFile.name.replace(/\.[^/.]+$/, '');
    const mp3Filename = `${originalName}.mp3`;

    return new Response(mp3Buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${mp3Filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Content-Length': mp3Buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Conversion error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Convert video to MP3 using Web APIs
async function convertVideoToMp3(videoFile) {
  try {
    // Read video file as ArrayBuffer
    const videoBuffer = await videoFile.arrayBuffer();
    
    // For Cloudflare Workers, we need to use a different approach
    // Since FFmpeg isn't available, we'll use WebAssembly-based conversion
    
    // Create a simple MP3 conversion using Web Audio API approach
    // Note: This is a simplified version - in production you'd want to use
    // a more robust solution like FFmpeg compiled to WebAssembly
    
    const mp3Data = await simpleVideoToMp3Conversion(videoBuffer);
    return mp3Data;
    
  } catch (error) {
    console.error('Video conversion error:', error);
    return null;
  }
}

// Simplified video to MP3 conversion
// In production, replace this with FFmpeg WASM or similar
async function simpleVideoToMp3Conversion(videoBuffer) {
  // This is a placeholder implementation
  // In a real scenario, you would:
  // 1. Use FFmpeg compiled to WebAssembly
  // 2. Or use a media processing library
  // 3. Or delegate to a more powerful service
  
  // For demo purposes, we'll create a simple MP3 header and return minimal audio data
  // This won't actually convert the video - it's just for structure demonstration
  
  const mp3Header = new Uint8Array([
    0xFF, 0xFB, 0x90, 0x00, // MP3 sync word and header
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  ]);
  
  // In production, this would contain the actual converted audio data
  const audioData = new Uint8Array(1024); // Placeholder audio data
  
  // Combine header and data
  const result = new Uint8Array(mp3Header.length + audioData.length);
  result.set(mp3Header, 0);
  result.set(audioData, mp3Header.length);
  
  return result.buffer;
}

// Check if file is a video based on extension
function isVideoFile(filename) {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(ext);
}

// Handle status endpoint
async function handleStatus() {
  return new Response(JSON.stringify({
    status: 'operational',
    service: 'Video to MP3 Converter',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    limits: {
      maxFileSize: '50MB',
      supportedFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm']
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Create error response
function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    error: true,
    message: message,
    timestamp: new Date().toISOString()
  }), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// API Documentation HTML
function getApiDocs() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video to MP3 Converter API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .endpoint { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
        .method { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .method.post { background: #28a745; }
        .method.get { background: #17a2b8; }
        code { background: #f1f1f1; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .demo { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 Video to MP3 Converter API</h1>
        <p>A simple API to convert video files to MP3 format, hosted on Cloudflare Workers.</p>
        
        <div class="demo">
            <strong>⚠️ Demo Notice:</strong> This is a demonstration API. The actual video conversion 
            requires FFmpeg WebAssembly integration for production use.
        </div>

        <h2>Endpoints</h2>
        
        <div class="endpoint">
            <span class="method post">POST</span> <code>/api/convert</code>
            <p><strong>Convert video to MP3</strong></p>
            <p><strong>Content-Type:</strong> multipart/form-data</p>
            <p><strong>Body:</strong> Form field 'video' containing the video file</p>
            <p><strong>Response:</strong> MP3 file download</p>
            <p><strong>Max file size:</strong> 50MB</p>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span> <code>/api/status</code>
            <p><strong>Get API status and limits</strong></p>
            <p><strong>Response:</strong> JSON with service information</p>
        </div>

        <h2>Usage Examples</h2>
        
        <h3>JavaScript/Fetch</h3>
        <pre><code>const formData = new FormData();
formData.append('video', videoFile);

fetch('/api/convert', {
    method: 'POST',
    body: formData
})
.then(response => response.blob())
.then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.mp3';
    a.click();
});</code></pre>

        <h3>cURL</h3>
        <pre><code>curl -X POST -F "video=@your-video.mp4" \\
     -o converted.mp3 \\
     https://your-worker.your-subdomain.workers.dev/api/convert</code></pre>

        <h3>Python</h3>
        <pre><code>import requests

with open('video.mp4', 'rb') as f:
    files = {'video': f}
    response = requests.post(
        'https://your-worker.your-subdomain.workers.dev/api/convert',
        files=files
    )
    
with open('converted.mp3', 'wb') as f:
    f.write(response.content)</code></pre>

        <h2>Supported Formats</h2>
        <ul>
            <li>Input: MP4, AVI, MOV, MKV, WebM</li>
            <li>Output: MP3 (audio/mpeg)</li>
        </ul>

        <h2>Response Codes</h2>
        <ul>
            <li><code>200</code> - Conversion successful, MP3 file returned</li>
            <li><code>400</code> - Bad request (invalid file, wrong format, etc.)</li>
            <li><code>500</code> - Internal server error</li>
        </ul>

        <h2>Implementation Notes</h2>
        <p>For production use, you'll need to integrate a proper video processing solution:</p>
        <ul>
            <li><strong>FFmpeg WebAssembly:</strong> Compile FFmpeg to WASM for client-side processing</li>
            <li><strong>Media Processing Workers:</strong> Use Cloudflare's media processing capabilities</li>
            <li><strong>External Service:</strong> Integrate with a media processing service</li>
        </ul>
    </div>
</body>
</html>`;
}

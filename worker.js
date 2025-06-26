// worker.js
import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Enable ES module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup
const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });

// Create output folder if missing
if (!fs.existsSync('output')) fs.mkdirSync('output');

// Serve HTML form
app.get('/', (req, res) => {
  res.send(`
    <h2>🎬 Video to MP3 Converter</h2>
    <form action="/convert" method="post" enctype="multipart/form-data">
      <input type="file" name="video" accept="video/*" required />
      <button type="submit">Convert to MP3</button>
    </form>
  `);
});

// Conversion endpoint
app.post('/convert', upload.single('video'), (req, res) => {
  const inputPath = req.file.path;
  const outputName = uuidv4() + '.mp3';
  const outputPath = path.join('output', outputName);

  ffmpeg(inputPath)
    .toFormat('mp3')
    .on('end', () => {
      fs.unlinkSync(inputPath); // clean uploaded video
      res.download(outputPath, () => {
        fs.unlinkSync(outputPath); // clean MP3 after sending
      });
    })
    .on('error', (err) => {
      console.error('Conversion error:', err);
      res.status(500).send('Conversion failed');
    })
    .save(outputPath);
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});

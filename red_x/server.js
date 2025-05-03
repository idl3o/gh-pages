const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.wasm': 'application/wasm',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',     // For SVG visualizations
  '.abi': 'application/json',  // For contract ABIs
  '.bin': 'application/octet-stream', // For binary contract data
  '.hex': 'text/plain',        // For hex-encoded data
};

const server = http.createServer((req, res) => {
  console.log(`Request for ${req.url}`);
  
  // Normalize the URL
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Get the file extension
  const ext = path.extname(filePath);
  
  // Set content type header based on file extension
  const contentType = MIME_TYPES[ext] || 'text/plain';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found
        fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content || 'File not found', 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`WebAssembly demo available at http://localhost:${PORT}/index.html`);
});

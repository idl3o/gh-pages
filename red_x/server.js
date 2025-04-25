const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon'
};

http
  .createServer((req, res) => {
    // Make the URL path relative
    let filePath = '.' + req.url;
    if (filePath === './') {
      filePath = './index.html';
    }

    const extname = path.extname(filePath);
    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // Page not found
          fs.readFile('./404.html', (err, content) => {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
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
  })
  .listen(port);

console.log(`Server running at http://localhost:${port}/`);
console.log('Press Ctrl+C to stop the server.');

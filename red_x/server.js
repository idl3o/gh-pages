const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const chalk = require('chalk');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || 'localhost';

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Get the file path from the request URL
  let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url);

  // If URL doesn't specify a file extension and doesn't end with /, assume it's a directory and add index.html
  if (!path.extname(filePath) && !filePath.endsWith('/')) {
    filePath += '/';
  }

  if (filePath.endsWith('/')) {
    filePath += 'index.html';
  }

  // Get the file extension
  const extname = path.extname(filePath);

  // Set the content type based on the file extension
  const contentType = MIME_TYPES[extname] || 'text/plain';

  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // If the file doesn't exist, serve a 404 page
        fs.readFile(path.join(__dirname, '..', '404.html'), (err, content) => {
          if (err) {
            // If the 404 page doesn't exist, send a simple error message
            res.writeHead(404);
            res.end('404 - Page Not Found');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(content, 'utf8');
          }
        });
      } else {
        // For other errors, send a 500 error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // If the file exists, serve it with the appropriate content type
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf8');
    }
  });
});

server.listen(PORT, HOSTNAME, () => {
  console.log(chalk.green(`Server running at http://${HOSTNAME}:${PORT}/`));
  console.log(chalk.blue('Press Ctrl+C to stop the server'));
});

// Handle server errors
server.on('error', error => {
  console.error(chalk.red(`Server error: ${error.message}`));
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nShutting down server...'));
  server.close(() => {
    console.log(chalk.green('Server has been terminated'));
    process.exit(0);
  });
});

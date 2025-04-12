require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const WindowsInstanceConnector = require('./windows-connector');
const fs = require('fs');
const os = require('os');
const KeyCompressor = require('./utils/key-compressor');
const multer = require('multer');
const upload = multer({ dest: os.tmpdir() });
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = process.env.PORT || 3000;

// Initialize IPFS services
const { initializeIPFSServices } = require('../scripts/init-ipfs-services');
const ContentController = require('../controllers/content-controller');
const IPFSService = require('../services/ipfs-service');
const PinataService = require('../services/pinata-service');

// Configure CORS for both Express and Socket.io
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));

// Configure AWS
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Enable Cross-Origin Resource Sharing with proper headers
app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Special handling for .wasm files
app.get('*.wasm', (req, res, next) => {
  const options = {
    root: path.join(__dirname),
    headers: {
      'Content-Type': 'application/wasm'
    }
  };
  res.sendFile(req.path.substring(1), options);
});

// Special handling for .txt files
app.get('*.txt', (req, res, next) => {
  const options = {
    root: path.join(__dirname, '..'),
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    }
  };
  
  const filePath = req.path.substring(1);
  console.log(`Serving text file: ${filePath}`);
  
  res.sendFile(filePath, options, (err) => {
    if (err) {
      console.error(`Error serving ${filePath}:`, err);
      next(err);
    }
  });
});

// Add resource limiting middleware
// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

// Configure speed limiter (gradually slows down responses)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs
  delayMs: 500 // begin adding 500ms of delay per request
});

// Apply to all API routes
app.use('/api/', apiLimiter);
app.use('/api/', speedLimiter);

// Memory usage monitoring
const maxMemoryUsage = process.env.MAX_MEMORY_MB || 512; // MB
const memoryCheckInterval = setInterval(() => {
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  if (memoryUsage > maxMemoryUsage) {
    console.warn(`WARNING: Memory usage exceeds limit: ${Math.round(memoryUsage)}MB / ${maxMemoryUsage}MB`);
  }
}, 30000);

// Task queue for processing heavy jobs
const queue = {
  tasks: [],
  concurrentLimit: process.env.MAX_CONCURRENT_TASKS || 5,
  running: 0,
  
  add(task) {
    return new Promise((resolve, reject) => {
      this.tasks.push({ task, resolve, reject });
      this.process();
    });
  },
  
  process() {
    if (this.running >= this.concurrentLimit || this.tasks.length === 0) {
      return;
    }
    
    const { task, resolve, reject } = this.tasks.shift();
    this.running++;
    
    Promise.resolve(task())
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.process();
      });
  }
};

// API route to get Node.js version
app.get('/api/version', (req, res) => {
  res.send(process.version);
});

// Claude AI API route
app.post('/api/claude', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const params = {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      })
    };

    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);
    
    // Parse the response body from a Uint8Array to string to JSON
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    res.json({
      response: responseBody.content[0].text,
      model: "Claude 4 via AWS Bedrock"
    });
  } catch (error) {
    console.error('Error calling Claude:', error);
    res.status(500).json({ 
      error: 'Error processing request',
      details: error.message 
    });
  }
});

// Windows Instance Connector Routes
app.get('/api/windows/status', async (req, res) => {
  try {
    if (!process.env.WINDOWS_INSTANCE_ID) {
      return res.status(404).json({ 
        status: 'not_configured',
        message: 'Windows instance ID not configured'
      });
    }
    
    const connector = new WindowsInstanceConnector();
    const instanceDetails = await connector.getInstanceDetails();
    
    res.json({
      status: 'configured',
      instance: {
        id: instanceDetails.InstanceId,
        type: instanceDetails.InstanceType,
        state: instanceDetails.State.Name,
        publicIp: instanceDetails.PublicIpAddress || 'N/A',
        privateIp: instanceDetails.PrivateIpAddress || 'N/A',
        availabilityZone: instanceDetails.Placement?.AvailabilityZone || 'N/A',
        launchTime: instanceDetails.LaunchTime
      }
    });
  } catch (error) {
    console.error('Error getting Windows instance status:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

app.post('/api/windows/connect', async (req, res) => {
  try {
    if (!process.env.WINDOWS_INSTANCE_ID) {
      return res.status(404).json({ 
        success: false,
        message: 'Windows instance ID not configured'
      });
    }
    
    const { connectionType } = req.body;
    
    const connector = new WindowsInstanceConnector({
      connectionType: connectionType || 'rdp'
    });
    
    const result = await connector.connect();
    
    res.json({
      success: true,
      message: `Windows instance connection initiated via ${connectionType || 'rdp'}`,
      details: result
    });
  } catch (error) {
    console.error('Error connecting to Windows instance:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Key Compression API Routes
app.post('/api/keys/compress', upload.single('keyFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No key file provided' 
      });
    }

    const password = req.body.password;
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required for key compression' 
      });
    }

    // Generate output filename
    const outputPath = path.join(
      os.tmpdir(), 
      `${path.basename(req.file.originalname, path.extname(req.file.originalname))}_compressed.key`
    );
    
    // Compress the key
    await KeyCompressor.compressFile(req.file.path, outputPath, password);
    
    // Respond with the compressed key file
    res.download(outputPath, `${path.basename(req.file.originalname, path.extname(req.file.originalname))}_compressed.key`, (err) => {
      // Clean up temp files after download
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      
      if (err) {
        console.error('Error sending compressed file:', err);
      }
    });
  } catch (error) {
    console.error('Error compressing key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error compressing key',
      details: error.message 
    });
    
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.post('/api/windows/compress-key', async (req, res) => {
  try {
    const { password, outputFilename } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required for key compression' 
      });
    }

    if (!process.env.WINDOWS_PRIVATE_KEY_PATH) {
      return res.status(404).json({ 
        success: false, 
        message: 'No Windows private key configured in .env' 
      });
    }

    const connector = new WindowsInstanceConnector();
    const outputPath = path.join(
      os.tmpdir(),
      outputFilename || 'windows_key_compressed.key'
    );
    
    await connector.compressPrivateKey(outputPath, password);
    
    res.download(outputPath, path.basename(outputPath), (err) => {
      // Clean up after download
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      
      if (err) {
        console.error('Error sending compressed Windows key:', err);
      }
    });
  } catch (error) {
    console.error('Error compressing Windows key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error compressing Windows key',
      details: error.message 
    });
  }
});

// Content API routes with IPFS support
app.post('/api/content', async (req, res) => {
  try {
    const { contentData } = req.body;
    const authToken = req.headers.authorization?.split(' ')[1];
    
    if (!contentData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content data is required' 
      });
    }
    
    const result = await ContentController.createOrUpdateContent(contentData, authToken);
    res.json(result);
  } catch (error) {
    console.error('Error creating/updating content:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error processing content',
      details: error.message 
    });
  }
});

app.get('/api/content/:id', async (req, res) => {
  try {
    const result = await ContentController.getContentById(req.params.id);
    res.json(result);
  } catch (error) {
    console.error(`Error retrieving content ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Error retrieving content',
      details: error.message 
    });
  }
});

app.get('/api/content/ipfs/:cid', async (req, res) => {
  try {
    const result = await ContentController.getContentByCid(req.params.cid);
    res.json(result);
  } catch (error) {
    console.error(`Error retrieving content by CID ${req.params.cid}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Error retrieving content by CID',
      details: error.message 
    });
  }
});

app.post('/api/content/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided' 
      });
    }
    
    const authToken = req.headers.authorization?.split(' ')[1];
    const metadata = JSON.parse(req.body.metadata || '{}');
    
    // Create file stream from the uploaded file
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Upload content
    const result = await ContentController.uploadContent(
      fileBuffer, 
      {
        ...metadata,
        filename: req.file.originalname,
        contentType: req.file.mimetype
      },
      authToken
    );
    
    // Clean up temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error uploading content',
      details: error.message 
    });
    
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.post('/api/content/:id/publish', async (req, res) => {
  try {
    const contentId = req.params.id;
    const authToken = req.headers.authorization?.split(' ')[1];
    
    const result = await ContentController.publishContent(contentId, authToken);
    res.json(result);
  } catch (error) {
    console.error(`Error publishing content ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Error publishing content',
      details: error.message 
    });
  }
});

app.post('/api/content/:id/view', async (req, res) => {
  try {
    const contentId = req.params.id;
    const authToken = req.headers.authorization?.split(' ')[1];
    
    const result = await ContentController.recordView(contentId, authToken);
    res.json(result);
  } catch (error) {
    console.error(`Error recording view for content ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Error recording view',
      details: error.message 
    });
  }
});

app.post('/api/content/:id/interact/:type', async (req, res) => {
  try {
    const contentId = req.params.id;
    const interactionType = req.params.type;
    const authToken = req.headers.authorization?.split(' ')[1];
    
    const result = await ContentController.recordInteraction(contentId, interactionType, authToken);
    res.json(result);
  } catch (error) {
    console.error(`Error recording interaction for content ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Error recording interaction',
      details: error.message 
    });
  }
});

app.post('/api/content/:id/thumbnail', upload.single('thumbnail'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No thumbnail file provided' 
      });
    }
    
    const contentId = req.params.id;
    const authToken = req.headers.authorization?.split(' ')[1];
    
    // Create file stream from the uploaded file
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Upload thumbnail
    const result = await ContentController.uploadThumbnail(
      fileBuffer,
      contentId,
      authToken
    );
    
    // Clean up temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    console.error(`Error uploading thumbnail for content ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Error uploading thumbnail',
      details: error.message 
    });
    
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// IPFS Status API
app.get('/api/ipfs/status', async (req, res) => {
  try {
    const client = await IPFSService.getClient();
    const ipfsId = await client.id();
    
    const pinataEnabled = PinataService.isConfigured();
    let pinataStatus = null;
    
    if (pinataEnabled) {
      try {
        const pinList = await PinataService.listPins({ pageLimit: 1 });
        pinataStatus = {
          connected: true,
          totalPins: pinList.count
        };
      } catch (error) {
        pinataStatus = {
          connected: false,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      ipfs: {
        connected: true,
        nodeId: ipfsId.id,
        version: ipfsId.agentVersion,
        protocolVersion: ipfsId.protocolVersion
      },
      pinata: pinataEnabled ? pinataStatus : { enabled: false }
    });
  } catch (error) {
    console.error('Error getting IPFS status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error getting IPFS status',
      details: error.message 
    });
  }
});

// Socket.io connection limits
io.use((socket, next) => {
  // Get number of connections
  const numConnections = Object.keys(io.sockets.sockets).length;
  const maxConnections = process.env.MAX_SOCKET_CONNECTIONS || 100;
  
  if (numConnections >= maxConnections) {
    return next(new Error('Connection limit reached. Please try again later.'));
  }
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Send welcome message
  socket.emit('welcome', { message: 'Connected to Project RED X netcode' });
  
  // Broadcast to all other connected clients
  socket.broadcast.emit('userJoined', { id: socket.id });
  
  // Handle client messages
  socket.on('message', (data) => {
    console.log(`Message from ${socket.id}:`, data);
    // Broadcast to all including sender
    io.emit('message', {
      from: socket.id,
      content: data.content,
      timestamp: Date.now()
    });
  });
  
  // Handle client position updates (for multiplayer)
  socket.on('position', (data) => {
    // Broadcast position to all except sender
    socket.broadcast.emit('position', {
      id: socket.id,
      x: data.x,
      y: data.y
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    io.emit('userLeft', { id: socket.id });
  });
});

// Catch-all route to serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Clean up on server shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  clearInterval(memoryCheckInterval);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// Start server using http.server instead of app.listen for Socket.io
server.listen(port, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║    Project RED X Server Running       ║
  ║    with Claude 4 AI Integration       ║
  ║    and Netcode SDK Support            ║
  ║                                       ║
  ║    http://localhost:${port}              ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
  
  Press Ctrl+C to stop the server
  `);
  
  // Initialize IPFS services after server starts
  initializeIPFSServices()
    .then(() => {
      // Initialize content controller
      return ContentController.initialize();
    })
    .then(() => {
      console.log('IPFS services initialized successfully');
    })
    .catch(error => {
      console.error('Error initializing IPFS services:', error);
      console.log('Server will continue running with limited IPFS functionality');
    });
});

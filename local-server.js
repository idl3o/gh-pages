/**
 * Local Development Server
 * For testing the Token Generator Service locally
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Import token service
const tokenService = require('./services/token-generator-service');

// Mock Models need to be initialized first
require('./models/token-model');
require('./models/stream-model');

// Initialize token service
tokenService.initialize().then(() => {
  console.log('Token service initialized successfully');
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API Routes
app.get('/api/tokens/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  const history = tokenService.getTokenHistory(walletAddress);
  res.json({ history });
});

app.get('/api/tokens/pending/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  const pending = tokenService.getPendingTokens(walletAddress);
  res.json({ pending });
});

app.post('/api/tokens/generate', async (req, res) => {
  try {
    const { recipientAddress, amount, reason, metadata } = req.body;
    const token = await tokenService.generateTokens({
      recipientAddress, 
      amount, 
      reason, 
      metadata
    });
    res.json({ success: true, token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/activities/reward', async (req, res) => {
  try {
    const { recipientAddress, activityType, activityData } = req.body;
    const reward = await tokenService.generateActivityReward(
      recipientAddress,
      activityType,
      activityData
    );
    res.json({ success: true, reward });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Serve the demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to test the token service`);
});

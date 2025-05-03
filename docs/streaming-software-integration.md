---
layout: default
title: Streaming Software Integration Guide | Web3 Crypto Streaming Service
---

# Streaming Software Integration Guide

This guide will help you connect popular streaming software like OBS (Open Broadcaster Software) and XSplit to our Web3 Crypto Streaming platform. Follow these instructions to set up your streaming environment and start broadcasting your content.

## Overview

Our platform supports integration with major streaming software through standard protocols. This allows content creators to use their preferred tools while leveraging our blockchain-based distribution and monetization systems.

## Supported Streaming Software

- **OBS Studio** (Open Broadcaster Software) - Free and open-source
- **XSplit Broadcaster** - Premium broadcasting software
- **Streamlabs Desktop** - Enhanced version of OBS
- **OBS.Live** - StreamElements version of OBS

## General Setup Process

1. Install and set up your preferred streaming software
2. Configure stream settings in our platform
3. Set up authentication and stream keys
4. Configure your streaming software with our RTMP endpoint
5. Start streaming

## OBS Studio Integration

### Prerequisites
- OBS Studio installed (version 27.0 or higher recommended)
- An active account on our platform
- Stream key from your dashboard

### Step-by-Step OBS Setup

1. **Generate Stream Key**
   - Log into your creator dashboard
   - Navigate to "Live Streaming" → "Stream Setup"
   - Generate or copy your existing stream key
   - Keep this key private - anyone with this key can stream to your channel

2. **Configure OBS**
   - Open OBS Studio
   - Go to "Settings" → "Stream"
   - Select "Custom..." from the service dropdown
   - Set Server URL to: `rtmp://stream.yourwebsite.com/live`
   - Paste your stream key in the "Stream Key" field
   - Click "Apply" then "OK"

3. **Configure Video Settings**
   - Go to "Settings" → "Output"
   - Select "Advanced" output mode for more options
   - Recommended settings for quality balance:
     - Encoder: x264 (or Hardware NVENC/AMD if available)
     - Rate Control: CBR
     - Bitrate: 4000-6000 Kbps (adjust based on your internet upload speed)
     - Keyframe Interval: 2
     - Preset: Quality or Balanced
     - Profile: High
     - Tune: None or Film

4. **Audio Settings**
   - Go to "Settings" → "Audio"
   - Sample Rate: 48kHz
   - Channels: Stereo
   - Recommended audio bitrate: 128-320 Kbps

5. **Start Streaming**
   - Set up your scenes, sources, and transitions
   - Click "Start Streaming" when ready
   - Verify your stream is working in your creator dashboard

### OBS Browser Source for Stream Widgets

To display on-stream notifications, chat, and blockchain interactions:

1. In OBS, add a new "Browser" source to your scene
2. Set the URL to: `https://yourwebsite.com/widgets/stream/?channel=YOUR_CHANNEL_ID`
3. Set width to 1920 and height to 1080 (adjust as needed)
4. Enable "Refresh browser when scene becomes active"

## XSplit Integration

### Prerequisites
- XSplit Broadcaster installed
- An active account on our platform
- Stream key from your dashboard

### Step-by-Step XSplit Setup

1. **Generate Stream Key**
   - Same process as with OBS Studio

2. **Configure XSplit**
   - Open XSplit Broadcaster
   - Click on "Broadcast" → "Set up a new output" → "Custom RTMP"
   - Enter a name for your stream output
   - Set URL to: `rtmp://stream.yourwebsite.com/live`
   - Paste your stream key
   - Click "OK"

3. **Configure Video Settings**
   - Go to "Tools" → "Settings" → "Video"
   - Resolution: 1920x1080 or 1280x720
   - FPS: 30 or 60
   - Go to "Encode" tab
   - Video Encoder: x264 (or GPU accelerated option)
   - Bitrate: 4000-6000 Kbps

4. **Audio Settings**
   - Go to "Tools" → "Settings" → "Audio"
   - Audio Bitrate: 128-320 Kbps
   - Sample Rate: 48000 Hz

5. **Start Streaming**
   - Click "Broadcast" → Select your configured output
   - Verify your stream is working in your creator dashboard

### XSplit Browser Source for Stream Widgets

To display stream widgets and blockchain interactions:

1. Add a new source → "Web Page"
2. Enter URL: `https://yourwebsite.com/widgets/stream/?channel=YOUR_CHANNEL_ID`
3. Set the dimensions and position as needed
4. Click "OK" to add the source to your scene

## Advanced Features

### Stream Monetization

Your streams on our platform can be monetized through various blockchain mechanisms:

1. **Token-gated Access**: Set up premium streams that require tokens for access
2. **NFT-based Subscription**: Create subscription tiers with NFT access passes
3. **Live Tipping**: Enable viewers to send crypto tips during your stream

To enable these features, go to your creator dashboard and configure the desired monetization methods in the "Stream Monetization" section.

### Low-Latency Streaming

For interactive streams where viewer engagement is important:

1. In OBS:
   - Settings → Advanced → Stream Delay → Set to 0s
   - Output → Tune: zerolatency (if using x264)
   - Output → Keyframe Interval: 1 or 2

2. In XSplit:
   - Tools → Settings → Encode → Keyframe Interval: 1 or 2
   - Advanced → "Enable low latency mode"

### Stream Health Monitoring

Monitor your stream health metrics directly from your creator dashboard:

- Blockchain transaction confirmation status
- Viewer count and engagement
- Stream stability metrics
- Token interaction analytics

## Troubleshooting

### Common OBS Issues

- **High Encoding CPU Usage**: Lower your video output resolution or change the CPU Usage Preset to a faster option
- **Frame Drops**: Reduce bitrate or check your internet connection
- **Stream Key Error**: Regenerate your stream key in the dashboard

### Common XSplit Issues

- **Connection Issues**: Verify your stream key and server URL
- **Performance Problems**: Adjust video bitrate and resolution
- **Audio Sync**: Reset audio offset in audio settings

## Browser Source Integration

For both OBS and XSplit, you can create custom overlays that interact with blockchain events:

```html
<!-- Example overlay HTML that you can host locally or on our CDN -->
<html>
<head>
  <script src="https://yourwebsite.com/js/blockchain-overlay.js"></script>
  <link rel="stylesheet" href="https://yourwebsite.com/css/overlay-styles.css">
</head>
<body>
  <div id="tip-container" class="animated"></div>
  <div id="sub-alert" class="hidden"></div>
  <script>
    // Initialize the blockchain event listener
    BlockchainOverlay.init({
      channelId: 'YOUR_CHANNEL_ID',
      contractAddress: 'YOUR_CONTRACT_ADDRESS',
      network: 'ethereum' // or 'polygon', etc.
    });
  </script>
</body>
</html>
```

## Next Steps

- Explore our [Stream Monetization Guide](stream-monetization.html)
- Learn about [Web3 Integration Features](web3-streaming-service-whitepaper.html)
- Set up [Stream Analytics](analytics-integration.html) for your channel

For additional support or questions, join our Discord community or create a support ticket in your creator dashboard.

// Test script for HLS service with IPFS integration

import ipfsService from '../services/IPFSService.js';
import hlsService from '../services/HLSService.js';

console.log('Starting HLS service test...');

// Initialize the services
async function initServices() {
  try {
    console.log('Initializing IPFS service...');
    await ipfsService.initialize();

    console.log('Initializing HLS service...');
    await hlsService.initialize();

    console.log('Services initialized successfully!');
    return true;
  } catch (error) {
    console.error('Failed to initialize services:', error);
    return false;
  }
}

// Create a mock video file (since we can't create a real one in this environment)
function createMockVideoFile() {
  // Mock video data as ArrayBuffer
  const videoSize = 1024 * 1024; // 1MB
  const videoData = new Uint8Array(videoSize);

  // Fill with random data to simulate video content
  for (let i = 0; i < videoSize; i++) {
    videoData[i] = Math.floor(Math.random() * 256);
  }

  // Create file object
  const file = new File([videoData], "sample-video.mp4", {
    type: "video/mp4"
  });

  console.log(`Created mock video file "${file.name}" (${file.size} bytes)`);
  return file;
}

// Run mock conversion and test
async function testVideoConversion() {
  // Create mock video
  const videoFile = createMockVideoFile();

  try {
    console.log('Starting test conversion...');

    // Start conversion with progress tracking
    const result = await hlsService.convertToHLS(
      videoFile,
      {
        qualities: ['720p', '480p', '360p'],
        segmentDuration: 6
      },
      (progress, status) => {
        console.log(`Conversion progress: ${Math.round(progress)}% - ${status}`);
      }
    );

    console.log('Conversion completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Conversion failed:', error);
    throw error;
  }
}

// Test live streaming functionality
async function testLiveStreaming() {
  try {
    console.log('Creating test live stream...');

    // Create a live stream
    const stream = await hlsService.createLiveStream({
      name: 'Test Live Stream',
      description: 'A test stream for development purposes',
      qualities: ['720p', '480p']
    });

    console.log('Stream created:', stream);

    // Start the stream
    console.log('Starting stream...');
    const startResult = await hlsService.startLiveStream(stream.streamId);
    console.log('Stream started:', startResult);

    // Create a few test segments (5 segments, 3 seconds each)
    console.log('Adding test segments...');
    for (let i = 0; i < 5; i++) {
      // Create mock segment data
      const segmentData = new Uint8Array(1024 * 10); // 10KB
      for (let j = 0; j < segmentData.length; j++) {
        segmentData[j] = Math.floor(Math.random() * 256);
      }

      // Add segment to stream
      const segmentResult = await hlsService.addLiveSegment(stream.streamId, segmentData, {
        duration: 3, // 3 seconds
        quality: '720p'
      });

      console.log(`Added segment ${i+1}/5`);

      // Short delay between segments
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Get stream info
    const streamInfo = await hlsService.getLiveStreamInfo(stream.streamId);
    console.log('Live stream info:', streamInfo);

    // Stop the stream
    console.log('Stopping stream...');
    const stopResult = await hlsService.stopLiveStream(stream.streamId);
    console.log('Stream stopped:', stopResult);

    return {
      stream,
      playbackUrl: streamInfo.playbackUrl,
      masterPlaylistCid: stopResult.masterPlaylistCid
    };
  } catch (error) {
    console.error('Live streaming test failed:', error);
    throw error;
  }
}

// Run the tests
async function runTests() {
  // Initialize
  const initialized = await initServices();
  if (!initialized) {
    console.error('Test failed: Could not initialize services');
    return;
  }

  // Test VOD conversion
  try {
    console.log('\n--- Testing VOD Conversion ---');
    const vodResult = await testVideoConversion();
    console.log('VOD test completed successfully!');
    console.log('Master Playlist URL:', vodResult.masterPlaylistUrl);
  } catch (error) {
    console.error('VOD test failed:', error);
  }

  // Test live streaming
  try {
    console.log('\n--- Testing Live Streaming ---');
    const liveResult = await testLiveStreaming();
    console.log('Live streaming test completed successfully!');
    console.log('Playback URL:', liveResult.playbackUrl);
  } catch (error) {
    console.error('Live streaming test failed:', error);
  }

  console.log('\nAll tests completed!');
}

// Start the test sequence
runTests();

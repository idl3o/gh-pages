/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Stream Model
 * Mock implementation for local development
 */

const EventEmitter = require('events');

class StreamModel extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map();
    this.streamSessions = new Map();
    console.log('StreamModel initialized');
  }

  getStreamById(id) {
    return this.streams.get(id) || null;
  }

  startStream(streamData) {
    const id = `stream_${Date.now()}`;
    const stream = { 
      id,
      ...streamData,
      status: 'live',
      startedAt: new Date().toISOString(),
      viewerCount: 0,
      peakViewerCount: 0,
      totalViews: 0
    };
    
    this.streams.set(id, stream);
    this.emit('stream:started', stream);
    return stream;
  }

  endStream(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) return null;
    
    stream.status = 'ended';
    stream.endedAt = new Date().toISOString();
    this.streams.set(streamId, stream);
    this.emit('stream:ended', stream);
    return stream;
  }

  addViewer(streamId, viewerData) {
    const stream = this.streams.get(streamId);
    if (!stream) return null;
    
    const sessionId = `session_${Date.now()}_${viewerData.viewerAddress.substring(0, 6)}`;
    const session = {
      id: sessionId,
      streamId,
      ...viewerData,
      startedAt: new Date().toISOString(),
      lastPing: new Date().toISOString()
    };
    
    this.streamSessions.set(sessionId, session);
    
    // Update stream stats
    stream.viewerCount++;
    stream.totalViews++;
    if (stream.viewerCount > stream.peakViewerCount) {
      stream.peakViewerCount = stream.viewerCount;
    }
    
    this.emit('viewer:joined', { ...session, streamId });
    return session;
  }

  removeViewer(sessionId) {
    const session = this.streamSessions.get(sessionId);
    if (!session) return null;
    
    const stream = this.streams.get(session.streamId);
    if (stream && stream.status === 'live') {
      stream.viewerCount = Math.max(0, stream.viewerCount - 1);
    }
    
    this.streamSessions.delete(sessionId);
    this.emit('viewer:left', { 
      sessionId,
      streamId: session.streamId,
      viewerAddress: session.viewerAddress 
    });
    
    return session;
  }

  // Helper method to simulate data for testing
  createTestStream(creatorAddress) {
    return this.startStream({
      title: "Test Stream",
      description: "Testing the token generation service",
      creatorAddress,
      tags: ["test", "development"]
    });
  }
}

module.exports = new StreamModel();

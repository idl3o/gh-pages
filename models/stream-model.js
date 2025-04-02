/**
 * Stream Model
 * Handles streaming data and operations
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class StreamModel extends EventEmitter {
  constructor() {
    super();
    this.liveStreams = new Map();
    this.streamSessions = new Map();
    this.viewers = new Map();
    this.maxViewersAllowed = 1000; // Per stream limit
  }

  /**
   * Create or update a live stream
   * @param {Object} streamData Stream information
   * @returns {Object} Created/updated stream
   */
  async createOrUpdateStream(streamData) {
    if (!streamData.title || !streamData.creatorAddress) {
      throw new Error('Title and creator address are required');
    }

    const streamId = streamData.id || `stream_${crypto.randomBytes(8).toString('hex')}`;
    const existingStream = this.liveStreams.get(streamId);

    const updatedStream = {
      ...existingStream,
      ...streamData,
      id: streamId,
      updatedAt: new Date().toISOString()
    };

    if (!existingStream) {
      updatedStream.createdAt = updatedStream.updatedAt;
      updatedStream.status = 'created';
      updatedStream.viewerCount = 0;
      updatedStream.peakViewerCount = 0;
      updatedStream.totalViews = 0;
      updatedStream.startedAt = null;
      updatedStream.endedAt = null;
    }

    this.liveStreams.set(streamId, updatedStream);
    this.emit('stream:updated', updatedStream);

    return updatedStream;
  }

  /**
   * Start a live stream
   * @param {string} streamId Stream ID
   * @returns {Object} Updated stream
   */
  async startStream(streamId) {
    const stream = this.liveStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (stream.status === 'live') {
      throw new Error('Stream is already live');
    }

    stream.status = 'live';
    stream.startedAt = new Date().toISOString();

    this.liveStreams.set(streamId, stream);
    this.emit('stream:started', stream);

    return stream;
  }

  /**
   * End a live stream
   * @param {string} streamId Stream ID
   * @returns {Object} Updated stream
   */
  async endStream(streamId) {
    const stream = this.liveStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (stream.status !== 'live') {
      throw new Error('Stream is not live');
    }

    stream.status = 'ended';
    stream.endedAt = new Date().toISOString();

    // Clear all viewers
    for (const [sessionId, session] of this.streamSessions.entries()) {
      if (session.streamId === streamId) {
        this.streamSessions.delete(sessionId);
      }
    }

    this.liveStreams.set(streamId, stream);
    this.emit('stream:ended', stream);

    return stream;
  }

  /**
   * Add a viewer to a stream
   * @param {string} streamId Stream ID
   * @param {string} viewerAddress Viewer's wallet address
   * @returns {Object} Session information
   */
  async addViewer(streamId, viewerAddress) {
    const stream = this.liveStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (stream.status !== 'live') {
      throw new Error('Stream is not live');
    }

    if (stream.viewerCount >= this.maxViewersAllowed) {
      throw new Error('Stream has reached maximum viewer capacity');
    }

    const sessionId = `session_${crypto.randomBytes(8).toString('hex')}`;

    const session = {
      id: sessionId,
      streamId,
      viewerAddress,
      startedAt: new Date().toISOString(),
      lastPing: new Date().toISOString()
    };

    // Update viewer count
    stream.viewerCount += 1;
    stream.totalViews += 1;

    if (stream.viewerCount > stream.peakViewerCount) {
      stream.peakViewerCount = stream.viewerCount;
    }

    this.streamSessions.set(sessionId, session);
    this.liveStreams.set(streamId, stream);

    this.emit('viewer:joined', {
      streamId,
      viewerAddress,
      sessionId,
      currentViewers: stream.viewerCount
    });

    return {
      sessionId,
      stream: {
        id: stream.id,
        title: stream.title,
        creatorAddress: stream.creatorAddress,
        viewerCount: stream.viewerCount
      }
    };
  }

  /**
   * Remove a viewer from a stream
   * @param {string} sessionId Session ID
   * @returns {boolean} Success status
   */
  async removeViewer(sessionId) {
    const session = this.streamSessions.get(sessionId);

    if (!session) {
      return false;
    }

    const stream = this.liveStreams.get(session.streamId);

    if (stream && stream.status === 'live') {
      stream.viewerCount = Math.max(0, stream.viewerCount - 1);
      this.liveStreams.set(session.streamId, stream);
    }

    this.streamSessions.delete(sessionId);

    this.emit('viewer:left', {
      streamId: session.streamId,
      viewerAddress: session.viewerAddress,
      sessionId,
      currentViewers: stream ? stream.viewerCount : 0
    });

    return true;
  }

  /**
   * Get all live streams
   * @returns {Array} Array of live streams
   */
  getLiveStreams() {
    const results = [];

    this.liveStreams.forEach(stream => {
      if (stream.status === 'live') {
        results.push(stream);
      }
    });

    return results;
  }

  /**
   * Get stream by ID
   * @param {string} streamId Stream ID
   * @returns {Object|null} Stream or null if not found
   */
  getStreamById(streamId) {
    return this.liveStreams.get(streamId) || null;
  }

  /**
   * Get creator's live and past streams
   * @param {string} creatorAddress Creator's wallet address
   * @returns {Object} Live and past streams
   */
  getCreatorStreams(creatorAddress) {
    const live = [];
    const past = [];

    this.liveStreams.forEach(stream => {
      if (stream.creatorAddress === creatorAddress) {
        if (stream.status === 'live') {
          live.push(stream);
        } else if (stream.status === 'ended') {
          past.push(stream);
        }
      }
    });

    return { live, past };
  }
}

module.exports = new StreamModel();

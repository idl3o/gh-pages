/**
 * Livepeer Integration Module - 2025 Edition
 * Integrates with Livepeer Studio's decentralized video infrastructure
 * Supports Web3-native streaming with token-gated content and monetization
 */

import { createClient } from '/node_modules/@livepeer/react/dist/index.js';
import { studioProvider } from '/node_modules/@livepeer/react/dist/providers/studio.js';

class LivepeerIntegration {
  constructor(config) {
    this.apiKey = config?.apiKey || null;
    this.client = null;
    this.currentStream = null;
    this.viewer = null;
    this.streamStatus = 'inactive';
    this.listeners = [];
    this.playerElement = null;
    this.viewerCount = 0;
    this.recordingEnabled = false;
    this.transcodeProfiles = config?.transcodeProfiles || [
      {
        name: 'standard',
        fps: 30,
        width: 1280,
        height: 720,
        bitrate: 2000000
      },
      {
        name: 'mobile',
        fps: 30,
        width: 640,
        height: 360,
        bitrate: 600000
      }
    ];
  }

  // Initialize Livepeer client
  async initialize(apiKey) {
    this.apiKey = apiKey || this.apiKey;

    if (!this.apiKey) {
      throw new Error('Livepeer API key is required');
    }

    try {
      // Create Livepeer client
      this.client = createClient({
        provider: studioProvider({
          apiKey: this.apiKey
        }),
        quantization: '4k', // Advanced AI-powered encoding preset
        appId: 'web3-streaming-platform'
      });

      this.notifyListeners('initialized', { success: true });
      return true;
    } catch (error) {
      console.error('Failed to initialize Livepeer:', error);
      this.notifyListeners('initialized', { success: false, error });
      return false;
    }
  }

  // Create a new stream
  async createStream(name, description = '', isPrivate = false) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      // Enable additional features based on 2025's Livepeer capabilities
      const streamProperties = {
        name,
        profiles: this.transcodeProfiles,
        record: this.recordingEnabled,
        playbackPolicy: {
          type: isPrivate ? 'jwt' : 'public'
        },
        encryption: isPrivate
          ? {
              enabled: true,
              method: 'aes-256-ctr'
            }
          : undefined
      };

      // Add optional description as metadata
      if (description) {
        streamProperties.metadata = {
          description
        };
      }

      // Create the stream
      this.notifyListeners('creatingStream', { name });
      const stream = await this.client.createStream(streamProperties);

      this.currentStream = {
        id: stream.id,
        name: stream.name,
        playbackId: stream.playbackId,
        streamKey: stream.streamKey,
        rtmpIngestUrl: `rtmp://rtmp.livepeer.com/live/${stream.streamKey}`,
        hlsPlaybackUrl: `https://cdn.livepeer.com/hls/${stream.playbackId}/index.m3u8`,
        status: 'created',
        viewerCount: 0,
        isPrivate: isPrivate,
        createdAt: new Date().toISOString()
      };

      this.notifyListeners('streamCreated', this.currentStream);

      // Start polling for stream status
      this._startStatusPolling();

      return this.currentStream;
    } catch (error) {
      console.error('Failed to create stream:', error);
      this.notifyListeners('streamCreateFailed', { error: error.message });
      throw error;
    }
  }

  // Get active stream info
  getStreamInfo() {
    return this.currentStream;
  }

  // Get stream by ID
  async getStream(streamId) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      const stream = await this.client.getStream(streamId);

      if (!stream) {
        return null;
      }

      return {
        id: stream.id,
        name: stream.name,
        playbackId: stream.playbackId,
        streamKey: stream.streamKey,
        rtmpIngestUrl: `rtmp://rtmp.livepeer.com/live/${stream.streamKey}`,
        hlsPlaybackUrl: `https://cdn.livepeer.com/hls/${stream.playbackId}/index.m3u8`,
        status: stream.isActive ? 'active' : 'inactive',
        viewerCount: stream.viewerCount || 0,
        isPrivate: stream.playbackPolicy?.type === 'jwt',
        createdAt: stream.createdAt
      };
    } catch (error) {
      console.error('Failed to get stream:', error);
      return null;
    }
  }

  // List user's streams
  async listStreams(limit = 10, filters = {}) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      const { streams, total } = await this.client.listStreams({
        limit,
        filters: {
          // Support filtering by isActive, streamerId, etc.
          ...filters
        }
      });

      return {
        streams: streams.map(stream => ({
          id: stream.id,
          name: stream.name,
          playbackId: stream.playbackId,
          status: stream.isActive ? 'active' : 'inactive',
          createdAt: stream.createdAt
        })),
        total
      };
    } catch (error) {
      console.error('Failed to list streams:', error);
      return { streams: [], total: 0 };
    }
  }

  // Update stream information
  async updateStream(streamId, updates) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      await this.client.updateStream(streamId, updates);

      // Update current stream if it's the active one
      if (this.currentStream && this.currentStream.id === streamId) {
        this.currentStream = {
          ...this.currentStream,
          ...updates
        };

        this.notifyListeners('streamUpdated', this.currentStream);
      }

      return true;
    } catch (error) {
      console.error('Failed to update stream:', error);
      return false;
    }
  }

  // Delete a stream
  async deleteStream(streamId) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      await this.client.deleteStream(streamId);

      // Clear current stream if it's the deleted one
      if (this.currentStream && this.currentStream.id === streamId) {
        this.currentStream = null;
        this._stopStatusPolling();
        this.notifyListeners('streamDeleted', { id: streamId });
      }

      return true;
    } catch (error) {
      console.error('Failed to delete stream:', error);
      return false;
    }
  }

  // Connect player to a stream for viewing
  async connectPlayer(elementId, playbackId, options = {}) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      const playerElement = document.getElementById(elementId);
      if (!playerElement) {
        throw new Error(`Element with id '${elementId}' not found`);
      }

      this.playerElement = playerElement;

      // Clear any existing player
      playerElement.innerHTML = '';

      // Configure player options
      const playerOptions = {
        stream: {
          playbackId
        },
        autoPlay: options.autoPlay !== false,
        muted: options.muted !== false,
        controls: options.controls !== false,
        theme: {
          borderRadius: 12,
          colors: {
            accent: '#0284c7',
            progressBarBackground: '#4B5563'
          }
        },
        priority: 'playback',
        objectFit: options.objectFit || 'contain',
        poster: options.poster,
        onError: error => {
          console.error('Player error:', error);
          this.notifyListeners('playerError', { error: error.message });
        }
      };

      // If the stream is token-gated, add JWT
      if (options.accessToken) {
        playerOptions.jwt = options.accessToken;
      }

      // Initialize viewer
      this.viewer = await this.client.createPlayer(playerOptions);
      this.viewer.mount(playerElement);

      // Set up event listeners
      this.viewer.on('playing', () => {
        this.notifyListeners('playing', { playbackId });
      });

      this.viewer.on('buffering', () => {
        this.notifyListeners('buffering', { playbackId });
      });

      this.viewer.on('error', error => {
        this.notifyListeners('playbackError', { error, playbackId });
      });

      this.notifyListeners('playerConnected', { playbackId });
      return true;
    } catch (error) {
      console.error('Failed to connect player:', error);
      this.notifyListeners('playerConnectionFailed', { error: error.message });
      return false;
    }
  }

  // Generate access token for private streams
  async generateAccessToken(playbackId, walletAddress) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      const token = await this.client.generateJwt({
        playbackId,
        payload: {
          viewer: walletAddress
        },
        expiry: '6h' // Token valid for 6 hours
      });

      return token;
    } catch (error) {
      console.error('Failed to generate access token:', error);
      return null;
    }
  }

  // Setup token-gated content
  async setTokenGating(streamId, requiredToken, minBalance) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      // Update stream with token gating information
      await this.client.updateStream(streamId, {
        playbackPolicy: {
          type: 'jwt',
          webhookId: 'custom-token-gate',
          webhookContext: {
            tokenAddress: requiredToken,
            minBalance,
            chain: '1' // Ethereum Mainnet
          }
        }
      });

      // Update current stream if it's the active one
      if (this.currentStream && this.currentStream.id === streamId) {
        this.currentStream.isPrivate = true;
        this.notifyListeners('tokenGatingEnabled', {
          streamId,
          tokenAddress: requiredToken,
          minBalance
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to set token gating:', error);
      return false;
    }
  }

  // Enable/disable recording
  setRecording(enabled) {
    this.recordingEnabled = enabled;

    if (this.currentStream) {
      this.updateStream(this.currentStream.id, {
        record: enabled
      });
    }
  }

  // Get recorded sessions
  async getRecordings(streamId) {
    if (!this.client) {
      throw new Error('Livepeer client not initialized');
    }

    try {
      const recordings = await this.client.getRecordings(streamId);

      return recordings.map(recording => ({
        id: recording.id,
        streamId: recording.streamId,
        status: recording.status,
        duration: recording.duration,
        size: recording.size,
        createdAt: recording.createdAt,
        downloadUrl: recording.downloadUrl,
        playbackUrl: recording.playbackUrl
      }));
    } catch (error) {
      console.error('Failed to get recordings:', error);
      return [];
    }
  }

  // Start stream status polling
  _startStatusPolling() {
    // Clear any existing interval
    this._stopStatusPolling();

    if (!this.currentStream || !this.currentStream.id) {
      return;
    }

    // Poll every 5 seconds
    this._statusInterval = setInterval(async () => {
      try {
        if (!this.currentStream || !this.currentStream.id) {
          this._stopStatusPolling();
          return;
        }

        const streamInfo = await this.client.getStream(this.currentStream.id);

        if (!streamInfo) {
          return;
        }

        const prevStatus = this.currentStream.status;
        const newStatus = streamInfo.isActive ? 'active' : 'inactive';

        // Update current stream info
        this.currentStream = {
          ...this.currentStream,
          status: newStatus,
          viewerCount: streamInfo.viewerCount || 0
        };

        // Notify if status changed
        if (prevStatus !== newStatus) {
          this.notifyListeners('streamStatusChanged', {
            id: this.currentStream.id,
            status: newStatus
          });
        }

        // Update viewer count if changed
        if (this.viewerCount !== streamInfo.viewerCount) {
          this.viewerCount = streamInfo.viewerCount || 0;
          this.notifyListeners('viewerCountUpdated', {
            count: this.viewerCount
          });
        }
      } catch (error) {
        console.error('Error polling stream status:', error);
      }
    }, 5000);
  }

  // Stop status polling
  _stopStatusPolling() {
    if (this._statusInterval) {
      clearInterval(this._statusInterval);
      this._statusInterval = null;
    }
  }

  // Event listeners
  addEventListener(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter(
        listener => listener.event !== event || listener.callback !== callback
      );
    };
  }

  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
  }

  // Clean up resources
  destroy() {
    this._stopStatusPolling();

    if (this.viewer) {
      try {
        this.viewer.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
      this.viewer = null;
    }

    this.playerElement = null;
    this.listeners = [];
  }
}

export default LivepeerIntegration;

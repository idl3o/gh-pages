/**
 * Enhanced HLS (HTTP Live Streaming) Service with IPFS Integration
 *
 * This service provides functionality for:
 * - Video transcoding to HLS format with multiple quality variants
 * - Creation and management of live streams
 * - IPFS-based storage and delivery of HLS content
 * - Adaptive bitrate streaming
 * - Both VOD (Video on Demand) and live streaming capabilities
 */

import { v4 as uuidv4 } from 'https://cdn.jsdelivr.net/npm/uuid@latest/dist/esm-browser/index.js';
import ipfsService from './IPFSService.js';

class HLSService {
  constructor() {
    // Service state
    this.isInitialized = false;

    // Configuration
    this.config = {
      // General settings
      defaultSegmentDuration: 6, // seconds
      defaultChunkSize: 2 * 1024 * 1024, // 2MB
      maxConcurrentTranscodes: 2,

      // Default bitrates for different qualities
      bitrateProfiles: {
        '1080p': {
          videoBitrate: '5000k',
          audioBitrate: '192k',
          width: 1920,
          height: 1080
        },
        '720p': {
          videoBitrate: '2800k',
          audioBitrate: '128k',
          width: 1280,
          height: 720
        },
        '480p': {
          videoBitrate: '1400k',
          audioBitrate: '128k',
          width: 854,
          height: 480
        },
        '360p': {
          videoBitrate: '800k',
          audioBitrate: '96k',
          width: 640,
          height: 360
        },
        '240p': {
          videoBitrate: '400k',
          audioBitrate: '64k',
          width: 426,
          height: 240
        }
      },

      // Live streaming settings
      live: {
        defaultBufferSize: 5, // Number of segments to keep in buffer
        maxCatchupRate: 2.0, // Maximum playback rate for catchup
        lowLatencyMode: true, // Enable low-latency optimization
        segmentNamingScheme: 'sequential' // 'sequential' or 'timestamp'
      }
    };

    // Track active conversions and streams
    this.activeConversions = new Map();
    this.activeStreams = new Map();

    // Workers for processing
    this.workers = {
      transcoding: null,
      playlist: null
    };

    // Mock FFmpeg for browser demo (in production, use WebAssembly FFmpeg or server-side)
    this.mockFFmpeg = {
      initialized: false,
      busy: false,
      async initialize() {
        // Simulate initialization time
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.initialized = true;
        return true;
      },
      async transcode(file, options, progressCallback) {
        // Mock transcoding process with artificial delays
        const totalDuration = 10 + (file.size / 1024 / 1024 * 0.5); // Rough estimate: 10s + 0.5s per MB
        let progress = 0;

        // Simulate transcoding steps
        const steps = ['Analyzing video', 'Extracting audio', 'Transcoding video', 'Multiplexing', 'Creating segments'];
        const results = [];

        for (let i = 0; i < steps.length; i++) {
          const stepStartProgress = (i / steps.length) * 100;
          const stepEndProgress = ((i + 1) / steps.length) * 100;
          const step = steps[i];

          // Update initial step status
          progressCallback(stepStartProgress, step);

          // Simulate step progress
          const stepDuration = totalDuration / steps.length;
          const start = Date.now();

          while (Date.now() - start < stepDuration * 1000) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const stepProgress = (Date.now() - start) / (stepDuration * 1000);
            progress = stepStartProgress + (stepEndProgress - stepStartProgress) * stepProgress;
            progressCallback(progress, step);

            // If we're creating segments, simulate creating segment results
            if (i === steps.length - 1 && stepProgress > 0.2) {
              const segmentCount = Math.floor(stepProgress * 10);
              if (results.length < segmentCount) {
                results.push({
                  name: `segment-${results.length}.ts`,
                  data: new Uint8Array(1024 * 10), // Mock 10KB segment
                  duration: options.segmentDuration || 6
                });
                // Mock fill with random data
                for (let i = 0; i < results[results.length - 1].data.length; i++) {
                  results[results.length - 1].data[i] = Math.floor(Math.random() * 256);
                }
              }
            }
          }
        }

        // Return mock results
        return {
          segments: results,
          duration: results.length * (options.segmentDuration || 6),
          width: options.width,
          height: options.height,
          videoCodec: 'h264',
          audioCodec: 'aac'
        };
      }
    };
  }

  /**
   * Initialize the HLS service
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize(config = {}) {
    // Merge provided config with defaults
    this.config = {
      ...this.config,
      ...config
    };

    try {
      // Make sure IPFS service is initialized
      if (!ipfsService.isInitialized) {
        await ipfsService.initialize();
      }

      // Initialize mock FFmpeg
      await this.mockFFmpeg.initialize();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize HLS service:', error);
      throw error;
    }
  }

  /**
   * Ensure the service is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('HLS service not initialized. Call initialize() first.');
    }
  }

  /**
   * Convert a video file to HLS format with multiple quality levels
   * @param {File} file - The video file to convert
   * @param {Object} options - Conversion options
   * @param {Function} progressCallback - Progress callback function
   * @returns {Promise<Object>} - The conversion result with IPFS CIDs
   */
  async convertToHLS(file, options = {}, progressCallback = null) {
    this._ensureInitialized();

    // Create a unique ID for this conversion
    const conversionId = uuidv4();

    // Determine qualities to generate
    const qualities = options.qualities || ['720p', '480p', '360p'];

    // Normalize segment duration
    const segmentDuration = options.segmentDuration || this.config.defaultSegmentDuration;

    try {
      // Track this conversion
      this.activeConversions.set(conversionId, {
        id: conversionId,
        file: file,
        startTime: Date.now(),
        status: 'initializing',
        progress: 0,
        qualities: qualities
      });

      // First, upload the original file to IPFS
      this._updateConversionStatus(conversionId, 'uploading', 5, 'Uploading original file to IPFS');

      // Progress tracking for file upload (5%)
      const uploadResult = await ipfsService.uploadFile(file, {
        pin: true
      }, (uploadProgress) => {
        const overallProgress = 5 * (uploadProgress / 100);
        this._updateConversionStatus(
          conversionId,
          'uploading',
          overallProgress,
          `Uploading original file: ${Math.round(uploadProgress)}%`
        );
      });

      // Update status to transcoding (5-80%)
      this._updateConversionStatus(conversionId, 'transcoding', 5, 'Preparing to transcode');

      // Process each quality variant
      const variantPlaylists = [];

      for (let i = 0; i < qualities.length; i++) {
        const quality = qualities[i];
        const startProgress = 5 + (i * 75 / qualities.length);
        const endProgress = 5 + ((i + 1) * 75 / qualities.length);

        // Get bitrate profile for this quality
        const bitrateProfile = this.config.bitrateProfiles[quality];

        if (!bitrateProfile) {
          console.warn(`No bitrate profile found for ${quality}, skipping...`);
          continue;
        }

        // Update status
        this._updateConversionStatus(
          conversionId,
          'transcoding',
          startProgress,
          `Transcoding ${quality} variant`
        );

        // Call "FFmpeg" to transcode (mock in this demo)
        const transcodingOptions = {
          outputQuality: quality,
          segmentDuration: segmentDuration,
          videoBitrate: bitrateProfile.videoBitrate,
          audioBitrate: bitrateProfile.audioBitrate,
          width: bitrateProfile.width,
          height: bitrateProfile.height
        };

        // Mock transcode with progress tracking
        const transcodingResult = await this.mockFFmpeg.transcode(
          file,
          transcodingOptions,
          (transcodeProgress, status) => {
            const qualityProgress = startProgress + ((endProgress - startProgress) * transcodeProgress / 100);
            this._updateConversionStatus(
              conversionId,
              'transcoding',
              qualityProgress,
              `${status} (${quality}): ${Math.round(transcodeProgress)}%`
            );
          }
        );

        // Create HLS playlist for this variant
        const variantM3U8 = this._generateVariantPlaylist(
          transcodingResult.segments,
          segmentDuration,
          quality
        );

        // Upload segments to IPFS and get their CIDs
        const segmentUploads = [];

        for (const segment of transcodingResult.segments) {
          // Create a blob from the segment data
          const blob = new Blob([segment.data], { type: 'video/mp2t' });

          // Upload to IPFS and get CID
          const segmentUpload = await ipfsService.uploadBlob(blob, segment.name);
          segmentUploads.push({
            name: segment.name,
            cid: segmentUpload.cid,
            duration: segment.duration
          });
        }

        // Replace segment URLs in playlist with IPFS gateway URLs
        const updatedM3U8 = this._updateSegmentUrls(variantM3U8, segmentUploads);

        // Upload variant playlist to IPFS
        const variantPlaylistBlob = new Blob([updatedM3U8], { type: 'application/vnd.apple.mpegurl' });
        const variantPlaylistResult = await ipfsService.uploadBlob(
          variantPlaylistBlob,
          `playlist_${quality}.m3u8`
        );

        // Add to variant playlists array
        variantPlaylists.push({
          quality: quality,
          cid: variantPlaylistResult.cid,
          url: ipfsService.getGatewayUrl(variantPlaylistResult.cid),
          bandwidth: parseInt(bitrateProfile.videoBitrate) * 1000 + parseInt(bitrateProfile.audioBitrate) * 1000,
          resolution: `${bitrateProfile.width}x${bitrateProfile.height}`
        });
      }

      // Create master playlist (80-90%)
      this._updateConversionStatus(conversionId, 'generating', 80, 'Creating master playlist');

      const masterM3U8 = this._generateMasterPlaylist(variantPlaylists);
      const masterPlaylistBlob = new Blob([masterM3U8], { type: 'application/vnd.apple.mpegurl' });

      // Upload master playlist to IPFS (90-100%)
      this._updateConversionStatus(conversionId, 'uploading', 90, 'Uploading master playlist');

      const masterPlaylistResult = await ipfsService.uploadBlob(
        masterPlaylistBlob,
        'master.m3u8'
      );

      // Conversion complete
      this._updateConversionStatus(conversionId, 'completed', 100, 'Conversion complete');

      // Return the result
      const result = {
        conversionId,
        originalFileCid: uploadResult.cid,
        masterPlaylistCid: masterPlaylistResult.cid,
        masterPlaylistUrl: ipfsService.getGatewayUrl(masterPlaylistResult.cid),
        qualities: qualities,
        duration: transcodingResult.duration,
        variantPlaylists: variantPlaylists,
        completedAt: Date.now()
      };

      return result;

    } catch (error) {
      // Update status to failed
      this._updateConversionStatus(conversionId, 'failed', 0, error.message);
      console.error('HLS conversion error:', error);
      throw error;
    } finally {
      // Report final progress
      if (progressCallback) {
        const conversion = this.activeConversions.get(conversionId);
        progressCallback(
          conversion ? conversion.progress : 0,
          conversion ? conversion.statusText : 'Unknown'
        );
      }
    }
  }

  /**
   * Update conversion status and report progress
   * @private
   */
  _updateConversionStatus(conversionId, status, progress, statusText) {
    const conversion = this.activeConversions.get(conversionId);

    if (conversion) {
      conversion.status = status;
      conversion.progress = progress;
      conversion.statusText = statusText;

      // Call progress callback if provided during conversion start
      if (typeof conversion.progressCallback === 'function') {
        conversion.progressCallback(progress, statusText);
      }
    }
  }

  /**
   * Generate an HLS variant playlist file
   * @param {Array} segments - Array of segment information
   * @param {number} segmentDuration - Duration of each segment in seconds
   * @param {string} quality - Quality label
   * @returns {string} - The variant playlist content
   * @private
   */
  _generateVariantPlaylist(segments, segmentDuration, quality) {
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:3\n';
    playlist += `#EXT-X-TARGETDURATION:${Math.ceil(segmentDuration)}\n`;
    playlist += '#EXT-X-MEDIA-SEQUENCE:0\n';

    // Add segments
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      playlist += `#EXTINF:${segment.duration.toFixed(6)},\n`;
      playlist += `${segment.name}\n`;
    }

    // End playlist
    playlist += '#EXT-X-ENDLIST\n';

    return playlist;
  }

  /**
   * Update segment URLs in a playlist to use IPFS gateway URLs
   * @param {string} playlist - Original playlist content
   * @param {Array} segments - Segments with CIDs
   * @returns {string} - Updated playlist content
   * @private
   */
  _updateSegmentUrls(playlist, segments) {
    let updatedPlaylist = playlist;

    // Replace each segment filename with IPFS URL
    for (const segment of segments) {
      const gateway = ipfsService.gateway;
      updatedPlaylist = updatedPlaylist.replace(
        segment.name,
        `${gateway}${segment.cid}`
      );
    }

    return updatedPlaylist;
  }

  /**
   * Generate a master HLS playlist that references variant playlists
   * @param {Array} variantPlaylists - Array of variant playlist information
   * @returns {string} - The master playlist content
   * @private
   */
  _generateMasterPlaylist(variantPlaylists) {
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:3\n';

    // Add variants
    for (const variant of variantPlaylists) {
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution},NAME="${variant.quality}"\n`;
      playlist += `${variant.url}\n`;
    }

    return playlist;
  }

  /**
   * Create a new live stream
   * @param {Object} options - Stream configuration options
   * @returns {Promise<Object>} - Stream information
   */
  async createLiveStream(options = {}) {
    this._ensureInitialized();

    // Generate stream ID
    const streamId = uuidv4();

    // Extract options
    const name = options.name || 'Untitled Stream';
    const description = options.description || '';
    const qualities = options.qualities || ['720p', '480p', '360p'];
    const persistent = options.persistent !== undefined ? options.persistent : true;

    // Create stream object
    const stream = {
      streamId,
      name,
      description,
      qualities,
      persistent,
      createTime: Date.now(),
      status: 'created',
      segments: {},
      playlists: {},
      segmentCounts: {}
    };

    // Initialize segment containers for each quality
    for (const quality of qualities) {
      stream.segments[quality] = [];
      stream.playlists[quality] = null;
      stream.segmentCounts[quality] = 0;
    }

    // Store stream
    this.activeStreams.set(streamId, stream);

    return {
      streamId,
      name,
      description,
      qualities,
      status: 'created',
      createTime: stream.createTime
    };
  }

  /**
   * Start a live stream
   * @param {string} streamId - The ID of the stream to start
   * @returns {Promise<Object>} - Stream information
   */
  async startLiveStream(streamId) {
    this._ensureInitialized();

    // Get stream
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Check if stream is already started
    if (stream.status === 'live') {
      return {
        streamId,
        status: 'live',
        startTime: stream.startTime
      };
    }

    // Update stream status
    stream.status = 'live';
    stream.startTime = Date.now();

    // Generate mock RTMP ingest URL
    stream.ingestUrl = `rtmp://stream.example.com/live/${streamId}`;

    return {
      streamId,
      status: 'live',
      startTime: stream.startTime,
      ingestUrl: stream.ingestUrl
    };
  }

  /**
   * Stop a live stream
   * @param {string} streamId - The ID of the stream to stop
   * @returns {Promise<Object>} - Stream information
   */
  async stopLiveStream(streamId) {
    this._ensureInitialized();

    // Get stream
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Check if stream is not live
    if (stream.status !== 'live') {
      throw new Error(`Stream ${streamId} is not live`);
    }

    // Update stream status
    stream.status = 'ended';
    stream.endTime = Date.now();

    // Calculate duration
    stream.duration = Math.round((stream.endTime - stream.startTime) / 1000);

    // If persistent, create a VOD from the stream
    let masterPlaylistCid = null;
    if (stream.persistent && Object.keys(stream.segments).length > 0) {
      try {
        // Generate final playlists for each quality
        const variantPlaylists = [];

        for (const quality of stream.qualities) {
          // Skip if no segments for this quality
          if (!stream.segments[quality] || stream.segments[quality].length === 0) {
            continue;
          }

          // Generate variant playlist
          const variantContent = this._generateVariantPlaylist(
            stream.segments[quality],
            this.config.defaultSegmentDuration,
            quality
          );

          // Upload variant playlist to IPFS
          const variantBlob = new Blob([variantContent], { type: 'application/vnd.apple.mpegurl' });
          const variantResult = await ipfsService.uploadBlob(variantBlob, `playlist_${quality}.m3u8`);

          // Get bitrate profile
          const bitrateProfile = this.config.bitrateProfiles[quality];

          // Add to variant playlists array
          variantPlaylists.push({
            quality: quality,
            cid: variantResult.cid,
            url: ipfsService.getGatewayUrl(variantResult.cid),
            bandwidth: parseInt(bitrateProfile.videoBitrate) * 1000 + parseInt(bitrateProfile.audioBitrate) * 1000,
            resolution: `${bitrateProfile.width}x${bitrateProfile.height}`
          });
        }

        // Create master playlist
        const masterContent = this._generateMasterPlaylist(variantPlaylists);
        const masterBlob = new Blob([masterContent], { type: 'application/vnd.apple.mpegurl' });

        // Upload master playlist to IPFS
        const masterResult = await ipfsService.uploadBlob(masterBlob, `master_${streamId}.m3u8`);
        masterPlaylistCid = masterResult.cid;

        // Store in stream object
        stream.masterPlaylistCid = masterPlaylistCid;
      } catch (error) {
        console.error(`Failed to create VOD from stream ${streamId}:`, error);
      }
    }

    return {
      streamId,
      status: 'ended',
      startTime: stream.startTime,
      endTime: stream.endTime,
      duration: stream.duration,
      masterPlaylistCid
    };
  }

  /**
   * Add a segment to a live stream
   * @param {string} streamId - The ID of the stream
   * @param {Uint8Array} segmentData - The segment data
   * @param {Object} options - Segment options
   * @returns {Promise<Object>} - Segment information
   */
  async addLiveSegment(streamId, segmentData, options = {}) {
    this._ensureInitialized();

    // Get stream
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Check if stream is live
    if (stream.status !== 'live') {
      throw new Error(`Stream ${streamId} is not live`);
    }

    // Extract options
    const quality = options.quality || '720p';
    const duration = options.duration || this.config.defaultSegmentDuration;

    // Check if quality is supported for this stream
    if (!stream.qualities.includes(quality)) {
      throw new Error(`Quality ${quality} not supported for stream ${streamId}`);
    }

    // Increment segment counter for this quality
    stream.segmentCounts[quality] = (stream.segmentCounts[quality] || 0) + 1;

    // Generate segment name
    const segmentName = `segment_${quality}_${stream.segmentCounts[quality]}.ts`;

    // Create blob from segment data
    const blob = new Blob([segmentData], { type: 'video/mp2t' });

    // Upload to IPFS
    const result = await ipfsService.uploadBlob(blob, segmentName);

    // Create segment object
    const segment = {
      name: segmentName,
      cid: result.cid,
      duration: duration,
      size: segmentData.length,
      quality: quality,
      sequence: stream.segmentCounts[quality]
    };

    // Add to stream segments
    stream.segments[quality].push(segment);

    // Maintain sliding window if needed (only keep recent segments for live)
    const bufferSize = this.config.live.defaultBufferSize;
    if (stream.segments[quality].length > bufferSize) {
      stream.segments[quality] = stream.segments[quality].slice(-bufferSize);
    }

    // Generate updated playlist for this quality
    const playlistContent = this._generateLiveVariantPlaylist(
      stream.segments[quality],
      duration,
      stream.segmentCounts[quality] - stream.segments[quality].length + 1 // First sequence number
    );

    // Upload playlist to IPFS
    const playlistBlob = new Blob([playlistContent], { type: 'application/vnd.apple.mpegurl' });
    const playlistResult = await ipfsService.uploadBlob(playlistBlob, `live_${quality}_${streamId}.m3u8`);

    // Store playlist CID
    stream.playlists[quality] = playlistResult.cid;

    // If this is the first segment or we need to update master playlist
    if (stream.segmentCounts[quality] === 1 || !stream.masterPlaylistCid) {
      await this._updateLiveMasterPlaylist(streamId);
    }

    return {
      streamId,
      quality,
      segmentCid: result.cid,
      segmentUrl: ipfsService.getGatewayUrl(result.cid),
      playlistCid: playlistResult.cid,
      playlistUrl: ipfsService.getGatewayUrl(playlistResult.cid)
    };
  }

  /**
   * Generate a variant playlist for live streaming
   * @private
   */
  _generateLiveVariantPlaylist(segments, targetDuration, startSequence) {
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:3\n';
    playlist += `#EXT-X-TARGETDURATION:${Math.ceil(targetDuration)}\n`;
    playlist += `#EXT-X-MEDIA-SEQUENCE:${startSequence}\n`;

    // Add low-latency directives if enabled
    if (this.config.live.lowLatencyMode) {
      playlist += '#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=1.0\n';
    }

    // Add segments
    for (const segment of segments) {
      playlist += `#EXTINF:${segment.duration.toFixed(6)},\n`;
      playlist += `${ipfsService.getGatewayUrl(segment.cid)}\n`;
    }

    return playlist;
  }

  /**
   * Update the master playlist for a live stream
   * @private
   */
  async _updateLiveMasterPlaylist(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    // Collect available variant playlists
    const variantPlaylists = [];

    for (const quality of stream.qualities) {
      // Skip if no playlist for this quality
      if (!stream.playlists[quality]) continue;

      // Get bitrate profile
      const bitrateProfile = this.config.bitrateProfiles[quality];

      // Add to variant playlists array
      variantPlaylists.push({
        quality: quality,
        cid: stream.playlists[quality],
        url: ipfsService.getGatewayUrl(stream.playlists[quality]),
        bandwidth: parseInt(bitrateProfile.videoBitrate) * 1000 + parseInt(bitrateProfile.audioBitrate) * 1000,
        resolution: `${bitrateProfile.width}x${bitrateProfile.height}`
      });
    }

    // Create master playlist
    const masterContent = this._generateMasterPlaylist(variantPlaylists);
    const masterBlob = new Blob([masterContent], { type: 'application/vnd.apple.mpegurl' });

    // Upload master playlist to IPFS
    const masterResult = await ipfsService.uploadBlob(masterBlob, `master_${streamId}.m3u8`);

    // Store in stream object
    stream.masterPlaylistCid = masterResult.cid;
    stream.playbackUrl = ipfsService.getGatewayUrl(masterResult.cid);
  }

  /**
   * Get information about a live stream
   * @param {string} streamId - The ID of the stream
   * @returns {Promise<Object>} - Stream information
   */
  async getLiveStreamInfo(streamId) {
    this._ensureInitialized();

    // Get stream
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Calculate duration if live
    let duration = 0;
    if (stream.status === 'live' && stream.startTime) {
      duration = Math.round((Date.now() - stream.startTime) / 1000);
    } else if (stream.status === 'ended' && stream.duration) {
      duration = stream.duration;
    }

    return {
      streamId,
      name: stream.name,
      description: stream.description,
      status: stream.status,
      createTime: stream.createTime,
      startTime: stream.startTime,
      endTime: stream.endTime,
      duration,
      playbackUrl: stream.playbackUrl,
      ingestUrl: stream.ingestUrl,
      qualities: stream.qualities,
      segmentCounts: stream.segmentCounts,
      masterPlaylistCid: stream.masterPlaylistCid
    };
  }

  /**
   * Get a list of all streams
   * @returns {Promise<Array>} - List of streams
   */
  async getStreams() {
    this._ensureInitialized();

    const streams = [];

    for (const stream of this.activeStreams.values()) {
      streams.push({
        streamId: stream.streamId,
        name: stream.name,
        description: stream.description,
        status: stream.status,
        createTime: stream.createTime,
        startTime: stream.startTime,
        endTime: stream.endTime
      });
    }

    return streams;
  }
}

// Create singleton instance
const hlsService = new HLSService();
export default hlsService;

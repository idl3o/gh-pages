import React, { useRef, useState, useEffect } from 'react';
import styles from './VideoPlayer.module.css';
import { useWeb3 } from '../../hooks/useWeb3';
import { fetchIPFSContent } from '../../utils/ipfs';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  creator?: string;
  ipfsHash?: string;
  isLive?: boolean;
  autoplay?: boolean;
  requiredTokenId?: string;
  requiredTokenAmount?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onQualityChange?: (quality: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  creator,
  ipfsHash,
  isLive = false,
  autoplay = false,
  requiredTokenId,
  requiredTokenAmount = 0,
  onPlay,
  onPause,
  onEnded,
  onError,
  onTimeUpdate,
  onQualityChange,
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressHandleRef = useRef<HTMLDivElement>(null);
  
  // Web3 integration
  const { account, connected, connectWallet, hasToken } = useWeb3();
  
  // Player state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(!requiredTokenId);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const [showCenterPlayButton, setShowCenterPlayButton] = useState(!autoplay);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  // Control auto-hide timer
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize player
  useEffect(() => {
    const checkTokenAccess = async () => {
      if (!requiredTokenId) {
        setHasAccess(true);
        return;
      }
      
      if (!connected) {
        setHasAccess(false);
        return;
      }
      
      const hasAccess = await hasToken(requiredTokenId, requiredTokenAmount);
      setHasAccess(hasAccess);
    };
    
    checkTokenAccess();
    
    // Initialize with available qualities
    setQualities(['240p', '360p', '480p', '720p', '1080p', 'auto']);
    
    // Set up video source
    loadVideo();
    
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [src, ipfsHash, connected, requiredTokenId, requiredTokenAmount]);

  // Load video from source or IPFS
  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let videoSrc = src;
      
      // If IPFS hash is provided, try to load from IPFS
      if (ipfsHash) {
        try {
          const ipfsContent = await fetchIPFSContent(ipfsHash);
          videoSrc = ipfsContent.url;
        } catch (ipfsError) {
          console.error('Failed to load from IPFS, falling back to direct URL:', ipfsError);
        }
      }
      
      if (videoRef.current) {
        videoRef.current.src = videoSrc;
        videoRef.current.load();
        
        if (autoplay && hasAccess) {
          try {
            await videoRef.current.play();
            setPlaying(true);
            setShowCenterPlayButton(false);
          } catch (autoplayError) {
            console.warn('Autoplay prevented by browser:', autoplayError);
            setShowCenterPlayButton(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading video:', error);
      setError('Failed to load video. Please try again.');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle play/pause toggle
  const togglePlay = async () => {
    if (!hasAccess) return;
    
    try {
      if (videoRef.current) {
        if (playing) {
          videoRef.current.pause();
        } else {
          await videoRef.current.play();
          setShowCenterPlayButton(false);
        }
      }
    } catch (error) {
      console.error('Error toggling play state:', error);
    }
  };

  // Video event handlers
  const handlePlay = () => {
    setPlaying(true);
    setShowCenterPlayButton(false);
    onPlay?.();
    resetControlsTimer();
  };

  const handlePause = () => {
    setPlaying(false);
    setShowCenterPlayButton(true);
    onPause?.();
    setControlsVisible(true);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdate?.(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoading(false);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setShowCenterPlayButton(true);
    onEnded?.();
    setControlsVisible(true);
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setMuted(videoRef.current.muted);
    }
  };

  const handleWaiting = () => {
    setBuffering(true);
  };

  const handlePlaying = () => {
    setBuffering(false);
  };

  const handleError = (e: any) => {
    console.error('Video error:', e);
    setError('An error occurred while playing this video. Please try again.');
    setLoading(false);
    setBuffering(false);
    onError?.(e);
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const duration = videoRef.current.duration;
      const progress = (bufferedEnd / duration) * 100;
      setBufferProgress(progress);
    }
  };

  // User interaction with progress bar
  const handleProgressBarClick = (e: React.MouseEvent) => {
    if (!progressBarRef.current || !videoRef.current || !hasAccess) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = pos * duration;
    
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Handle volume control
  const handleVolumeClick = () => {
    if (!videoRef.current) return;
    
    if (muted) {
      videoRef.current.muted = false;
      setMuted(false);
    } else {
      videoRef.current.muted = true;
      setMuted(true);
    }
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setVolume(newVolume);
      setMuted(newVolume === 0);
    }
  };

  // Quality selection
  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);
    setShowQualityMenu(false);
    onQualityChange?.(quality);
    
    // Implement quality change logic here
    // This would typically involve switching to a different stream or source
    console.log(`Changing quality to: ${quality}`);
    
    // For now, we're just logging it
    // In a real implementation, you would reload the video with the new quality
    // or use a streaming protocol like HLS or DASH that handles quality switching
  };

  // UI controls visibility
  const resetControlsTimer = () => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    setControlsVisible(true);
    
    if (playing && !isUserInteracting) {
      controlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  };

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  const handleMouseEnter = () => {
    setControlsVisible(true);
  };

  const handleMouseLeave = () => {
    if (playing && !isUserInteracting) {
      setControlsVisible(false);
    }
  };

  // Handle fullscreen
  const toggleFullScreen = () => {
    if (!playerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setFullScreen(true);
      }).catch(err => {
        console.error('Error attempting to enable full-screen mode:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setFullScreen(false);
      }).catch(err => {
        console.error('Error attempting to exit full-screen mode:', err);
      });
    }
  };

  // Connect wallet to access token-gated content
  const handleConnectWallet = async () => {
    await connectWallet();
  };

  // Retry loading video after error
  const handleRetry = () => {
    loadVideo();
  };

  // Helper function to format time (seconds to MM:SS)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={playerContainerRef}
      className={styles.playerContainer}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className={styles.videoElement}
        poster={poster}
        playsInline
        onClick={togglePlay}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onVolumeChange={handleVolumeChange}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onError={handleError}
        onProgress={handleProgress}
      />

      {/* Video info overlay */}
      {(title || creator) && (
        <div className={styles.videoInfo}>
          {title && <h3 className={styles.videoTitle}>{title}</h3>}
          {creator && <p className={styles.creatorName}>{creator}</p>}
        </div>
      )}
      
      {/* Live indicator */}
      {isLive && (
        <div className={styles.liveIndicator}>
          <div className={styles.liveDot} />
          LIVE
        </div>
      )}
      
      {/* IPFS link */}
      {ipfsHash && (
        <a 
          href={`https://ipfs.io/ipfs/${ipfsHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ipfsLink}
          title="View on IPFS"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </a>
      )}
      
      {/* Center play button */}
      <div 
        className={`${styles.centerPlayButton} ${showCenterPlayButton ? styles.visible : ''}`}
        onClick={togglePlay}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="white" 
          stroke="none" 
        >
          <polygon points="5 3 19 12 5 21" />
        </svg>
      </div>
      
      {/* Controls */}
      <div className={`${styles.controls} ${controlsVisible ? '' : styles.hidden}`}>
        {/* Progress bar */}
        <div className={styles.progressBarContainer}>
          <div 
            ref={progressBarRef}
            className={styles.progressBar} 
            onClick={handleProgressBarClick}
          >
            <div 
              className={styles.bufferBar} 
              style={{ width: `${bufferProgress}%` }}
            />
            <div 
              className={styles.progress} 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div 
              ref={progressHandleRef}
              className={styles.progressHandle} 
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Control buttons */}
        <div className={styles.buttonsBar}>
          {/* Left controls */}
          <div className={styles.leftControls}>
            <button 
              className={styles.controlButton}
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              )}
            </button>
            
            {/* Volume control */}
            <div 
              className={styles.volumeControlContainer}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button 
                className={styles.controlButton}
                onClick={handleVolumeClick}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>
              
              {showVolumeSlider && (
                <div className={styles.volumeSliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    className={styles.volumeSlider}
                    onChange={handleVolumeSliderChange}
                    aria-label="Volume"
                  />
                </div>
              )}
            </div>
            
            {/* Time display */}
            <span className={styles.timeDisplay}>
              {formatTime(currentTime)} / {isLive ? 'LIVE' : formatTime(duration)}
            </span>
          </div>
          
          {/* Right controls */}
          <div className={styles.rightControls}>
            {/* Quality selector */}
            <div 
              className={styles.qualitySelector}
              onMouseEnter={() => setShowQualityMenu(true)}
              onMouseLeave={() => setShowQualityMenu(false)}
            >
              <button 
                className={styles.controlButton}
                aria-label="Quality settings"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              
              {showQualityMenu && (
                <div className={styles.qualityMenu}>
                  {qualities.map((quality) => (
                    <button
                      key={quality}
                      className={`${styles.qualityOption} ${quality === currentQuality ? styles.selected : ''}`}
                      onClick={() => handleQualityChange(quality)}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Fullscreen button */}
            <button 
              className={styles.controlButton}
              onClick={toggleFullScreen}
              aria-label={fullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {fullScreen ? (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <p>Loading video...</p>
        </div>
      )}
      
      {/* Buffering overlay */}
      {buffering && !loading && (
        <div className={styles.bufferingOverlay}>
          <div className={styles.spinner} />
          <p>Buffering...</p>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className={styles.errorOverlay}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
          <button className={styles.retryButton} onClick={handleRetry}>
            Try Again
          </button>
        </div>
      )}
      
      {/* Token-gated access overlay */}
      {!hasAccess && requiredTokenId && (
        <div className={styles.accessGateOverlay}>
          <div className={styles.accessGateContent}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h3>Token-Gated Content</h3>
            <p>This video requires ownership of specific tokens to view.</p>
            
            <div className={styles.tokenRequirement}>
              Required: {requiredTokenAmount} {requiredTokenId}
            </div>
            
            {!connected ? (
              <button className={styles.accessButton} onClick={handleConnectWallet}>
                Connect Wallet
              </button>
            ) : (
              <p>Your wallet doesn't have the required tokens to view this content.</p>
            )}
          </div>
        </div>
      )}
      
      {/* Optional poster image if video is not loaded */}
      {poster && !playing && (
        <img src={poster} alt={title || 'Video thumbnail'} className={styles.posterImage} />
      )}
    </div>
  );
};

export default VideoPlayer;
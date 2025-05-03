import { useState, useRef, useEffect } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  creatorName?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

const VideoPlayer = ({
  src,
  poster,
  title,
  creatorName,
  autoPlay = false,
  onEnded,
  onTimeUpdate,
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [hideControlsTimeout, setHideControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Initialize player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate && onTimeUpdate(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded && onEnded();
    };

    const handleError = () => {
      setIsError(true);
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    if (autoPlay) {
      try {
        video.play()
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error('Autoplay failed:', error);
            setIsPlaying(false);
          });
      } catch (error) {
        console.error('Autoplay error:', error);
      }
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [src, autoPlay, onTimeUpdate, onEnded]);

  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(error => {
        console.error('Error attempting to play:', error);
      });
      setIsPlaying(true);
    }
  };

  // Handle mute/unmute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMuteState = !isMuted;
    video.muted = newMuteState;
    setIsMuted(newMuteState);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const video = videoRef.current;
    if (!progressBar || !video) return;

    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = duration * clickPosition;
    
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Handle fullscreen toggle
  const toggleFullScreen = () => {
    const player = playerRef.current;
    if (!player) return;

    if (!document.fullscreenElement) {
      player.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Format time (seconds -> MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Auto-hide controls after period of inactivity
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    
    setHideControlsTimeout(timeout);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
  }, [hideControlsTimeout]);

  return (
    <div 
      className={styles.playerContainer} 
      ref={playerRef}
      onMouseMove={showControlsTemporarily}
      onClick={togglePlay}
    >
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Loading video...</p>
        </div>
      )}
      
      {isError && (
        <div className={styles.errorOverlay}>
          <p>Error loading video. Please try again later.</p>
        </div>
      )}

      <video
        ref={videoRef}
        className={styles.videoElement}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
      />

      {title && (
        <div className={styles.videoInfo}>
          <h3 className={styles.videoTitle}>{title}</h3>
          {creatorName && <p className={styles.creatorName}>by {creatorName}</p>}
        </div>
      )}

      <div className={`${styles.controls} ${showControls ? '' : styles.hidden}`}>
        <div 
          className={styles.progressBar} 
          ref={progressBarRef}
          onClick={handleSeek}
        >
          <div 
            className={styles.progress} 
            style={{ width: `${(currentTime / duration) * 100}%` }} 
          />
        </div>
        
        <div className={styles.buttonsBar}>
          <button 
            className={styles.controlButton} 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>

          <div className={styles.timeDisplay}>
            <span>{formatTime(currentTime)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className={styles.volumeControl}>
            <button 
              className={styles.controlButton} 
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              onClick={(e) => e.stopPropagation()}
              className={styles.volumeSlider}
            />
          </div>

          <button 
            className={styles.controlButton} 
            onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }}
          >
            {isFullScreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
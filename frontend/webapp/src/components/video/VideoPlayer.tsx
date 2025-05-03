import { useState, useRef, useEffect } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  autoPlay = false,
  loop = false,
  muted = false,
  onPlay,
  onPause,
  onEnd,
  onTimeUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize player
  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (autoPlay) {
        play();
      }
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnd) onEnd();
    };
    
    const handleWaiting = () => {
      setIsBuffering(true);
    };
    
    const handlePlaying = () => {
      setIsBuffering(false);
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [autoPlay, onEnd, onTimeUpdate]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle control visibility
  useEffect(() => {
    const handleMouseMove = () => {
      showPlayerControls();
    };

    const handleMouseLeave = () => {
      if (isPlaying) {
        hidePlayerControls();
      }
    };

    const playerElement = playerRef.current;
    
    if (playerElement) {
      playerElement.addEventListener('mousemove', handleMouseMove);
      playerElement.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      if (playerElement) {
        playerElement.removeEventListener('mousemove', handleMouseMove);
        playerElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [isPlaying]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  // Player control functions
  const play = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          if (onPlay) onPlay();
        })
        .catch((error) => {
          console.error('Error playing video:', error);
        });
    }
  };

  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (onPause) onPause();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newVolume = videoRef.current.volume > 0 ? 0 : volume || 0.8;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    
    setVolume(newVolume);
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const seekTime = position * duration;
    
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;

    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const showPlayerControls = () => {
    setShowControls(true);
    
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const hidePlayerControls = () => {
    setShowControls(false);
  };

  // Format time functions
  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div 
      ref={playerRef} 
      className={`${styles.videoPlayer} ${isFullscreen ? styles.fullscreen : ''}`}
      onClick={(e) => {
        // Only toggle play if clicking directly on the video, not controls
        if (e.target === e.currentTarget || e.target === videoRef.current) {
          togglePlay();
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={styles.video}
        playsInline
        loop={loop}
        muted={volume === 0}
      />

      {title && <div className={styles.videoTitle}>{title}</div>}
      
      {isBuffering && (
        <div className={styles.bufferingOverlay}>
          <div className={styles.bufferingSpinner}></div>
        </div>
      )}

      <div className={`${styles.controls} ${showControls ? styles.visible : ''}`}>
        <div 
          className={styles.progressContainer}
          ref={progressRef}
          onClick={handleProgressClick}
        >
          <div className={styles.progressBg}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.controlsBottom}>
          <button 
            className={styles.playButton} 
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <span className={styles.pauseIcon}>❚❚</span>
            ) : (
              <span className={styles.playIcon}>▶</span>
            )}
          </button>

          <div className={styles.volumeControl}>
            <button 
              className={styles.muteButton} 
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </button>
            
            <div className={styles.volumeSliderContainer}>
              <input 
                type="range"
                className={styles.volumeSlider}
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className={styles.timeDisplay}>
            <span className={styles.currentTime}>{formatTime(currentTime)}</span>
            <span className={styles.timeSeparator}> / </span>
            <span className={styles.duration}>{formatTime(duration)}</span>
          </div>

          <button 
            className={styles.fullscreenButton} 
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { checkContentAccess, ContentTiers } from '../../services/freebaseService';
import { useAuth } from '../../context/AuthContext';

/**
 * Content streaming player component with tiered access control
 * 
 * INTERNAL: Core video playback component with access restriction handling
 * SECURITY: Implements client-side freemium model with time restrictions 
 * UX PATTERN: Shows appropriate messaging based on access level
 * INTEGRATION: Works with the freebase service for access control logic
 */
const ContentPlayer = ({ content, autoplay = false }) => {
  // DOM reference for controlling video playback
  const videoRef = useRef(null);
  
  // Access control and freemium model state
  const [accessStatus, setAccessStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Current user context for permission checks
  const { currentUser } = useAuth();
  
  /**
   * INTERNAL: Check access permissions when content or user changes
   * SECURITY: Validates user permissions against content tier requirements
   * STATE MANAGEMENT: Sets up time restrictions for free preview content
   */
  useEffect(() => {
    // Check if user has access to this content
    const accessCheck = checkContentAccess(content.tier, currentUser);
    setAccessStatus(accessCheck);
    
    // If there's a time limit, set up the countdown
    if (accessCheck.hasAccess && accessCheck.restrictions?.timeLimit) {
      setTimeRemaining(accessCheck.restrictions.timeLimit);
    }
  }, [content, currentUser]);
  
  /**
   * INTERNAL: Countdown timer for free preview content
   * UX PATTERN: Shows remaining time and handles timeout gracefully
   * CLEANUP: Clears interval to prevent memory leaks
   */
  useEffect(() => {
    if (!timeRemaining) return;
    
    const intervalId = setInterval(() => {
      setTimeRemaining(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          // Time's up - pause the video and show upgrade prompt
          if (videoRef.current) {
            videoRef.current.pause();
          }
          setShowUpgradePrompt(true);
          clearInterval(intervalId);
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [timeRemaining]);
  
  /**
   * Formats seconds into MM:SS display format
   * 
   * INTERNAL: Helper function for time display
   * UX: Ensures consistent time formatting throughout the component
   */
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return '';
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Loading state while checking access permissions
  if (!accessStatus) {
    return <div className="loading">Loading...</div>;
  }
  
  // Access restriction display when user doesn't have required permissions
  if (!accessStatus.hasAccess) {
    return (
      <div className="access-required">
        {/* INTERNAL: Access restriction UI with context-appropriate messaging
            CONVERSION: Provides direct actions to resolve access issues
            UX PATTERN: Clear hierarchy of information and actions */}
        <div className="access-message">
          <i className="fas fa-lock"></i>
          <h3>Access Required</h3>
          <p>{accessStatus.message}</p>
          {accessStatus.reason === 'wallet_required' && (
            <button className="primary-button">Connect Wallet</button>
          )}
          {accessStatus.reason === 'insufficient_tokens' && (
            <div className="token-requirement">
              <p>You need {accessStatus.required} STREAM tokens to access this content.</p>
              <p>Your balance: {accessStatus.current} STREAM</p>
              <button className="primary-button">Get STREAM Tokens</button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Full content player with preview restrictions if applicable
  return (
    <div className="content-player-container">
      {/* INTERNAL: Free preview timer UI
          UX PATTERN: Non-intrusive overlay that doesn't block content
          ACCESSIBILITY: High contrast for readability */}
      {timeRemaining !== null && (
        <div className="free-preview-timer">
          <span>Free Preview: </span>
          <span className="time-remaining">{formatTimeRemaining()} remaining</span>
        </div>
      )}
      
      {/* INTERNAL: Core video player
          PERFORMANCE: Uses native video controls for optimal performance
          INTEGRATION: Handles content URLs from various sources including IPFS
          ACCESSIBILITY: Supports standard video player accessibility features */}
      <video 
        ref={videoRef}
        className="content-player"
        poster={content.thumbnailUrl}
        controls
        autoPlay={autoplay}
        src={content.contentUrl}
      />
      
      {/* INTERNAL: Upgrade prompt overlay
          DISPLAYED: When free preview time expires
          CONVERSION: Focused call-to-action for upgrade
          UX PATTERN: Interrupts viewing with clear value proposition */}
      {showUpgradePrompt && (
        <div className="upgrade-overlay">
          <div className="upgrade-prompt">
            <h3>Preview Ended</h3>
            <p>To continue watching, upgrade to access full content.</p>
            <div className="upgrade-actions">
              <button className="primary-button">Get STREAM Tokens</button>
              <button className="secondary-button">Learn More</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ContentPlayer.propTypes = {
  content: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    contentUrl: PropTypes.string.isRequired,
    thumbnailUrl: PropTypes.string.isRequired,
    tier: PropTypes.oneOf(Object.values(ContentTiers)).isRequired
  }).isRequired,
  autoplay: PropTypes.bool
};

export default ContentPlayer;

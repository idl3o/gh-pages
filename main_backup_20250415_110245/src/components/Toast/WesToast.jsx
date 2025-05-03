import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import '../../assets/css/westoast.css';

/**
 * Western-themed toast notification component
 * 
 * INTERNAL: Primary toast notification component with themed styling
 * ANIMATIONS: Uses CSS transitions for enter/exit animations
 * ACCESSIBILITY: Properly labeled and timed notifications
 * CUSTOMIZATION: Configurable position, type, duration, and icons
 */
const WesToast = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  position = 'top-right',
  showIcon = true
}) => {
  // Visibility states for animation control
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  /**
   * Toast dismissal handler with animation sequencing
   * 
   * INTERNAL: Manages the exit animation before actual removal
   * UX PATTERN: Two-phase removal for smooth animation
   * CALLBACK HANDLING: Invokes parent callback after animation completes
   */
  const closeToast = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Animation duration
  }, [onClose]);
  
  /**
   * Auto-dismiss timer setup
   * 
   * INTERNAL: Sets up dismissal timer based on duration prop
   * SPECIAL HANDLING: Supports Infinity for persistent toasts
   * CLEANUP: Properly clears timer on unmount
   */
  useEffect(() => {
    if (duration !== Infinity) {
      const timer = setTimeout(closeToast, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, closeToast]);
  
  // Skip rendering if not visible (after animation completes)
  if (!isVisible) return null;
  
  /**
   * Selects the appropriate icon based on toast type
   * 
   * INTERNAL: Maps toast types to western-themed emoji icons
   * THEMING: Part of the western toast visual identity
   * EXTENSIBILITY: Switch pattern allows for easy additions
   */
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '🤠'; // Cowboy hat face
      case 'error':
        return '🔥'; // Fire for error
      case 'warning':
        return '🌵'; // Cactus for warning
      case 'red2':
        return '⚠️'; // Warning symbol for red2
      case 'info':
      default:
        return '🌮'; // Taco for info
    }
  };

  return (
    <div className={`wes-toast wes-toast-${type} wes-toast-${position} ${isExiting ? 'exit' : 'enter'}`}>
      {/* INTERNAL: Content container with flex layout
          THEMING: Western-styled text and background
          ACCESSIBILITY: High contrast for readability */}
      <div className="wes-toast-content">
        {showIcon && <div className="wes-toast-icon">{getIcon()}</div>}
        <div className="wes-toast-message">{message}</div>
        <button className="wes-toast-close" onClick={closeToast}>
          &times;
        </button>
      </div>
      
      {/* INTERNAL: Visual progress indicator for auto-dismiss
          ANIMATION: CSS-based countdown animation
          UX: Provides visual feedback about remaining display time
          CONDITIONAL: Only shown for auto-dismissing toasts */}
      {duration !== Infinity && (
        <div
          className="wes-toast-progress"
          style={{ animationDuration: `${duration}ms` }}
        ></div>
      )}
    </div>
  );
};

WesToast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'red2']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
  position: PropTypes.oneOf([
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
    'top-center',
    'bottom-center'
  ]),
  showIcon: PropTypes.bool
};

export default WesToast;

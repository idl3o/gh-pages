import React, { createContext, useContext, useState } from 'react';
import WesToast from '../components/Toast/WesToast';

const ToastContext = createContext(null);

let toastCount = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, options = {}) => {
    const id = `toast-${toastCount++}`;
    const toast = {
      id,
      message,
      ...options
    };
    setToasts(prevToasts => [...prevToasts, toast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // Convenience methods for different toast types
  const showSuccess = (message, options = {}) => addToast(message, { ...options, type: 'success' });
  const showError = (message, options = {}) => addToast(message, { ...options, type: 'error' });
  const showWarning = (message, options = {}) => addToast(message, { ...options, type: 'warning' });
  const showInfo = (message, options = {}) => addToast(message, { ...options, type: 'info' });
  const showRed2 = (message, options = {}) => addToast(message, { ...options, type: 'red2' });

  const value = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showRed2
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="wes-toast-container">
        {toasts.map(toast => (
          <WesToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            position={toast.position}
            showIcon={toast.showIcon}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

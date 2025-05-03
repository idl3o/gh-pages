import React from 'react';
import { useToast } from '../context/ToastContext';

const WesToastExample = () => {
  const toast = useToast();
  
  return (
    <div className="toast-demo-section">
      <h2>WesToast Notification Demos</h2>
      <div className="toast-buttons">
        <button
          className="button"
          onClick={() => toast.showSuccess("Yeehaw! Your transaction was successful!")}
        >
          Success Toast
        </button>
        <button
          className="button"
          onClick={() => toast.showError("Whoa there! Something went wrong.")}
        >
          Error Toast
        </button>
        <button
          className="button"
          onClick={() => toast.showWarning("Hold your horses! This action cannot be undone.")}
        >
          Warning Toast
        </button>
        <button
          className="button"
          onClick={() => toast.showInfo("Howdy partner! Here's some information for you.")}
        >
          Info Toast
        </button>
        <button
          className="button danger"
          onClick={() => toast.showRed2("CRITICAL ALERT! Blockchain connectivity lost!", {
            duration: 8000,
            position: 'top-center'
          })}
        >
          Red2 Toast (Critical)
        </button>
        <button
          className="button"
          onClick={() => toast.addToast("This toast will stick around until you dismiss it.", {
            duration: Infinity,
            position: 'bottom-center'
          })}
        >
          Persistent Toast
        </button>
      </div>
    </div>
  );
};

export default WesToastExample;

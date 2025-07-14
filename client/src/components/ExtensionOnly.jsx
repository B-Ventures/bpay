import React, { useEffect, useState } from 'react';
import { isExtension } from '../utils/extensionHelper';

/**
 * ExtensionOnly Component
 * Only renders its children when the app is running as a browser extension
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render when running as extension
 * @param {React.ReactNode} props.fallback - Optional content to render when not running as extension
 * @returns {React.ReactNode}
 */
const ExtensionOnly = ({ children, fallback = null }) => {
  const [isRunningAsExtension, setIsRunningAsExtension] = useState(false);
  
  useEffect(() => {
    // Check if we're running as a browser extension
    setIsRunningAsExtension(isExtension());
  }, []);
  
  // Render nothing or fallback content if not running as extension
  if (!isRunningAsExtension) {
    return fallback;
  }
  
  // Render children when running as extension
  return children;
};

export default ExtensionOnly;
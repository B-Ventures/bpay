import React, { useState, useEffect } from 'react';
import { MdAddToHomeScreen } from 'react-icons/md';

const PWAInstallPrompt = () => {
  const [isPwaInstallable, setIsPwaInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Listen for the beforeinstallprompt event to detect PWA installability
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      // Update state to show install button
      setIsPwaInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  // Function to handle PWA installation
  const handlePwaInstall = () => {
    if (!installPrompt) return;

    // Show the install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      // Clear the saved prompt as it can't be used again
      setInstallPrompt(null);
      setIsPwaInstallable(false);
    });
  };

  const dismissPrompt = () => {
    setIsPwaInstallable(false);
  };
  
  if (!isPwaInstallable) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-lg z-50 text-white">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center mb-3 sm:mb-0">
          <MdAddToHomeScreen className="text-white text-3xl mr-3" />
          <div>
            <p className="font-semibold text-lg">Install bPay App</p>
            <p className="text-sm text-blue-100">
              Get faster checkout and offline access on your device
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={dismissPrompt}
            className="px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition"
          >
            Later
          </button>
          <button
            onClick={handlePwaInstall}
            className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition"
          >
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
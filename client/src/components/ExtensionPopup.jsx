import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../lib/AppContext';
import ExtensionOnly from './ExtensionOnly';

/**
 * Extension Popup Component
 * This is shown when the application is running as a browser extension
 */
const ExtensionPopup = () => {
  const { virtualCards, fetchVirtualCards, isLoading } = useApp();
  const [currentUrl, setCurrentUrl] = useState('');
  const [hasPaymentForm, setHasPaymentForm] = useState(false);
  
  // Detect if we're on a page with a payment form
  useEffect(() => {
    // Only run this in extension mode
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    
    // Get the current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
        
        // Check if the page has a payment form via our content script
        chrome.tabs.sendMessage(
          tabs[0].id, 
          { type: 'DETECT_PAYMENT_FORM' },
          (response) => {
            if (response?.hasPaymentForm) {
              setHasPaymentForm(true);
            }
          }
        );
      }
    });
  }, []);
  
  // Fetch user's virtual cards
  useEffect(() => {
    fetchVirtualCards();
  }, [fetchVirtualCards]);
  
  return (
    <ExtensionOnly
      fallback={
        <div className="p-6 text-center">
          <p className="text-gray-600">This component only works in extension mode.</p>
        </div>
      }
    >
      <div className="min-h-screen bg-surface-50">
        <header className="bg-slate-900 text-white px-6 py-4">
          <h1 className="text-xl font-bold">bPay</h1>
          <p className="text-sm opacity-75">Secure Split Payments</p>
        </header>
        
        <main className="p-4">
          {/* Show if we detected a payment form */}
          {hasPaymentForm && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="font-medium text-blue-800 mb-2">Payment Form Detected</h2>
              <p className="text-sm text-blue-600 mb-4">
                Would you like to use a virtual card for this purchase?
              </p>
              <div className="flex flex-col gap-2">
                <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                  Use Existing Card
                </button>
                <Link 
                  to="/card/create" 
                  className="w-full py-2 px-4 text-center border border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50"
                >
                  Create New Card
                </Link>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {/* Virtual Cards list */}
          {!isLoading && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Virtual Cards</h2>
              
              {virtualCards.length > 0 ? (
                <div className="space-y-4">
                  {virtualCards.map(card => (
                    <Link 
                      key={card.id}
                      to={`/virtual-card/${card.id}`} 
                      className="block border rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-slate-900 mb-1">
                            {card.name || 'Virtual Card'}
                          </h3>
                          <p className="text-sm text-slate-500">
                            •••• {card.cardNumber.slice(-4)} | ${card.balance.toFixed(2)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          card.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {card.status.toUpperCase()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="mb-4">You don't have any virtual cards yet.</p>
                  <Link 
                    to="/card/create" 
                    className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                  >
                    Create Virtual Card
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
        
        <footer className="border-t border-slate-200 p-4 text-center text-sm text-slate-500">
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Open Full Application
          </Link>
        </footer>
      </div>
    </ExtensionOnly>
  );
};

export default ExtensionPopup;
import React, { useState, useEffect } from 'react';
import ExtensionOnly from './ExtensionOnly';
import { useApp } from '../lib/AppContext';

const ExtensionInject = () => {
  const { virtualCards, fetchVirtualCards } = useApp();
  const [showPanel, setShowPanel] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [injected, setInjected] = useState(false);

  useEffect(() => {
    fetchVirtualCards();
  }, [fetchVirtualCards]);

  const injectCardDetails = (card) => {
    if (!card || injected) return;
    
    try {
      const cardNumberFields = document.querySelectorAll(
        'input[autocomplete="cc-number"], input[name*="card_number"], input[name*="cardnumber"], input[placeholder*="card number"]'
      );
      
      const expiryMonthFields = document.querySelectorAll(
        'input[autocomplete="cc-exp-month"], input[name*="exp_month"], input[name*="expiry_month"]'
      );
      
      const expiryYearFields = document.querySelectorAll(
        'input[autocomplete="cc-exp-year"], input[name*="exp_year"], input[name*="expiry_year"]'
      );
      
      const expiryFields = document.querySelectorAll(
        'input[autocomplete="cc-exp"], input[name*="expiry"], input[name*="expiration"], input[placeholder*="MM/YY"]'
      );
      
      const cvvFields = document.querySelectorAll(
        'input[autocomplete="cc-csc"], input[name*="cvv"], input[name*="cvc"], input[name*="security_code"]'
      );
      
      const nameFields = document.querySelectorAll(
        'input[autocomplete="cc-name"], input[name*="card_name"], input[name*="cardholder"]'
      );
      
      if (cardNumberFields.length > 0) {
        cardNumberFields[0].value = card.cardNumber;
        cardNumberFields[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      if (expiryMonthFields.length > 0 && expiryYearFields.length > 0) {
        const [month, year] = card.expiryDate.split('/');
        expiryMonthFields[0].value = month;
        expiryMonthFields[0].dispatchEvent(new Event('input', { bubbles: true }));
        
        expiryYearFields[0].value = year;
        expiryYearFields[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      if (expiryFields.length > 0) {
        expiryFields[0].value = card.expiryDate;
        expiryFields[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      if (cvvFields.length > 0) {
        cvvFields[0].value = card.cvv;
        cvvFields[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      if (nameFields.length > 0) {
        nameFields[0].value = card.cardholderName;
        nameFields[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      setInjected(true);
      setSelectedCard(card);
      setShowPanel(false);
      
      const message = document.createElement('div');
      message.style.position = 'fixed';
      message.style.top = '20px';
      message.style.left = '50%';
      message.style.transform = 'translateX(-50%)';
      message.style.background = '#4ade80';
      message.style.color = 'white';
      message.style.padding = '10px 20px';
      message.style.borderRadius = '8px';
      message.style.zIndex = '10000';
      message.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      message.textContent = 'bPay: Card details applied';
      
      document.body.appendChild(message);
      setTimeout(() => {
        document.body.removeChild(message);
      }, 3000);
      
    } catch (err) {
      console.error('Error injecting card details:', err);
    }
  };

  const handleCardSelect = (card) => {
    injectCardDetails(card);
  };

  return (
    <ExtensionOnly>
      <div className="fixed inset-x-0 bottom-0 z-50">
        {/* Main trigger button */}
        <button
          className="fixed bottom-4 right-4 flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg transition-colors"
          onClick={() => setShowPanel(!showPanel)}
        >
          {selectedCard ? (
            <span>💳 •••{selectedCard.cardNumber.slice(-4)}</span>
          ) : (
            <span>💳 Pay with bPay</span>
          )}
        </button>

        {/* Slide-up panel */}
        {showPanel && (
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPanel(false)}>
            <div 
              className="absolute bottom-0 inset-x-0 bg-white rounded-t-xl shadow-xl animate-slide-up"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-surface-900">Select Payment Method</h3>
                <button 
                  onClick={() => setShowPanel(false)}
                  className="p-2 hover:bg-surface-100 rounded-full"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3">
                {virtualCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleCardSelect(card)}
                    className="w-full p-4 bg-surface-50 hover:bg-surface-100 rounded-lg border border-surface-200 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <p className="font-medium text-surface-900">
                          {card.name || 'Virtual Card'}
                        </p>
                        <p className="text-sm text-surface-600">
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
                  </button>
                ))}

                {virtualCards.length === 0 && (
                  <div className="text-center py-8 text-surface-500">
                    <p className="mb-4">No virtual cards available</p>
                    <a 
                      href="/card/create" 
                      target="_blank"
                      className="inline-block py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Create Virtual Card
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ExtensionOnly>
  );
};

export default ExtensionInject;
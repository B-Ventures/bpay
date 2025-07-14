import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/AppContext';

const AddPaymentMethod = () => {
  const navigate = useNavigate();
  const { addPaymentMethod, isLoading, error, clearError } = useApp();
  
  // Form state
  const [type, setType] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    brand: 'visa',
  });
  const [walletDetails, setWalletDetails] = useState({
    name: '',
    balance: '',
  });
  
  // Handle card details input change
  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle wallet details input change
  const handleWalletChange = (e) => {
    const { name, value } = e.target;
    setWalletDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare the payment method data based on the type
      let paymentMethodData;
      
      if (type === 'card') {
        // For a card payment method
        const lastFour = cardDetails.cardNumber.slice(-4);
        
        paymentMethodData = {
          type,
          brand: cardDetails.brand,
          lastFour,
          expiryMonth: parseInt(cardDetails.expiryMonth),
          expiryYear: parseInt(cardDetails.expiryYear),
          isDefault: false,
        };
      } else {
        // For a wallet payment method
        paymentMethodData = {
          type,
          name: walletDetails.name,
          balance: walletDetails.balance,
          isDefault: false,
        };
      }
      
      // Add the payment method
      await addPaymentMethod(paymentMethodData);
      
      // Navigate back to dashboard after success
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding payment method:', error);
      // The app context will handle the error state
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">bPay</Link>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="font-medium">JD</span>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center">
            <span>← Back to Dashboard</span>
          </Link>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => clearError()}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Add Payment Method</h1>
          
          {/* Payment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Payment Method Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setType('card')}
                className={`px-4 py-2 rounded-md ${
                  type === 'card' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Credit/Debit Card
              </button>
              <button
                type="button"
                onClick={() => setType('wallet')}
                className={`px-4 py-2 rounded-md ${
                  type === 'wallet' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Digital Wallet
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Card Details Form */}
            {type === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Card Brand
                  </label>
                  <select
                    name="brand"
                    value={cardDetails.brand}
                    onChange={handleCardChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="discover">Discover</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234 5678 9012 3456"
                    maxLength="16"
                    pattern="[0-9]{16}"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the 16-digit card number without spaces.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Expiry Month
                    </label>
                    <select
                      name="expiryMonth"
                      value={cardDetails.expiryMonth}
                      onChange={handleCardChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="" disabled>Month</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Expiry Year
                    </label>
                    <select
                      name="expiryYear"
                      value={cardDetails.expiryYear}
                      onChange={handleCardChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="" disabled>Year</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={cardDetails.cvv}
                    onChange={handleCardChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123"
                    maxLength="4"
                    pattern="[0-9]{3,4}"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={cardDetails.cardholderName}
                    onChange={handleCardChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}
            
            {/* Wallet Details Form */}
            {type === 'wallet' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Wallet Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={walletDetails.name}
                    onChange={handleWalletChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Wallet"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Balance
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      name="balance"
                      value={walletDetails.balance}
                      onChange={handleWalletChange}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 rounded-lg font-medium text-white ${
                  isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Adding...' : 'Add Payment Method'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddPaymentMethod;
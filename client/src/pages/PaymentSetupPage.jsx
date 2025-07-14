import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/AppContext';

const PaymentSetupPage = () => {
  const navigate = useNavigate();
  const { 
    paymentMethods: availablePaymentMethods, 
    fetchPaymentMethods, 
    createVirtualCard,
    loadingPaymentMethods,
    isLoading
  } = useApp();
  
  // State for payment methods with added "isSelected" and "amount" fields
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [virtualCardName, setVirtualCardName] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch payment methods when component mounts
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);
  
  // Transform payment methods from context to add selection and amount fields
  useEffect(() => {
    if (availablePaymentMethods?.length > 0) {
      setPaymentMethods(
        availablePaymentMethods.map(method => ({
          ...method,
          isSelected: false,
          amount: 0
        }))
      );
    }
  }, [availablePaymentMethods]);
  
  // Update payment method selection
  const toggleSelectPaymentMethod = (id) => {
    setPaymentMethods(methods => 
      methods.map(method => 
        method.id === id 
          ? { ...method, isSelected: !method.isSelected } 
          : method
      )
    );
  };
  
  // Update amount for a payment method
  const updatePaymentAmount = (id, amount) => {
    setPaymentMethods(methods => 
      methods.map(method => 
        method.id === id 
          ? { ...method, amount: Number(amount) || 0 } 
          : method
      )
    );
  };
  
  // Calculate remaining amount to be allocated
  const calculateRemainingAmount = () => {
    const total = Number(totalAmount) || 0;
    const allocated = paymentMethods.reduce(
      (sum, method) => sum + (method.isSelected ? (Number(method.amount) || 0) : 0), 
      0
    );
    return total - allocated;
  };
  
  // Handle automatic splitting of payment
  const handleSplitEvenly = () => {
    const selectedMethods = paymentMethods.filter(method => method.isSelected);
    if (selectedMethods.length === 0 || !totalAmount) return;
    
    const amountPerMethod = Math.floor((Number(totalAmount) / selectedMethods.length) * 100) / 100;
    const remainder = Number(totalAmount) - (amountPerMethod * selectedMethods.length);
    
    setPaymentMethods(methods => 
      methods.map((method, index) => {
        if (!method.isSelected) return method;
        
        // Add remainder to the first method to account for rounding
        const isFirstSelected = method.id === selectedMethods[0].id;
        const adjustedAmount = isFirstSelected 
          ? amountPerMethod + remainder 
          : amountPerMethod;
          
        return { ...method, amount: adjustedAmount };
      })
    );
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!virtualCardName.trim()) {
      setError('Please enter a virtual card name');
      return;
    }
    
    if (!totalAmount || Number(totalAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (calculateRemainingAmount() !== 0) {
      setError('Please allocate the entire amount before generating the virtual card');
      return;
    }
    
    // Get selected payment sources with their amounts
    const paymentSources = paymentMethods
      .filter(method => method.isSelected && method.amount > 0)
      .map(method => ({
        id: method.id,
        type: method.type,
        amount: Number(method.amount)
      }));
    
    if (paymentSources.length === 0) {
      setError('Please select at least one payment method');
      return;
    }
    
    try {
      // Clear any previous errors
      setError('');
      
      // Create virtual card data
      const virtualCardData = {
        name: virtualCardName,
        amount: Number(totalAmount),
        paymentSources
      };
      
      // Create the virtual card
      const newCard = await createVirtualCard(virtualCardData);
      
      // Navigate to the virtual card detail page
      navigate(`/virtual-card/${newCard.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create virtual card. Please try again.');
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
      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-8">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center">
            <span>← Back to Dashboard</span>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Virtual Card</h1>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
              <span className="block sm:inline">{error}</span>
              <button 
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setError('')}
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
          )}
          
          {/* Loading state for payment methods */}
          {loadingPaymentMethods && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {/* No payment methods message */}
          {!loadingPaymentMethods && paymentMethods.length === 0 && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
              <p>No payment methods found. Please add a payment method first.</p>
              <Link to="/add-payment-method" className="mt-2 inline-block text-blue-600 hover:text-blue-800">
                Add Payment Method
              </Link>
            </div>
          )}
          
          {!loadingPaymentMethods && paymentMethods.length > 0 && (
            <form onSubmit={handleSubmit}>
              {/* Card Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Virtual Card Name
                </label>
                <input
                  type="text"
                  value={virtualCardName}
                  onChange={e => setVirtualCardName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E.g., Shopping Card"
                  required
                />
              </div>
              
              {/* Amount */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Amount ($)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              
              {/* Payment Methods Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Select Payment Methods</h2>
                  <button 
                    type="button"
                    onClick={handleSplitEvenly}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    disabled={!totalAmount || paymentMethods.filter(m => m.isSelected).length === 0}
                  >
                    Split Evenly
                  </button>
                </div>
                
                <div className="space-y-4">
                  {paymentMethods.map(method => (
                    <div 
                      key={method.id}
                      className={`border rounded-lg p-4 ${
                        method.isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start mb-3">
                        <input
                          type="checkbox"
                          id={`select-${method.id}`}
                          checked={method.isSelected}
                          onChange={() => toggleSelectPaymentMethod(method.id)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={`select-${method.id}`}
                            className="block font-medium text-slate-900 cursor-pointer"
                          >
                            {method.type === 'card' 
                              ? `${method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• ${method.lastFour}`
                              : method.name
                            }
                          </label>
                          <div className="text-sm text-slate-500">
                            {method.type === 'card' 
                              ? 'Credit Card'
                              : `Balance: ${method.balance}`
                            }
                          </div>
                        </div>
                        
                        {method.isSelected && (
                          <div className="w-24">
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                $
                              </span>
                              <input
                                type="number"
                                value={method.amount || ''}
                                onChange={e => updatePaymentAmount(method.id, e.target.value)}
                                className="w-full pl-7 pr-3 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Remaining Amount Display */}
                <div className="mt-4 p-3 bg-slate-100 rounded-md flex justify-between">
                  <span className="font-medium text-slate-700">Remaining to allocate:</span>
                  <span className={`font-medium ${
                    calculateRemainingAmount() === 0 
                      ? 'text-green-600' 
                      : calculateRemainingAmount() < 0 
                        ? 'text-red-600' 
                        : 'text-slate-900'
                  }`}>
                    ${calculateRemainingAmount().toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing || !totalAmount || calculateRemainingAmount() !== 0}
                  className={`px-6 py-2 rounded-lg font-medium text-white ${
                    isProcessing || !totalAmount || calculateRemainingAmount() !== 0
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Generate Virtual Card'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentSetupPage;
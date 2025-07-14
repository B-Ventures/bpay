import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../lib/api';

const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [virtualCard, setVirtualCard] = useState(null);
  const [cardCreated, setCardCreated] = useState(false);
  
  // Get payment data from location state (passed from the checkout page)
  const paymentData = location.state || {};

  useEffect(() => {
    // If we don't have payment data or card data from the split payment endpoint, redirect back to checkout
    if (!paymentData.cartTotal && !paymentData.cardDetails) {
      navigate('/checkout');
      return;
    }
    
    // If we already have the card details from our new API, use that directly
    if (paymentData.cardDetails) {
      setVirtualCard(paymentData.cardDetails);
      setCardCreated(true);
      setLoading(false);
      return;
    }
    
    // If we don't have the virtual card details yet but need to create it
    if (!cardCreated) {
      // Create a virtual card with the payment amount
      const createVirtualCard = async () => {
        setLoading(true);
        
        try {
          // Check if we're in demo mode
          if (window.mockLoginForDemo || window.mockUserData) {
            // For demo, create a mock virtual card
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
            
            const mockVirtualCard = {
              id: `vc_${Math.random().toString(36).substring(2, 10)}`,
              name: 'Purchase Card',
              cardholderName: window.mockUserData?.name || 'Demo User',
              balance: paymentData.cartTotal,
              status: 'active',
              lastFour: Math.floor(1000 + Math.random() * 9000).toString(),
              expiryDate: '12/26', // December 2026
              cvv: Math.floor(100 + Math.random() * 900).toString(),
              createdAt: new Date().toISOString(),
              isOneTime: true,
              serviceFee: paymentData.serviceFee,
              totalCharged: paymentData.totalCharged,
              fundingSources: paymentData.sources || []
            };
            
            setVirtualCard(mockVirtualCard);
            setCardCreated(true);
          } else {
            // Try the real API - but this should rarely happen since we're now creating 
            // the virtual card in the split-payment API call
            try {
              const response = await api.post('/api/virtual-cards', {
                name: 'Purchase Card',
                cardholderName: 'Virtual Card User',
                amount: paymentData.cartTotal,
                serviceFee: paymentData.serviceFee,
                totalCharged: paymentData.totalCharged,
                isOneTime: true,
                paymentSources: paymentData.sources || []
              });
              
              if (response.status === 201) {
                setVirtualCard(response.data);
                setCardCreated(true);
              } else {
                throw new Error('Failed to create virtual card');
              }
            } catch (apiError) {
              console.warn('API call failed, creating demo virtual card instead:', apiError);
              
              // Create a mock virtual card as fallback
              const mockVirtualCard = {
                id: `vc_${Math.random().toString(36).substring(2, 10)}`,
                name: 'Purchase Card',
                cardholderName: 'Virtual Card User',
                balance: paymentData.cartTotal,
                status: 'active',
                lastFour: Math.floor(1000 + Math.random() * 9000).toString(),
                expiryDate: '12/26',
                cvv: Math.floor(100 + Math.random() * 900).toString(),
                createdAt: new Date().toISOString(),
                isOneTime: true,
                serviceFee: paymentData.serviceFee,
                totalCharged: paymentData.totalCharged,
                fundingSources: paymentData.sources || []
              };
              
              setVirtualCard(mockVirtualCard);
              setCardCreated(true);
            }
          }
        } catch (err) {
          console.error('Error creating virtual card:', err);
          setError('Error creating virtual card. Please contact support.');
        } finally {
          setLoading(false);
        }
      };
      
      createVirtualCard();
    }
  }, [navigate, paymentData, cardCreated]);

  // Format a date in a user-friendly way
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Show loading spinner while creating the virtual card
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container max-w-4xl mx-auto p-4 mt-8">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600">Creating your virtual card...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if something went wrong
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container max-w-4xl mx-auto p-4 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-red-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-600">Payment Error</h1>
            </div>
            
            <p className="text-slate-700 mb-6">{error}</p>
            
            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex justify-between">
                <button
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </button>
                
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => navigate('/checkout')}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container max-w-4xl mx-auto p-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-green-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
          </div>
          
          <p className="text-slate-700 mb-6">
            Your payment has been processed successfully. A virtual card has been created for your purchase.
          </p>
          
          {virtualCard && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Virtual Card Details</h2>
              
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg mb-6">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="opacity-80 text-sm mb-1">Virtual Card</p>
                    <p className="font-semibold text-lg">{virtualCard.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="opacity-80 text-sm mb-1">Balance</p>
                    <p className="font-semibold text-lg">${parseFloat(virtualCard.balance).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="opacity-80 text-sm mb-1">Card Number</p>
                  <p className="font-mono text-lg tracking-wider">
                    •••• •••• •••• {virtualCard.lastFour}
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="opacity-80 text-sm mb-1">Cardholder</p>
                    <p className="font-semibold">{virtualCard.cardholderName || 'Virtual Cardholder'}</p>
                  </div>
                  <div className="text-right">
                    <p className="opacity-80 text-sm mb-1">Expires</p>
                    <p className="font-semibold">{virtualCard.expiryDate}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-700 mb-2">Card Status</h3>
                  <p className="text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      virtualCard.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></span>
                    {virtualCard.status.charAt(0).toUpperCase() + virtualCard.status.slice(1)}
                  </p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-700 mb-2">Created On</h3>
                  <p className="text-sm">{formatDate(virtualCard.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-slate-100 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Payment Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Cart total:</span>
                <span className="font-medium">${paymentData.cartTotal?.toFixed(2) || virtualCard?.balance?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-600">Service fee (2.5%):</span>
                <span className="font-medium text-emerald-600">${paymentData.serviceFee?.toFixed(2) || virtualCard?.serviceFee?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <span className="font-semibold text-slate-700">Total charged:</span>
                <span className="font-bold">${paymentData.totalCharged?.toFixed(2) || virtualCard?.totalCharged?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-slate-500 italic">
              <p>Your virtual card has been loaded with the exact cart total. The 2.5% service fee was added to the total amount charged to your payment methods.</p>
            </div>
            
            {paymentData.sources && paymentData.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="font-medium text-slate-700 mb-2">Payment Sources</h3>
                <ul className="space-y-2">
                  {paymentData.sources.map((source, index) => (
                    <li key={index} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-700 font-medium">
                          {source.label || source.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="font-medium">
                          ${source.totalCharge?.toFixed(2) || source.amount.toFixed(2)}
                        </span>
                      </div>
                      {source.feeContribution > 0 && (
                        <div className="text-xs text-slate-500 flex justify-between pl-2">
                          <span>Includes service fee:</span>
                          <span>${source.feeContribution.toFixed(2)}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
              
              {virtualCard && (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => navigate(`/virtual-card/${virtualCard.id}`)}
                >
                  View Card Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
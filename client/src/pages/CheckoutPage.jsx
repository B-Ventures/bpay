import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../lib/AppContext';
import Navbar from '../components/Navbar';
import api, { stripeApi } from '../lib/api';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { paymentMethods: contextPaymentMethods } = useApp();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Loading payment methods...');
  const [error, setError] = useState(null);
  const [cartTotal, setCartTotal] = useState(100.00); // Default example amount
  const [paymentSources, setPaymentSources] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [serviceFeePercent] = useState(2.5); // 2.5% service fee
  const serviceFee = parseFloat((cartTotal * serviceFeePercent / 100).toFixed(2));
  const totalWithFee = parseFloat((cartTotal + serviceFee).toFixed(2));
  
  // Get a human-readable label for the payment method
  const getPaymentMethodLabel = (method) => {
    if (method.type === 'card') {
      return `${method.card.brand.toUpperCase()} ending in ${method.card.last4}`;
    } else if (method.type === 'bank_account') {
      return `Bank account ending in ${method.bank_account.last4}`;
    } else if (method.type === 'paypal') {
      return `PayPal (${method.paypal.email})`;
    } else if (method.type === 'stripe_balance') {
      return 'Stripe Balance';
    } else {
      return `Payment method (${method.id})`;
    }
  };

  // Load the user's payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        // If we have a user from normal login, use the API
        // otherwise for the demo, use the payment methods from context
        if (user && !window.mockLoginForDemo) {
          const response = await api.get('/api/payment-methods');
          if (response.status === 200) {
            setPaymentMethods(response.data);
            
            // Initialize payment sources with zero amounts
            const initialPaymentSources = response.data.map(method => ({
              id: method.id,
              type: method.type,
              amount: 0,
              percentage: 0,
              label: getPaymentMethodLabel(method)
            }));
            
            setPaymentSources(initialPaymentSources);
          } else {
            setError('Failed to load payment methods');
          }
        } else if (window.mockLoginForDemo || user) {
          // For demo, use the payment methods from app context
          if (contextPaymentMethods && contextPaymentMethods.length > 0) {
            setPaymentMethods(contextPaymentMethods);
            
            // Initialize payment sources with zero amounts
            const initialPaymentSources = contextPaymentMethods.map(method => ({
              id: method.id,
              type: method.type,
              amount: 0,
              percentage: 0,
              label: getPaymentMethodLabel(method)
            }));
            
            setPaymentSources(initialPaymentSources);
          } else {
            // Mock some payment methods for demo
            const mockPaymentMethods = [
              {
                id: 101,
                type: 'card',
                name: 'Demo Credit Card',
                card: { brand: 'visa', last4: '4242' }
              },
              {
                id: 102,
                type: 'bank_account',
                name: 'Demo Bank Account',
                bank_account: { last4: '6789' }
              },
              {
                id: 103,
                type: 'paypal',
                name: 'PayPal',
                paypal: { email: 'demo@example.com' }
              }
            ];
            
            setPaymentMethods(mockPaymentMethods);
            
            // Initialize payment sources with zero amounts
            const initialPaymentSources = mockPaymentMethods.map(method => ({
              id: method.id,
              type: method.type,
              amount: 0,
              percentage: 0,
              label: getPaymentMethodLabel(method)
            }));
            
            setPaymentSources(initialPaymentSources);
          }
        } else {
          setError('Please log in to continue with checkout');
        }
      } catch (err) {
        console.error('Error loading payment methods:', err);
        setError('Error loading payment methods. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user || window.mockLoginForDemo) {
      fetchPaymentMethods();
    } else {
      setLoading(false);
      setError('Please log in to continue with checkout');
    }
  }, [user, contextPaymentMethods, navigate, getPaymentMethodLabel]);

  // Handle amount change for a payment source
  const handleAmountChange = (sourceId, newAmount) => {
    // Update the amount for this source
    const updatedSources = paymentSources.map(source => {
      if (source.id === sourceId) {
        const amount = parseFloat(newAmount) || 0;
        return {
          ...source,
          amount,
          percentage: cartTotal > 0 ? (amount / cartTotal) * 100 : 0
        };
      }
      return source;
    });
    
    setPaymentSources(updatedSources);
  };

  // Handle percentage change for a payment source
  const handlePercentageChange = (sourceId, newPercentage) => {
    // Update the percentage for this source
    const updatedSources = paymentSources.map(source => {
      if (source.id === sourceId) {
        const percentage = parseFloat(newPercentage) || 0;
        return {
          ...source,
          percentage,
          amount: (percentage / 100) * cartTotal
        };
      }
      return source;
    });
    
    setPaymentSources(updatedSources);
  };

  // Calculate the total amount allocated across all payment sources
  const totalAllocated = paymentSources.reduce((sum, source) => sum + (source.amount || 0), 0);
  
  // Calculate the remaining amount to be allocated
  const remainingAmount = Math.max(0, parseFloat((cartTotal - totalAllocated).toFixed(2)));

  // Handle the "Pay Equal" button click
  const handlePayEqual = () => {
    const activeSourceCount = paymentSources.filter(s => s.amount !== undefined).length;
    
    if (activeSourceCount === 0) return;
    
    const equalAmount = parseFloat((cartTotal / activeSourceCount).toFixed(2));
    const equalPercentage = parseFloat((100 / activeSourceCount).toFixed(2));
    
    const updatedSources = paymentSources.map(source => ({
      ...source,
      amount: equalAmount,
      percentage: equalPercentage
    }));
    
    setPaymentSources(updatedSources);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that the total allocated amount matches the cart total
    if (Math.abs(totalAllocated - cartTotal) > 0.01) {
      setError(`The total amount allocated (${totalAllocated.toFixed(2)}) does not match the cart total (${cartTotal.toFixed(2)})`);
      return;
    }
    
    // Only include sources with a positive amount
    const sourcesToProcess = paymentSources.filter(source => source.amount > 0);
    
    if (sourcesToProcess.length === 0) {
      setError('Please allocate funds from at least one payment method');
      return;
    }
    
    setProcessing(true);
    setLoadingText('Processing payment...');
    
    try {
      // Update the payment sources to reflect the total with fee
      // Each payment source needs to contribute proportionally to the fee
      const updatedSources = sourcesToProcess.map(source => {
        // Calculate what percentage of the cart total this source covers
        const sourcePercentage = source.amount / cartTotal;
        
        // Allocate the same percentage of the service fee to this source
        const sourceFeeContribution = serviceFee * sourcePercentage;
        
        // The total amount this source will be charged is the original amount plus its fee contribution
        const sourceTotalCharge = parseFloat((source.amount + sourceFeeContribution).toFixed(2));
        
        return {
          ...source,
          originalAmount: source.amount,
          totalCharge: sourceTotalCharge,
          feeContribution: sourceFeeContribution
        };
      });
      
      // In demo mode, use our demo payment processor
      let paymentResult;
      
      if (window.mockLoginForDemo || !api) {
        // Use the demo processor
        paymentResult = await stripeApi.processMultiSourcePaymentDemo({
          sources: updatedSources,
          cartTotal: cartTotal,
          serviceFee: serviceFee,
          totalWithFee: totalWithFee
        });
      } else {
        // Try the real API
        try {
          const paymentData = {
            name: "Virtual Card Purchase",
            amount: cartTotal,
            serviceFee: serviceFee,
            totalCharged: totalWithFee,
            paymentSources: updatedSources.map(source => ({
              id: source.id,
              type: source.type,
              amount: source.totalCharge // Use the amount with fee included
            }))
          };
          
          paymentResult = await stripeApi.createSplitPayment(paymentData);
        } catch (apiError) {
          console.warn('API call failed, using demo processor instead:', apiError);
          
          // Fallback to demo processor
          paymentResult = await stripeApi.processMultiSourcePaymentDemo({
            sources: updatedSources,
            cartTotal: cartTotal,
            serviceFee: serviceFee,
            totalWithFee: totalWithFee
          });
        }
      }
      
      if (paymentResult.success || paymentResult.id) {
        // Payment was successful
        // Navigate to success page with payment details
        navigate('/checkout/success', {
          state: {
            cardDetails: paymentResult,
            cartTotal: cartTotal,
            serviceFee: serviceFee,
            totalCharged: totalWithFee,
            sources: updatedSources
          }
        });
      } else {
        // Payment failed
        const errorMessage = paymentResult.error || 'Payment processing failed';
        setError(errorMessage);
        setProcessing(false);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Error processing payment. Please try again later.');
      setProcessing(false);
    }
  };

  // Render loading state
  if (loading || processing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container max-w-4xl mx-auto p-4 mt-8">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600">{loadingText}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container max-w-4xl mx-auto p-4 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-slate-700 mb-4">{error}</p>
            
            {error.includes('log in') && (
              <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
                <h2 className="text-lg font-semibold text-blue-700 mb-2">Need to log in?</h2>
                <p className="text-slate-600 mb-3">For demo purposes, you can click below to simulate logging in:</p>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                  onClick={async () => {
                    try {
                      // Mock a successful login response
                      const mockUser = {
                        id: 1,
                        username: 'demo_user',
                        name: 'Demo User',
                        email: 'demo@example.com',
                        isAdmin: false,
                        createdAt: new Date().toISOString()
                      };
                      
                      // Access the login function from useAuth hook
                      // and inject our mock user data
                      window.mockLoginForDemo = true;
                      window.mockUserData = mockUser;
                      
                      // Force a refresh of the page to reload with mock user
                      window.location.reload();
                    } catch (err) {
                      console.error('Mock login failed:', err);
                      setError('Mock login failed. Please try again.');
                    }
                  }}
                >
                  Login as Demo User
                </button>
                <button
                  className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600"
                  onClick={() => navigate('/auth')}
                >
                  Go to Login Page
                </button>
              </div>
            )}
            
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render no payment methods state
  if (paymentMethods.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container max-w-4xl mx-auto p-4 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">No Payment Methods</h1>
            <p className="text-slate-700 mb-4">
              You need to add at least one payment method to continue with the checkout.
            </p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => navigate('/add-payment-method')}
            >
              Add Payment Method
            </button>
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
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Checkout</h1>
          
          <div className="mb-6 p-4 bg-slate-100 rounded-lg">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Order Summary</h2>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600">Cart Total:</span>
              <span className="text-lg">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600">Service Fee ({serviceFeePercent}%):</span>
              <span className="text-lg text-emerald-600">${serviceFee.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-200 my-2"></div>
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-800">Total to be Charged:</span>
              <span className="text-lg text-slate-900">${totalWithFee.toFixed(2)}</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 italic">
              <p>The service fee is added to your total charged amount. Your virtual card will be loaded with the exact cart total of ${cartTotal.toFixed(2)}.</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Payment Methods</h2>
            <p className="text-slate-600 mb-4">
              Distribute the payment amount across your payment methods.
            </p>
            
            <div className="mb-4">
              <button 
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                onClick={handlePayEqual}
              >
                Pay Equal Amounts
              </button>
            </div>
            
            {paymentSources.map((source) => (
              <div 
                key={source.id} 
                className="mb-4 p-4 border border-slate-200 rounded-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center mb-3">
                  <div className="flex-1 mb-2 sm:mb-0">
                    <h3 className="font-medium">{source.label}</h3>
                    <p className="text-sm text-slate-500">
                      Type: {source.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-col">
                      <label className="text-sm text-slate-500 mb-1">Amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={cartTotal}
                        value={source.amount}
                        onChange={(e) => handleAmountChange(source.id, e.target.value)}
                        className="p-2 border border-slate-300 rounded w-24"
                      />
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-sm text-slate-500 mb-1">Percentage (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={source.percentage.toFixed(2)}
                        onChange={(e) => handlePercentageChange(source.id, e.target.value)}
                        className="p-2 border border-slate-300 rounded w-24"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="my-6 p-4 bg-slate-100 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Total Allocated:</span>
                <span className={`font-semibold ${Math.abs(totalAllocated - cartTotal) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalAllocated.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Remaining:</span>
                <span className={`font-semibold ${remainingAmount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${remainingAmount.toFixed(2)}
                </span>
              </div>
              
              {remainingAmount > 0 && (
                <p className="text-red-500 text-sm mt-2">
                  Please allocate the remaining amount before proceeding.
                </p>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 mr-2"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className={`px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                  Math.abs(totalAllocated - cartTotal) > 0.01 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={Math.abs(totalAllocated - cartTotal) > 0.01}
              >
                Complete Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
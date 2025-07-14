import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { stripeApi } from "../lib/api"; 
import { useToast } from "../utils/toast";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe hasn't loaded yet. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        setError(error.message || "An error occurred during payment processing");
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again or use a different payment method",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
      toast({
        title: "Payment Error",
        description: e.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <PaymentElement />
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Complete Payment'
        )}
      </button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [paymentInfo, setPaymentInfo] = useState({
    originalAmount: 0,
    serviceFee: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get cart data from URL or local storage
    const urlParams = new URLSearchParams(window.location.search);
    const amount = parseFloat(urlParams.get('amount') || '0');
    
    if (!amount) {
      setError("Invalid payment amount");
      setLoading(false);
      return;
    }

    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        const response = await stripeApi("POST", "/api/create-payment-intent", { 
          amount, 
          includeServiceFee: true
        });
        
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setPaymentInfo({
            originalAmount: data.originalAmount || amount,
            serviceFee: data.serviceFee || 0,
            totalAmount: data.totalAmount || amount,
          });
        } else {
          setError("Could not initialize payment. Please try again.");
        }
      } catch (err: any) {
        console.error("Payment initialization error:", err);
        setError(err.message || "Failed to initialize payment");
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold text-red-600 mb-4">Payment Error</h2>
        <p className="text-slate-700 mb-6">{error}</p>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold text-red-600 mb-4">Payment Setup Failed</h2>
        <p className="text-slate-700 mb-6">Unable to initialize payment. Please try again later.</p>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Calculate the service fee percentage for display
  const serviceFeePercent = Math.round((paymentInfo.serviceFee / paymentInfo.originalAmount) * 100 * 10) / 10;

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Complete Your Payment</h1>
      
      <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Order Amount:</span>
            <span className="font-medium">${paymentInfo.originalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Service Fee ({serviceFeePercent}%):</span>
            <span className="font-medium text-emerald-600">${paymentInfo.serviceFee.toFixed(2)}</span>
          </div>
          <div className="h-px bg-slate-200 my-2"></div>
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>${paymentInfo.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm />
      </Elements>
      
      <div className="mt-6 text-xs text-slate-500">
        <p>Your payment is processed securely by Stripe. Your card details are never stored on our servers.</p>
      </div>
    </div>
  );
}
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

const SubscribeForm = () => {
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
          return_url: `${window.location.origin}/subscription/success`,
        },
      });

      if (error) {
        setError(error.message || "An error occurred during subscription processing");
        toast({
          title: "Subscription Failed",
          description: error.message || "Please try again or use a different payment method",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
      toast({
        title: "Subscription Error",
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
          'Subscribe Now'
        )}
      </button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState({
    name: "Premium Plan",
    price: 0,
    billingCycle: "monthly"
  });

  useEffect(() => {
    // Get plan data from URL or state management
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan') || 'premium';
    
    // Create or get subscription
    const createSubscription = async () => {
      try {
        // If this is a new subscription, use /api/get-or-create-subscription
        // If this is a payment update, you'd use a different endpoint
        const response = await stripeApi("POST", "/api/get-or-create-subscription");
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          
          // If the server provides plan details, update them
          if (data.plan) {
            setPlan(data.plan);
          }
        } else {
          setError("Could not initialize subscription. Please try again.");
        }
      } catch (err: any) {
        console.error("Subscription initialization error:", err);
        setError(err.message || "Failed to initialize subscription");
      } finally {
        setLoading(false);
      }
    };

    createSubscription();
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
        <h2 className="text-xl font-bold text-red-600 mb-4">Subscription Error</h2>
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
        <h2 className="text-xl font-bold text-red-600 mb-4">Subscription Setup Failed</h2>
        <p className="text-slate-700 mb-6">Unable to initialize subscription. Please try again later.</p>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Subscribe to {plan.name}</h1>
      
      <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Subscription Details</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Plan:</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Price:</span>
            <span className="font-medium">${plan.price.toFixed(2)}/{plan.billingCycle}</span>
          </div>
          <div className="h-px bg-slate-200 my-2"></div>
          <div className="text-sm text-slate-500">
            <p>Your subscription will renew automatically each {plan.billingCycle}. You can cancel anytime from your account settings.</p>
          </div>
        </div>
      </div>
      
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <SubscribeForm />
      </Elements>
      
      <div className="mt-6 text-xs text-slate-500">
        <p>Your payment is processed securely by Stripe. Your card details are never stored on our servers.</p>
      </div>
    </div>
  );
}
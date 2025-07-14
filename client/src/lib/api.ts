// API client for making requests to the server

// Basic function to handle API requests with proper error handling
export async function apiRequest(
  method: string, 
  endpoint: string, 
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include', // Include cookies for authentication
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, options);
    
    if (!response.ok) {
      // Try to get error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
      } catch (jsonError) {
        // If we can't parse the JSON, just throw with status
        throw new Error(`API error: ${response.status}`);
      }
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Specialized function for Stripe-related API requests
export async function stripeApi(
  method: string,
  endpoint: string,
  data?: any
): Promise<Response> {
  try {
    // For Stripe-related endpoints, we'll add some extra validation
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      throw new Error('Stripe public key is not configured');
    }
    
    // Call the standard API function with any Stripe-specific headers if needed
    return await apiRequest(method, endpoint, data);
  } catch (error) {
    console.error('Stripe API request failed:', error);
    throw error;
  }
}
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi, paymentMethodsApi, virtualCardsApi, stripeApi } from './api';

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  // User authentication state
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // State for payment methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  
  // State for virtual cards
  const [virtualCards, setVirtualCards] = useState([]);
  const [loadingVirtualCards, setLoadingVirtualCards] = useState(false);
  
  // State for Stripe integration
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(true);
  
  // General app state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setAuthLoading(true);
        
        // Handle mock login for demo purposes
        if (window.mockLoginForDemo && window.mockUserData) {
          console.log('Using mock login for demo');
          setUser(window.mockUserData);
          setIsAdmin(window.mockUserData?.isAdmin || window.mockUserData?.is_admin || false);
          setAuthError(null);
          
          // Reset mock flags after use
          window.mockLoginForDemo = false;
          
          // Create mock payment methods for demo
          setPaymentMethods([
            {
              id: 101,
              type: 'card',
              name: 'Demo Credit Card',
              brand: 'visa',
              lastFour: '4242',
              expiryMonth: 12,
              expiryYear: 2026
            },
            {
              id: 102,
              type: 'bank_account',
              name: 'Demo Bank Account',
              bankName: 'Demo Bank',
              accountType: 'checking',
              lastFour: '6789'
            },
            {
              id: 103,
              type: 'paypal',
              name: 'PayPal',
              provider: 'paypal',
              email: 'demo@example.com'
            }
          ]);
          
          return;
        }
        
        // Normal authentication flow
        const userData = await authApi.getCurrentUser();
        
        setUser(userData);
        // The admin property can be named isAdmin or is_admin depending on where it comes from
        setIsAdmin(userData?.isAdmin || userData?.is_admin || false);
        setAuthError(null);
      } catch (error) {
        console.error('Error fetching current user:', error);
        setAuthError('Failed to load user data');
      } finally {
        setAuthLoading(false);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Login function
  const login = async (credentials) => {
    try {
      setAuthLoading(true);
      const userData = await authApi.login(credentials);
      
      setUser(userData);
      // The admin property can be named isAdmin or is_admin depending on where it comes from
      setIsAdmin(userData?.isAdmin || userData?.is_admin || false);
      setAuthError(null);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Login failed: ' + (error.response?.data?.message || error.message));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setAuthLoading(true);
      const newUser = await authApi.register(userData);
      
      setUser(newUser);
      // The admin property can be named isAdmin or is_admin depending on where it comes from
      setIsAdmin(newUser?.isAdmin || newUser?.is_admin || false);
      setAuthError(null);
      
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError('Registration failed: ' + (error.response?.data?.message || error.message));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setAuthLoading(true);
      await authApi.logout();
      
      setUser(null);
      setIsAdmin(false);
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError('Logout failed');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };
  
  // Check if Stripe is enabled
  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        setLoadingStripeStatus(true);
        const status = await stripeApi.checkStatus();
        setStripeEnabled(status.connected);
      } catch (error) {
        console.error('Error checking Stripe status:', error);
        setStripeEnabled(false);
      } finally {
        setLoadingStripeStatus(false);
      }
    };
    
    checkStripeStatus();
  }, []);
  
  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      const data = await paymentMethodsApi.getAll();
      setPaymentMethods(data);
      return data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to load payment methods');
      return [];
    } finally {
      setLoadingPaymentMethods(false);
    }
  };
  
  // Fetch virtual cards
  const fetchVirtualCards = async () => {
    try {
      setLoadingVirtualCards(true);
      const data = await virtualCardsApi.getAll();
      setVirtualCards(data);
      return data;
    } catch (error) {
      console.error('Error fetching virtual cards:', error);
      setError('Failed to load virtual cards');
      return [];
    } finally {
      setLoadingVirtualCards(false);
    }
  };
  
  // Add payment method
  const addPaymentMethod = async (paymentMethodData) => {
    try {
      setIsLoading(true);
      const newPaymentMethod = await paymentMethodsApi.create(paymentMethodData);
      setPaymentMethods(prevMethods => [...prevMethods, newPaymentMethod]);
      return newPaymentMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      setError('Failed to add payment method');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create virtual card
  const createVirtualCard = async (virtualCardData) => {
    try {
      setIsLoading(true);
      const newVirtualCard = await virtualCardsApi.create(virtualCardData);
      setVirtualCards(prevCards => [...prevCards, newVirtualCard]);
      return newVirtualCard;
    } catch (error) {
      console.error('Error creating virtual card:', error);
      setError('Failed to create virtual card');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get virtual card by ID
  const getVirtualCardById = async (id) => {
    try {
      setIsLoading(true);
      return await virtualCardsApi.getById(id);
    } catch (error) {
      console.error('Error getting virtual card:', error);
      setError('Failed to get virtual card details');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Activate a virtual card
  const activateVirtualCard = async (id) => {
    try {
      setIsLoading(true);
      const updatedCard = await virtualCardsApi.activate(id);
      
      // Update local state
      setVirtualCards(prevCards => 
        prevCards.map(card => 
          card.id === id ? { ...card, status: 'active' } : card
        )
      );
      
      return updatedCard;
    } catch (error) {
      console.error('Error activating virtual card:', error);
      setError('Failed to activate virtual card');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Deactivate a virtual card
  const deactivateVirtualCard = async (id) => {
    try {
      setIsLoading(true);
      const updatedCard = await virtualCardsApi.deactivate(id);
      
      // Update local state
      setVirtualCards(prevCards => 
        prevCards.map(card => 
          card.id === id ? { ...card, status: 'inactive' } : card
        )
      );
      
      return updatedCard;
    } catch (error) {
      console.error('Error deactivating virtual card:', error);
      setError('Failed to deactivate virtual card');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add funds to a virtual card
  const addFundsToVirtualCard = async (id, amount, paymentSource) => {
    try {
      setIsLoading(true);
      const updatedCard = await virtualCardsApi.addFunds(id, amount, paymentSource);
      
      // Update local state
      setVirtualCards(prevCards => 
        prevCards.map(card => 
          card.id === id ? { 
            ...card, 
            balance: updatedCard.balance 
          } : card
        )
      );
      
      return updatedCard;
    } catch (error) {
      console.error('Error adding funds to virtual card:', error);
      setError('Failed to add funds to virtual card');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear any errors
  const clearError = () => setError(null);
  
  // Context value
  const contextValue = {
    // Authentication state
    user,
    isAdmin,
    authLoading,
    authError,
    
    // Authentication actions
    login,
    register,
    logout,
    
    // State
    paymentMethods,
    virtualCards,
    stripeEnabled,
    isLoading,
    error,
    loadingPaymentMethods,
    loadingVirtualCards,
    loadingStripeStatus,
    
    // Actions
    fetchPaymentMethods,
    fetchVirtualCards,
    addPaymentMethod,
    createVirtualCard,
    getVirtualCardById,
    activateVirtualCard,
    deactivateVirtualCard,
    addFundsToVirtualCard,
    clearError,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
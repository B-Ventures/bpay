import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for authentication cookies
});

// API functions for authentication
export const authApi = {
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await api.post('/logout');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/user');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return null; // Not authenticated
      }
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
};

// API functions for payment methods
export const paymentMethodsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },
  
  create: async (paymentMethodData) => {
    try {
      const response = await api.post('/payment-methods', paymentMethodData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  },
  
  update: async (id, paymentMethodData) => {
    try {
      const response = await api.patch(`/payment-methods/${id}`, paymentMethodData);
      return response.data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await api.delete(`/payment-methods/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  },
};

// API functions for virtual cards
export const virtualCardsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/virtual-cards');
      return response.data;
    } catch (error) {
      console.error('Error fetching virtual cards:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/virtual-cards/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching virtual card with id ${id}:`, error);
      throw error;
    }
  },
  
  create: async (virtualCardData) => {
    try {
      const response = await api.post('/virtual-cards', virtualCardData);
      return response.data;
    } catch (error) {
      console.error('Error creating virtual card:', error);
      throw error;
    }
  },
  
  update: async (id, virtualCardData) => {
    try {
      const response = await api.patch(`/virtual-cards/${id}`, virtualCardData);
      return response.data;
    } catch (error) {
      console.error('Error updating virtual card:', error);
      throw error;
    }
  },
  
  activate: async (id) => {
    try {
      const response = await api.post(`/virtual-cards/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error('Error activating virtual card:', error);
      throw error;
    }
  },
  
  deactivate: async (id) => {
    try {
      const response = await api.post(`/virtual-cards/${id}/deactivate`);
      return response.data;
    } catch (error) {
      console.error('Error deactivating virtual card:', error);
      throw error;
    }
  },
  
  addFunds: async (id, amount, paymentSource) => {
    try {
      const response = await api.post(`/virtual-cards/${id}/add-funds`, {
        amount,
        paymentSource
      });
      return response.data;
    } catch (error) {
      console.error('Error adding funds to virtual card:', error);
      throw error;
    }
  },
};

// API functions for transactions
export const transactionsApi = {
  getByVirtualCard: async (virtualCardId) => {
    try {
      const response = await api.get(`/virtual-cards/${virtualCardId}/transactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
};

// API functions for Stripe integration
export const stripeApi = {
  createPaymentIntent: async (amount) => {
    try {
      const response = await api.post('/create-payment-intent', { amount });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },
  
  processMultiSourcePayment: async (paymentData) => {
    try {
      const response = await api.post('/process-multi-source-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error processing multi-source payment:', error);
      throw error;
    }
  },
  
  createSplitPayment: async (paymentData) => {
    try {
      const response = await api.post('/split-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating split payment:', error);
      throw error;
    }
  },
  
  // For demo/testing, simulate a multi-source payment
  processMultiSourcePaymentDemo: async (paymentData) => {
    console.log('Demo multi-source payment processing:', paymentData);
    
    // Add a slight delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the fee values from the passed data or calculate them if not provided
    const cartTotal = parseFloat(paymentData.cartTotal || 0);
    const serviceFee = paymentData.serviceFee ? 
      parseFloat(paymentData.serviceFee) : 
      parseFloat((cartTotal * 0.025).toFixed(2)); // 2.5% fee
    const totalWithFee = paymentData.totalWithFee ? 
      parseFloat(paymentData.totalWithFee) : 
      parseFloat((cartTotal + serviceFee).toFixed(2));
    
    // Generate mock card details
    const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
    const currentDate = new Date();
    const expiryYear = currentDate.getFullYear() + 3;
    const expiryMonth = currentDate.getMonth() + 1;
    
    // Create a virtual card based on the payment data
    const virtualCard = {
      id: `vc_${Math.random().toString(36).substring(2, 10)}`,
      name: 'Virtual Split Payment Card',
      cardholderName: 'Demo User',
      status: 'active',
      lastFour: lastFour,
      cardNumber: `XXXX-XXXX-XXXX-${lastFour}`,
      expiryDate: `${expiryMonth.toString().padStart(2, '0')}/${expiryYear}`,
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      balance: cartTotal,
      serviceFee: serviceFee,
      totalCharged: totalWithFee,
      createdAt: new Date().toISOString(),
      isOneTime: true,
      success: true,
      paymentSources: paymentData.sources ? paymentData.sources.map(source => ({
        id: source.id,
        type: source.type,
        originalAmount: source.originalAmount || source.amount,
        totalCharge: source.totalCharge || source.amount,
        feeContribution: source.feeContribution || 0
      })) : []
    };
    
    return virtualCard;
  },
  
  checkStatus: async () => {
    try {
      const response = await api.get('/stripe/status');
      return response.data;
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      throw error;
    }
  },
  
  testConnection: async () => {
    try {
      const response = await api.post('/create-payment-intent', { amount: 0.50 }); // Test with a small amount
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error testing Stripe connection:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to connect to Stripe' 
      };
    }
  },
};

// API functions for system settings
export const systemSettingsApi = {
  getAllSettings: async () => {
    try {
      const response = await api.get('/system-settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },
  
  getSettingsByCategory: async (category) => {
    try {
      const response = await api.get(`/system-settings/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching settings for category ${category}:`, error);
      throw error;
    }
  },
  
  getSettingByKey: async (key) => {
    try {
      const response = await api.get(`/system-settings/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching setting with key ${key}:`, error);
      throw error;
    }
  },
  
  createSetting: async (settingData) => {
    try {
      const response = await api.post('/system-settings', settingData);
      return response.data;
    } catch (error) {
      console.error('Error creating setting:', error);
      throw error;
    }
  },
  
  updateSetting: async (key, settingData) => {
    try {
      const response = await api.put(`/system-settings/${key}`, settingData);
      return response.data;
    } catch (error) {
      console.error(`Error updating setting with key ${key}:`, error);
      throw error;
    }
  },
  
  deleteSetting: async (key) => {
    try {
      const response = await api.delete(`/system-settings/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting setting with key ${key}:`, error);
      throw error;
    }
  },
  
  // Card provider configuration
  getCardProvider: async () => {
    try {
      const response = await api.get('/card-provider');
      return response.data;
    } catch (error) {
      console.error('Error fetching card provider config:', error);
      throw error;
    }
  },
  
  updateCardProvider: async (provider) => {
    try {
      const response = await api.put('/card-provider', { provider });
      return response.data;
    } catch (error) {
      console.error('Error updating card provider:', error);
      throw error;
    }
  },
  
  // Regional card providers configuration
  getRegionalCardProviders: async () => {
    try {
      const response = await api.get('/regional-card-providers');
      return response.data;
    } catch (error) {
      console.error('Error fetching regional card providers:', error);
      throw error;
    }
  },
  
  updateRegionalCardProviders: async (regionalProviders) => {
    try {
      const response = await api.put('/regional-card-providers', { regionalProviders });
      return response.data;
    } catch (error) {
      console.error('Error updating regional card providers:', error);
      throw error;
    }
  }
};

// API functions for content management
export const contentManagementApi = {
  // Page content management
  getAllPageContent: async () => {
    try {
      const response = await api.get('/content-management/pages');
      return response.data;
    } catch (error) {
      console.error('Error fetching all page content:', error);
      throw error;
    }
  },
  
  getPageContent: async (pageId) => {
    try {
      const response = await api.get(`/content-management/pages/${pageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching content for page ${pageId}:`, error);
      throw error;
    }
  },
  
  updatePageContent: async (pageId, contentData) => {
    try {
      const response = await api.put(`/content-management/pages/${pageId}`, contentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating content for page ${pageId}:`, error);
      throw error;
    }
  },
  
  createPageContent: async (contentData) => {
    try {
      const response = await api.post('/content-management/pages', contentData);
      return response.data;
    } catch (error) {
      console.error('Error creating page content:', error);
      throw error;
    }
  },
  
  // Section content management
  getSectionsByPage: async (pageId) => {
    try {
      const response = await api.get(`/content-management/pages/${pageId}/sections`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sections for page ${pageId}:`, error);
      throw error;
    }
  },
  
  getSectionContent: async (pageId, sectionId) => {
    try {
      const response = await api.get(`/content-management/pages/${pageId}/sections/${sectionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching section ${sectionId} content:`, error);
      throw error;
    }
  },
  
  createSectionContent: async (pageId, sectionData) => {
    try {
      const response = await api.post(`/content-management/pages/${pageId}/sections`, sectionData);
      return response.data;
    } catch (error) {
      console.error(`Error creating section for page ${pageId}:`, error);
      throw error;
    }
  },
  
  updateSectionContent: async (pageId, sectionId, contentData) => {
    try {
      const response = await api.put(`/content-management/pages/${pageId}/sections/${sectionId}`, contentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating section ${sectionId} content:`, error);
      throw error;
    }
  },
  
  deleteSectionContent: async (pageId, sectionId) => {
    try {
      const response = await api.delete(`/content-management/pages/${pageId}/sections/${sectionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting section ${sectionId}:`, error);
      throw error;
    }
  },
  
  // Theme and styling management
  getAllThemes: async () => {
    try {
      const response = await api.get('/content-management/themes');
      return response.data;
    } catch (error) {
      console.error('Error fetching all themes:', error);
      throw error;
    }
  },
  
  getActiveTheme: async () => {
    try {
      const response = await api.get('/content-management/themes/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active theme:', error);
      throw error;
    }
  },
  
  getTheme: async (themeId) => {
    try {
      const response = await api.get(`/content-management/themes/${themeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching theme ${themeId}:`, error);
      throw error;
    }
  },
  
  createTheme: async (themeData) => {
    try {
      const response = await api.post('/content-management/themes', themeData);
      return response.data;
    } catch (error) {
      console.error('Error creating theme:', error);
      throw error;
    }
  },
  
  updateTheme: async (themeId, themeData) => {
    try {
      const response = await api.put(`/content-management/themes/${themeId}`, themeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating theme ${themeId}:`, error);
      throw error;
    }
  },
  
  activateTheme: async (themeId) => {
    try {
      const response = await api.post(`/content-management/themes/${themeId}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Error activating theme ${themeId}:`, error);
      throw error;
    }
  },
  
  deleteTheme: async (themeId) => {
    try {
      const response = await api.delete(`/content-management/themes/${themeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting theme ${themeId}:`, error);
      throw error;
    }
  },
  
  // Image and media management
  uploadMedia: async (formData) => {
    try {
      const response = await api.post('/content-management/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  },
  
  getAllMedia: async () => {
    try {
      const response = await api.get('/content-management/media');
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  },
  
  deleteMedia: async (mediaId) => {
    try {
      const response = await api.delete(`/content-management/media/${mediaId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting media ${mediaId}:`, error);
      throw error;
    }
  }
};

export default api;
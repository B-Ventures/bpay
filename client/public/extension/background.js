// Background script for bPay extension
console.log('bPay background script loaded');

// API endpoint base URL
const API_BASE_URL = 'https://getbpay.com/api'; // Replace with your actual API base URL

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = API_BASE_URL + endpoint;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' // Include cookies for authentication
  };
  
  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Check if user is authenticated
async function checkAuthentication() {
  try {
    // This endpoint should return user data if authenticated, or 401 if not
    const userData = await apiRequest('/auth/status');
    return { isAuthenticated: true, user: userData };
  } catch (error) {
    return { isAuthenticated: false, error: error.message };
  }
}

// Get payment methods for authenticated user
async function getPaymentMethods() {
  try {
    const paymentMethods = await apiRequest('/payment-methods');
    return paymentMethods;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
}

// Get virtual cards for authenticated user
async function getVirtualCards() {
  try {
    const virtualCards = await apiRequest('/virtual-cards');
    return virtualCards;
  } catch (error) {
    console.error('Error fetching virtual cards:', error);
    throw error;
  }
}

// Create a virtual card with specified funding sources
async function createVirtualCard(cardData) {
  try {
    const response = await apiRequest('/virtual-cards', 'POST', cardData);
    return response;
  } catch (error) {
    console.error('Error creating virtual card:', error);
    throw error;
  }
}

// Track checkout pages user has visited
let detectedCheckouts = [];

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('bPay extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.set({
    detectedCheckouts: [],
    settings: {
      autoPrompt: true, // Whether to automatically prompt for split payment
      defaultCardName: 'Online Purchase' // Default name for virtual cards
    }
  });
  
  // Add context menu option for split payment
  chrome.contextMenus.create({
    id: 'split-payment',
    title: 'Split payment with bPay',
    contexts: ['page']
  });
});

// Store detected checkout page
function storeCheckoutPage(url) {
  // Add to in-memory array
  if (!detectedCheckouts.includes(url)) {
    detectedCheckouts.push(url);
    
    // Update persistent storage
    chrome.storage.local.set({ detectedCheckouts });
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.type);
  
  if (message.type === 'PAYMENT_FORM_DETECTED') {
    // Store the detected checkout page
    storeCheckoutPage(message.url);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'GET_PAYMENT_METHODS') {
    // Check if user is authenticated first
    checkAuthentication().then(({ isAuthenticated }) => {
      if (!isAuthenticated) {
        sendResponse({
          success: false,
          error: 'User not authenticated. Please log in to bPay.'
        });
        return;
      }
      
      // Get payment methods for the user
      getPaymentMethods()
        .then(paymentMethods => {
          sendResponse({ success: true, paymentMethods });
        })
        .catch(error => {
          sendResponse({
            success: false,
            error: error.message || 'Failed to fetch payment methods'
          });
        });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.type === 'GET_VIRTUAL_CARDS') {
    // Check if user is authenticated first
    checkAuthentication().then(({ isAuthenticated }) => {
      if (!isAuthenticated) {
        sendResponse({
          success: false,
          error: 'User not authenticated. Please log in to bPay.'
        });
        return;
      }
      
      // Get virtual cards for the user
      getVirtualCards()
        .then(virtualCards => {
          sendResponse({ success: true, virtualCards });
        })
        .catch(error => {
          sendResponse({
            success: false,
            error: error.message || 'Failed to fetch virtual cards'
          });
        });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.type === 'CREATE_VIRTUAL_CARD') {
    // Create virtual card with the specified data
    createVirtualCard(message.data)
      .then(virtualCard => {
        sendResponse({
          success: true,
          virtualCard
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message || 'Failed to create virtual card'
        });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.type === 'CHECK_AUTH_STATUS') {
    checkAuthentication()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          isAuthenticated: false,
          error: error.message || 'Failed to check authentication status'
        });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.type === 'OPEN_DASHBOARD') {
    // Open the bPay dashboard in a new tab
    chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/dashboard` });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'OPEN_CARD_DETAILS') {
    // Open card details in dashboard
    const cardId = message.data?.cardId;
    if (cardId) {
      chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/virtual-card/${cardId}` });
    } else {
      chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/dashboard` });
    }
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'OPEN_BPAY_POPUP') {
    // Open the extension popup
    chrome.action.openPopup();
    sendResponse({ success: true });
    return true;
  }
  
  // If we get here, we didn't handle the message
  return false;
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'split-payment') {
    // Send message to content script to open split payment modal
    chrome.tabs.sendMessage(tab.id, { type: 'OPEN_SPLIT_PAYMENT_MODAL' });
  }
});
// Popup script for bPay extension

// API endpoint base URL (should match the one in background.js)
const API_BASE_URL = 'https://getbpay.com/api';

// DOM elements
const loadingContainer = document.getElementById('loading-container');
const contentContainer = document.getElementById('content-container');
const notAuthenticatedContainer = document.getElementById('not-authenticated-container');
const authenticatedContainer = document.getElementById('authenticated-container');
const loginButton = document.getElementById('login-button');
const dashboardButton = document.getElementById('dashboard-button');
const settingsButton = document.getElementById('settings-button');
const splitPaymentButton = document.getElementById('split-payment-button');
const addPaymentMethodButton = document.getElementById('add-payment-method-button');
const recentCardsContainer = document.getElementById('recent-cards-container');
const paymentMethodsContainer = document.getElementById('payment-methods-container');

// Helper function to show an error notification
function showError(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  contentContainer.insertBefore(notification, contentContainer.firstChild);
  
  // Hide loading and show content
  loadingContainer.style.display = 'none';
  contentContainer.style.display = 'block';
}

// Check authentication status
async function checkAuthStatus() {
  try {
    // Send message to background script
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH_STATUS' }, (response) => {
      loadingContainer.style.display = 'none';
      contentContainer.style.display = 'block';
      
      if (response && response.isAuthenticated) {
        // User is authenticated
        notAuthenticatedContainer.style.display = 'none';
        authenticatedContainer.style.display = 'block';
        
        // Load user data
        loadUserData();
      } else {
        // User is not authenticated
        notAuthenticatedContainer.style.display = 'block';
        authenticatedContainer.style.display = 'none';
      }
    });
  } catch (error) {
    showError('Failed to check authentication status. Please try again later.');
  }
}

// Load user data (recent cards and payment methods)
async function loadUserData() {
  // Load recent virtual cards
  chrome.runtime.sendMessage({ type: 'GET_VIRTUAL_CARDS' }, (response) => {
    if (response && response.success) {
      renderVirtualCards(response.virtualCards);
    } else {
      // Show error or empty state
      recentCardsContainer.innerHTML = `
        <div class="empty-state">
          <p>Failed to load virtual cards</p>
        </div>
      `;
    }
  });
  
  // Load payment methods
  chrome.runtime.sendMessage({ type: 'GET_PAYMENT_METHODS' }, (response) => {
    if (response && response.success) {
      renderPaymentMethods(response.paymentMethods);
    } else {
      // Show error or empty state
      paymentMethodsContainer.innerHTML = `
        <div class="empty-state">
          <p>Failed to load payment methods</p>
          <a href="#" id="add-payment-method-button" class="button">Add Payment Method</a>
        </div>
      `;
      
      // Reattach event listener
      document.getElementById('add-payment-method-button').addEventListener('click', handleAddPaymentMethod);
    }
  });
}

// Render virtual cards
function renderVirtualCards(cards) {
  if (!cards || cards.length === 0) {
    recentCardsContainer.innerHTML = `
      <div class="empty-state">
        <p>No recent cards</p>
      </div>
    `;
    return;
  }
  
  // Clear container
  recentCardsContainer.innerHTML = '';
  
  // Show only the 3 most recent cards
  const recentCards = cards.slice(0, 3);
  
  // Create card elements
  recentCards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    
    // Format expiry date if available
    const expiryDate = card.expiryDate || `${card.expiryMonth}/${card.expiryYear.toString().slice(-2)}`;
    
    // Format balance
    const balance = typeof card.balance === 'number' 
      ? `$${(card.balance / 100).toFixed(2)}` 
      : '$0.00';
      
    // Check if it's a split payment card (has multiple payment sources)
    const isSplitPayment = card.paymentSources && card.paymentSources.length > 1;
    
    // Calculate service fee if available
    let feeDisplay = '';
    if (card.serviceFee) {
      const fee = typeof card.serviceFee === 'number'
        ? `$${(card.serviceFee / 100).toFixed(2)}`
        : `$${(parseFloat(card.serviceFee)).toFixed(2)}`;
        
      feeDisplay = `<div class="card-subtitle" style="color: #059669;">Service fee: ${fee}</div>`;
    }
    
    // Add a badge for split payment cards
    const splitBadge = isSplitPayment 
      ? `<div style="position: absolute; top: 10px; right: 10px; background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">Split Payment</div>` 
      : '';
    
    cardElement.innerHTML = `
      <div style="position: relative;">
        ${splitBadge}
        <div class="card-title">${card.name}</div>
        <div class="card-subtitle">Card ending in ${card.lastFour || '****'}</div>
        <div class="card-subtitle">Expires: ${expiryDate}</div>
        ${feeDisplay}
        <div class="balance">Balance: ${balance}</div>
      </div>
    `;
    
    // Add click event to view card details
    cardElement.addEventListener('click', () => {
      chrome.runtime.sendMessage({ 
        type: 'OPEN_CARD_DETAILS', 
        data: { cardId: card.id } 
      });
    });
    
    recentCardsContainer.appendChild(cardElement);
  });
}

// Render payment methods
function renderPaymentMethods(methods) {
  if (!methods || methods.length === 0) {
    paymentMethodsContainer.innerHTML = `
      <div class="empty-state">
        <p>No payment methods found</p>
        <a href="#" id="add-payment-method-button" class="button">Add Payment Method</a>
      </div>
    `;
    
    // Reattach event listener
    document.getElementById('add-payment-method-button').addEventListener('click', handleAddPaymentMethod);
    return;
  }
  
  // Clear container
  paymentMethodsContainer.innerHTML = '';
  
  // Create payment method elements
  methods.forEach(method => {
    const methodElement = document.createElement('div');
    methodElement.className = 'card';
    
    // Get icon based on method type
    let iconEmoji = '💳';
    if (method.type === 'bank_account') iconEmoji = '🏦';
    if (method.type === 'wallet') iconEmoji = '👛';
    
    // Get method title
    let title = method.name || 'Payment Method';
    if (method.type === 'card' && method.brand && method.lastFour) {
      title = `${method.brand} ending in ${method.lastFour}`;
    }
    
    // Get method subtitle
    let subtitle = '';
    if (method.type === 'card' && method.expiryMonth && method.expiryYear) {
      subtitle = `Expires: ${method.expiryMonth}/${method.expiryYear.toString().slice(-2)}`;
    } else if (method.type === 'bank_account') {
      subtitle = 'Bank Account';
    } else if (method.type === 'wallet') {
      subtitle = 'Digital Wallet';
    }
    
    methodElement.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="font-size: 24px; margin-right: 12px;">${iconEmoji}</div>
        <div>
          <div class="card-title">${title}</div>
          ${subtitle ? `<div class="card-subtitle">${subtitle}</div>` : ''}
        </div>
      </div>
    `;
    
    paymentMethodsContainer.appendChild(methodElement);
  });
  
  // Add 'Add Payment Method' button
  const addButtonContainer = document.createElement('div');
  addButtonContainer.style.marginTop = '12px';
  addButtonContainer.innerHTML = `
    <a href="#" id="add-payment-method-button" class="button secondary">Add Payment Method</a>
  `;
  
  paymentMethodsContainer.appendChild(addButtonContainer);
  
  // Attach event listener
  document.getElementById('add-payment-method-button').addEventListener('click', handleAddPaymentMethod);
}

// Event handler for login button
function handleLogin() {
  chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/login` });
}

// Event handler for dashboard button
function handleOpenDashboard() {
  chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/dashboard` });
}

// Event handler for settings button
function handleOpenSettings() {
  chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/settings` });
}

// Event handler for add payment method button
function handleAddPaymentMethod() {
  chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/add-payment-method` });
}

// Event handler for split payment button
function handleSplitPayment() {
  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      // Send message to content script to open split payment modal
      chrome.tabs.sendMessage(tabs[0].id, { type: 'OPEN_SPLIT_PAYMENT_MODAL' }, (response) => {
        // If content script is not loaded (no response), open the split payment page
        if (!response) {
          chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/split-payment` });
        }
      });
    } else {
      // If no active tab, open the split payment page
      chrome.tabs.create({ url: `${API_BASE_URL.replace('/api', '')}/split-payment` });
    }
    
    // Close the popup
    window.close();
  });
}

// Initialize event listeners
function initEventListeners() {
  if (loginButton) loginButton.addEventListener('click', handleLogin);
  if (dashboardButton) dashboardButton.addEventListener('click', handleOpenDashboard);
  if (settingsButton) settingsButton.addEventListener('click', handleOpenSettings);
  if (splitPaymentButton) splitPaymentButton.addEventListener('click', handleSplitPayment);
  if (addPaymentMethodButton) addPaymentMethodButton.addEventListener('click', handleAddPaymentMethod);
}

// Initialize the popup
function init() {
  initEventListeners();
  checkAuthStatus();
}

// Start the popup initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);
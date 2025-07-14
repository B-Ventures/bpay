// Content script for bPay extension
console.log('bPay content script loaded');

// CSS styles for the split payment modal
const modalStyles = `
.gbp-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.gbp-modal {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.gbp-modal-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gbp-modal-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.gbp-modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #6b7280;
}

.gbp-modal-body {
  padding: 16px;
}

.gbp-form-group {
  margin-bottom: 16px;
}

.gbp-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}

.gbp-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

.gbp-payment-method {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gbp-payment-method-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gbp-payment-method-icon {
  font-size: 24px;
}

.gbp-payment-method-details h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.gbp-payment-method-details p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.gbp-payment-method-amount {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gbp-percent-toggle {
  display: inline-flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 4px;
  padding: 2px;
  margin-left: 8px;
}

.gbp-percent-option {
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
}

.gbp-percent-option.active {
  background-color: #3b82f6;
  color: white;
}

.gbp-amount-input {
  width: 80px;
  text-align: right;
}

.gbp-summary {
  background-color: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 20px;
}

.gbp-summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.gbp-summary-row.total {
  font-weight: 600;
  padding-top: 6px;
  margin-top: 6px;
  border-top: 1px solid #e5e7eb;
}

.gbp-error {
  color: #ef4444;
  font-size: 14px;
  margin-top: 8px;
}

.gbp-button {
  display: block;
  width: 100%;
  padding: 10px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.gbp-button:hover {
  background-color: #2563eb;
}

.gbp-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.gbp-button.secondary {
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.gbp-button.secondary:hover {
  background-color: #f9fafb;
}

.gbp-modal-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.gbp-loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.gbp-spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: gbp-spin 1s linear infinite;
}

@keyframes gbp-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.gbp-success-animation {
  text-align: center;
  padding: 24px;
}

.gbp-success-icon {
  display: inline-block;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #10b981;
  color: white;
  font-size: 36px;
  line-height: 64px;
  margin-bottom: 16px;
}

.gbp-success-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.gbp-success-message {
  color: #6b7280;
  margin-bottom: 24px;
}

.gbp-card-details {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}

.gbp-card-row {
  display: flex;
  margin-bottom: 8px;
}

.gbp-card-label {
  width: 130px;
  font-size: 14px;
  color: #6b7280;
}

.gbp-card-value {
  font-weight: 500;
  font-size: 14px;
}

.gbp-card-number {
  letter-spacing: 1px;
}
`;

// Function to detect payment forms on the page
function detectPaymentForm() {
  const creditCardFields = document.querySelectorAll('input[autocomplete*="cc-number"], input[name*="card"], input[name*="credit"]');
  const checkoutKeywords = ['checkout', 'payment', 'billing', 'cart', 'order'];
  
  // Check URL for checkout keywords
  const currentUrl = window.location.href.toLowerCase();
  const isCheckoutUrl = checkoutKeywords.some(keyword => currentUrl.includes(keyword));
  
  // Check page title for checkout keywords
  const pageTitle = document.title.toLowerCase();
  const isCheckoutTitle = checkoutKeywords.some(keyword => pageTitle.includes(keyword));
  
  return creditCardFields.length > 0 || isCheckoutUrl || isCheckoutTitle;
}

// Function to extract total amount from the page
function extractTotalAmount() {
  // Common selectors for total amount elements
  const selectors = [
    // Price selectors - look for elements that likely contain the total price
    'span[data-testid*="total"], div[data-testid*="total"]',
    '.total-amount, .order-total, .grand-total, .cart-total',
    '[class*="total" i]:not([class*="subtotal" i])',
    '[id*="total" i]:not([id*="subtotal" i])',
    'tr.total td:last-child, .total-row .total-value',
    
    // Additional common patterns
    '.checkout-total',
    '.payment-due',
    '.price-total',
    '.summary-total'
  ];

  let totalElement = null;
  let totalText = '';

  // Try each selector until we find a match
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent.trim();
      
      // Look for currency symbols and numbers
      if (/[$€£¥]\s*[0-9,.]+|[0-9,.]+\s*[$€£¥]/.test(text)) {
        totalElement = element;
        totalText = text;
        break;
      }
    }
    
    if (totalElement) break;
  }

  // If we found a total element, extract the amount
  if (totalElement) {
    // Extract digits and decimal point, ignore currency symbols and other characters
    const amountMatch = totalText.match(/[0-9,.]+/g);
    if (amountMatch && amountMatch.length > 0) {
      // Get the last match as it's more likely to be the total
      let amount = amountMatch[amountMatch.length - 1];
      
      // Replace commas with nothing (for thousands separators)
      amount = amount.replace(/,/g, '');
      
      // Convert to number
      return parseFloat(amount);
    }
  }
  
  return null;
}

// Function to find form fields for auto-filling
function findCardFormFields() {
  const fields = {
    cardNumber: null,
    cardName: null,
    expiryMonth: null,
    expiryYear: null,
    expiry: null,  // Combined MM/YY field
    cvv: null
  };
  
  // Common patterns for credit card number fields
  const cardNumberPatterns = [
    'input[autocomplete="cc-number"]',
    'input[name*="card_number"]',
    'input[name*="cardnumber"]',
    'input[name*="pan"]',
    'input[id*="card_number"]',
    'input[id*="cardnumber"]',
    'input[placeholder*="card number" i]',
    'input[aria-label*="card number" i]'
  ];
  
  // Common patterns for cardholder name fields
  const cardNamePatterns = [
    'input[autocomplete="cc-name"]',
    'input[name*="card_name"]',
    'input[name*="cardholder"]',
    'input[name*="name_on_card"]',
    'input[id*="card_name"]',
    'input[id*="cardholder"]',
    'input[placeholder*="name on card" i]',
    'input[aria-label*="cardholder" i]'
  ];
  
  // Common patterns for expiry month fields
  const expiryMonthPatterns = [
    'input[autocomplete="cc-exp-month"]',
    'input[name*="exp_month"]',
    'input[name*="expiry_month"]',
    'select[name*="exp_month"]',
    'select[name*="expiry_month"]'
  ];
  
  // Common patterns for expiry year fields
  const expiryYearPatterns = [
    'input[autocomplete="cc-exp-year"]',
    'input[name*="exp_year"]',
    'input[name*="expiry_year"]',
    'select[name*="exp_year"]',
    'select[name*="expiry_year"]'
  ];
  
  // Common patterns for combined expiry fields (MM/YY)
  const expiryPatterns = [
    'input[autocomplete="cc-exp"]',
    'input[name*="expiry"]',
    'input[name*="expiration"]',
    'input[id*="expiry"]',
    'input[id*="expiration"]',
    'input[placeholder*="MM / YY" i]',
    'input[placeholder*="expiry" i]'
  ];
  
  // Common patterns for CVV fields
  const cvvPatterns = [
    'input[autocomplete="cc-csc"]',
    'input[name*="cvc"]',
    'input[name*="cvv"]',
    'input[name*="security_code"]',
    'input[name*="csc"]',
    'input[id*="cvc"]',
    'input[id*="cvv"]',
    'input[placeholder*="cvv" i]',
    'input[placeholder*="security code" i]'
  ];
  
  // Try to find each field
  for (const pattern of cardNumberPatterns) {
    const field = document.querySelector(pattern);
    if (field) {
      fields.cardNumber = field;
      break;
    }
  }
  
  for (const pattern of cardNamePatterns) {
    const field = document.querySelector(pattern);
    if (field) {
      fields.cardName = field;
      break;
    }
  }
  
  for (const pattern of expiryMonthPatterns) {
    const field = document.querySelector(pattern);
    if (field) {
      fields.expiryMonth = field;
      break;
    }
  }
  
  for (const pattern of expiryYearPatterns) {
    const field = document.querySelector(pattern);
    if (field) {
      fields.expiryYear = field;
      break;
    }
  }
  
  for (const pattern of expiryPatterns) {
    const field = document.querySelector(pattern);
    if (field) {
      fields.expiry = field;
      break;
    }
  }
  
  for (const pattern of cvvPatterns) {
    const field = document.querySelector(pattern);
    if (field) {
      fields.cvv = field;
      break;
    }
  }
  
  return fields;
}

// Function to fill card details into form fields
function fillCardDetails(cardDetails) {
  const fields = findCardFormFields();
  
  // Fill card number
  if (fields.cardNumber && cardDetails.cardNumber) {
    fields.cardNumber.value = cardDetails.cardNumber;
    // Trigger events for the field
    fields.cardNumber.dispatchEvent(new Event('input', { bubbles: true }));
    fields.cardNumber.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Fill cardholder name
  if (fields.cardName && cardDetails.cardholderName) {
    fields.cardName.value = cardDetails.cardholderName;
    fields.cardName.dispatchEvent(new Event('input', { bubbles: true }));
    fields.cardName.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Fill expiry date
  if (fields.expiryMonth && fields.expiryYear && cardDetails.expiryDate) {
    const [month, year] = cardDetails.expiryDate.split('/');
    
    fields.expiryMonth.value = month;
    fields.expiryMonth.dispatchEvent(new Event('input', { bubbles: true }));
    fields.expiryMonth.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Some sites expect 2-digit years, others expect 4-digit years
    if (fields.expiryYear.maxLength === 2 || fields.expiryYear.size === 2) {
      fields.expiryYear.value = year;
    } else {
      fields.expiryYear.value = '20' + year;
    }
    fields.expiryYear.dispatchEvent(new Event('input', { bubbles: true }));
    fields.expiryYear.dispatchEvent(new Event('change', { bubbles: true }));
  } 
  // Combined expiry field
  else if (fields.expiry && cardDetails.expiryDate) {
    fields.expiry.value = cardDetails.expiryDate;
    fields.expiry.dispatchEvent(new Event('input', { bubbles: true }));
    fields.expiry.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Fill CVV
  if (fields.cvv && cardDetails.cvv) {
    fields.cvv.value = cardDetails.cvv;
    fields.cvv.dispatchEvent(new Event('input', { bubbles: true }));
    fields.cvv.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Function to create the split payment modal
function createSplitPaymentModal(totalAmount) {
  // Create style element for our modal
  const styleElement = document.createElement('style');
  styleElement.textContent = modalStyles;
  document.head.appendChild(styleElement);
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'gbp-modal-overlay';
  
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'gbp-modal';
  
  // Create modal header
  const header = document.createElement('div');
  header.className = 'gbp-modal-header';
  
  const title = document.createElement('h3');
  title.className = 'gbp-modal-title';
  title.textContent = 'Split Payment with bPay';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'gbp-modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create modal body with loading state
  const body = document.createElement('div');
  body.className = 'gbp-modal-body';
  
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'gbp-loading-indicator';
  loadingIndicator.innerHTML = '<div class="gbp-spinner"></div>';
  
  body.appendChild(loadingIndicator);
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(body);
  
  // Add modal to page
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fetch payment methods from the background script
  chrome.runtime.sendMessage({ type: 'GET_PAYMENT_METHODS' }, (response) => {
    if (!response || !response.success) {
      showModalError(body, 'Failed to load payment methods. Please try again later.');
      return;
    }
    
    // Handle case when no payment methods are available
    if (!response.paymentMethods || response.paymentMethods.length === 0) {
      showEmptyPaymentMethodsView(body, overlay);
      return;
    }
    
    // Show the payment selection view
    showPaymentSelectionView(body, overlay, response.paymentMethods, totalAmount);
  });
}

// Show error message in modal
function showModalError(bodyElement, errorMessage) {
  bodyElement.innerHTML = `
    <div class="gbp-error" style="text-align:center; padding:24px;">
      <p>${errorMessage}</p>
      <button class="gbp-button" style="margin-top:16px;">Close</button>
    </div>
  `;
  
  bodyElement.querySelector('.gbp-button').addEventListener('click', () => {
    const overlay = document.querySelector('.gbp-modal-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  });
}

// Show empty payment methods view
function showEmptyPaymentMethodsView(bodyElement, overlayElement) {
  bodyElement.innerHTML = `
    <div style="text-align:center; padding:24px;">
      <p>You don't have any payment methods set up yet.</p>
      <button id="gbp-add-payment-method" class="gbp-button" style="margin-top:16px;">Add Payment Method</button>
      <button id="gbp-close-modal" class="gbp-button secondary" style="margin-top:8px;">Cancel</button>
    </div>
  `;
  
  bodyElement.querySelector('#gbp-add-payment-method').addEventListener('click', () => {
    // Open the bPay dashboard in a new tab
    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
    document.body.removeChild(overlayElement);
  });
  
  bodyElement.querySelector('#gbp-close-modal').addEventListener('click', () => {
    document.body.removeChild(overlayElement);
  });
}

// Show payment selection view
function showPaymentSelectionView(bodyElement, overlayElement, paymentMethods, totalAmount) {
  // Initialize paymentMethods with selection and amount properties
  const methods = paymentMethods.map(method => ({
    ...method,
    isSelected: false,
    amount: 0,
    amountType: 'fixed' // 'fixed' or 'percent'
  }));
  
  // Format the total amount for display
  const formattedTotal = totalAmount.toFixed(2);
  
  // Update the modal body with payment selection form
  bodyElement.innerHTML = `
    <div class="gbp-form-group">
      <label class="gbp-label">Total Amount</label>
      <input type="number" id="gbp-total-amount" class="gbp-input" value="${formattedTotal}" step="0.01" min="0.01">
    </div>
    
    <div class="gbp-form-group">
      <label class="gbp-label">Virtual Card Name</label>
      <input type="text" id="gbp-card-name" class="gbp-input" placeholder="Online Purchase">
    </div>
    
    <div class="gbp-form-group">
      <label class="gbp-label">Select Payment Sources</label>
      <div id="gbp-payment-methods-container">
        ${methods.map((method, index) => `
          <div class="gbp-payment-method" data-index="${index}">
            <div class="gbp-payment-method-info">
              <div class="gbp-payment-method-icon">${getPaymentMethodIcon(method.type)}</div>
              <div class="gbp-payment-method-details">
                <h4>${method.name || getDefaultMethodName(method)}</h4>
                <p>${getPaymentMethodDescription(method)}</p>
              </div>
            </div>
            <div class="gbp-payment-method-amount">
              <input type="checkbox" class="gbp-method-checkbox">
              <div class="gbp-amount-container" style="display:none;">
                <input type="number" class="gbp-amount-input gbp-input" value="0" step="0.01" min="0" disabled>
                <div class="gbp-percent-toggle">
                  <div class="gbp-percent-option fixed active" data-type="fixed">$</div>
                  <div class="gbp-percent-option percent" data-type="percent">%</div>
                </div>
                <div class="gbp-slider-container" style="margin-top: 8px; width: 100%;">
                  <input type="range" class="gbp-amount-slider" min="0" max="100" value="25" style="width: 100%;">
                  <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px; text-align: center;">
                    Drag slider to adjust payment allocation
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="gbp-summary">
      <div class="gbp-summary-row">
        <span>Cart Total:</span>
        <span>$<span id="gbp-summary-cart-total">${formattedTotal}</span></span>
      </div>
      <div class="gbp-summary-row">
        <span>Service Fee (2.5%):</span>
        <span>$<span id="gbp-summary-fee">0.00</span></span>
      </div>
      <div class="gbp-summary-row total">
        <span>Total to be Charged:</span>
        <span>$<span id="gbp-summary-with-fee">${formattedTotal}</span></span>
      </div>
    </div>
    
    <div style="font-size: 0.85rem; color: #6b7280; margin: 12px 0; padding: 10px; background-color: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
      <i style="margin-right: 6px;">ℹ️</i> The service fee will be added to your total charged amount. Your virtual card will be loaded with the exact cart total of $<span id="gbp-card-load-amount">${formattedTotal}</span>.
    </div>
    
    <div style="font-size: 0.85rem; color: #6b7280; margin: 12px 0; padding: 10px; background-color: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
      <i style="margin-right: 6px;">💡</i> You can customize your payment allocation by selecting multiple payment methods and adjusting the amount for each using the slider or input field. Use the $ or % toggle to switch between fixed amounts and percentages.
    </div>
    
    <div class="gbp-summary" style="margin-top: 10px;">
      <div class="gbp-summary-row">
        <span>Allocated:</span>
        <span>$<span id="gbp-summary-allocated">0.00</span></span>
      </div>
      <div class="gbp-summary-row">
        <span>Remaining:</span>
        <span>$<span id="gbp-summary-remaining">${formattedTotal}</span></span>
      </div>
    </div>
    
    <div id="gbp-error-message" class="gbp-error" style="display:none;"></div>
  `;
  
  // Add modal footer with action buttons
  const footer = document.createElement('div');
  footer.className = 'gbp-modal-footer';
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'gbp-button secondary';
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(overlayElement);
  });
  
  const createButton = document.createElement('button');
  createButton.className = 'gbp-button';
  createButton.textContent = 'Create Virtual Card';
  createButton.disabled = true; // Disabled until valid allocation
  
  footer.appendChild(cancelButton);
  footer.appendChild(createButton);
  
  // Add footer to modal
  overlayElement.querySelector('.gbp-modal').appendChild(footer);
  
  // Set up event listeners for the form
  setupPaymentSelectionListeners(methods, createButton);
  
  // Handle create virtual card button click
  createButton.addEventListener('click', () => {
    // Show loading state
    bodyElement.innerHTML = `
      <div class="gbp-loading-indicator">
        <div class="gbp-spinner"></div>
        <p style="margin-left:12px;">Creating your virtual card...</p>
      </div>
    `;
    
    // Get selected payment methods with their amounts
    const selectedMethods = methods.filter(method => method.isSelected && method.amount > 0);
    
    // Get total amount and card name
    const totalAmountInput = document.getElementById('gbp-total-amount');
    const cardNameInput = document.getElementById('gbp-card-name');
    
    // Calculate real amounts
    const cartTotal = parseFloat(totalAmountInput.value);
    const serviceFeePercent = 2.5;
    const serviceFee = (cartTotal * serviceFeePercent / 100);
    const totalWithFee = cartTotal + serviceFee;
    
    const cardName = cardNameInput.value || 'Online Purchase';
    
    // Calculate fee distribution across payment methods
    const methodsWithFees = calculateFeeDistribution(methods, cartTotal, serviceFee);
    
    // Prepare payment sources data with fee information
    const paymentSources = methodsWithFees.map(method => ({
      id: method.id,
      type: method.type,
      originalAmount: method.originalAmount,
      feeContribution: method.feeContribution,
      totalCharge: method.totalCharge,
      amount: method.totalCharge, // Use totalCharge as the amount to ensure backend respects our allocation
      amountType: method.amountType,
      // Add percentage for more consistent tracking of allocations across platforms
      percentage: method.percentage || (cartTotal > 0 ? (method.originalAmount / cartTotal * 100) : 0)
    }));
    
    // Request to create virtual card
    chrome.runtime.sendMessage({
      type: 'CREATE_VIRTUAL_CARD',
      data: {
        name: cardName,
        amount: cartTotal, // The actual amount to load on card (without fee)
        totalCharged: totalWithFee, // Total amount charged to payment methods (with fee)
        serviceFee: serviceFee, // The service fee amount
        paymentSources: paymentSources
      }
    }, (response) => {
      if (!response || !response.success) {
        showModalError(bodyElement, response?.error || 'Failed to create virtual card. Please try again.');
        return;
      }
      
      // Show success view with card details
      showCardCreatedSuccessView(bodyElement, overlayElement, response.virtualCard);
    });
  });
}

// Set up event listeners for payment selection
function setupPaymentSelectionListeners(methods, createButton) {
  // Get total amount input and add change listener
  const totalAmountInput = document.getElementById('gbp-total-amount');
  totalAmountInput.addEventListener('input', () => updateSummary(methods));
  
  // Add listeners to each payment method
  document.querySelectorAll('.gbp-payment-method').forEach(methodEl => {
    const index = parseInt(methodEl.dataset.index);
    const checkbox = methodEl.querySelector('.gbp-method-checkbox');
    const amountContainer = methodEl.querySelector('.gbp-amount-container');
    const amountInput = methodEl.querySelector('.gbp-amount-input');
    const amountSlider = methodEl.querySelector('.gbp-amount-slider');
    const fixedOption = methodEl.querySelector('.gbp-percent-option.fixed');
    const percentOption = methodEl.querySelector('.gbp-percent-option.percent');
    
    // Toggle selection
    checkbox.addEventListener('change', () => {
      methods[index].isSelected = checkbox.checked;
      amountContainer.style.display = checkbox.checked ? 'block' : 'none';
      
      if (checkbox.checked) {
        amountInput.disabled = false;
        
        // Set a default amount if currently 0
        if (methods[index].amount === 0) {
          const cartTotal = parseFloat(totalAmountInput.value);
          const serviceFeePercent = 2.5;
          const serviceFee = (cartTotal * serviceFeePercent / 100);
          const totalWithFee = cartTotal + serviceFee;
          
          const remainingAmount = calculateRemainingAmount(methods, totalWithFee);
          
          // Set a reasonable starting amount, not the entire remaining amount
          // This allows users to add multiple payment methods and adjust amounts manually
          if (methods[index].amountType === 'fixed') {
            // Start with a small fraction of the remaining amount, encouraging custom allocation
            const defaultAmount = remainingAmount * 0.25; // Start with 25% of remaining
            methods[index].amount = defaultAmount;
            amountInput.value = defaultAmount.toFixed(2);
            
            // Update slider with percentage equivalent
            if (amountSlider) {
              const percentage = Math.min(100, Math.round((defaultAmount / totalWithFee) * 100));
              amountSlider.value = percentage;
            }
          } else {
            // Start with a percentage that encourages adding multiple payment methods
            const percent = Math.min(25, Math.round((remainingAmount / totalWithFee) * 25));
            methods[index].amount = percent;
            amountInput.value = percent;
            
            // Update slider with percentage
            if (amountSlider) {
              amountSlider.value = percent;
            }
          }
        }
      } else {
        amountInput.disabled = true;
        methods[index].amount = 0;
        amountInput.value = '0';
      }
      
      updateSummary(methods);
    });
    
    // Update amount on input
    amountInput.addEventListener('input', () => {
      methods[index].amount = parseFloat(amountInput.value) || 0;
      
      // Update slider value if in percentage mode
      if (methods[index].amountType === 'percent' && amountSlider) {
        amountSlider.value = methods[index].amount;
      } else if (amountSlider) {
        // Calculate percentage for slider in fixed mode
        const totalAmount = parseFloat(totalAmountInput.value);
        if (totalAmount > 0) {
          const percentage = (methods[index].amount / totalAmount) * 100;
          amountSlider.value = Math.min(100, Math.round(percentage));
        }
      }
      
      updateSummary(methods);
    });
    
    // Add slider functionality if it exists
    if (amountSlider) {
      amountSlider.addEventListener('input', () => {
        const sliderValue = parseInt(amountSlider.value);
        
        if (methods[index].amountType === 'percent') {
          // Direct percentage value
          methods[index].amount = sliderValue;
          amountInput.value = sliderValue.toString();
        } else {
          // Convert percentage to fixed amount
          const totalAmount = parseFloat(totalAmountInput.value);
          const amount = (sliderValue / 100) * totalAmount;
          methods[index].amount = amount;
          amountInput.value = amount.toFixed(2);
        }
        
        updateSummary(methods);
      });
    }
    
    // Toggle between fixed and percentage
    fixedOption.addEventListener('click', () => {
      if (methods[index].amountType !== 'fixed') {
        methods[index].amountType = 'fixed';
        fixedOption.classList.add('active');
        percentOption.classList.remove('active');
        
        // Convert percentage to fixed amount
        if (methods[index].amount > 0) {
          const totalAmount = parseFloat(totalAmountInput.value);
          methods[index].amount = (methods[index].amount / 100) * totalAmount;
          amountInput.value = methods[index].amount.toFixed(2);
          
          // Keep slider at the same percentage value
          if (amountSlider) {
            const percentage = Math.min(100, Math.round((methods[index].amount / totalAmount) * 100));
            amountSlider.value = percentage;
          }
        }
        
        updateSummary(methods);
      }
    });
    
    percentOption.addEventListener('click', () => {
      if (methods[index].amountType !== 'percent') {
        methods[index].amountType = 'percent';
        percentOption.classList.add('active');
        fixedOption.classList.remove('active');
        
        // Convert fixed amount to percentage
        if (methods[index].amount > 0) {
          const totalAmount = parseFloat(totalAmountInput.value);
          methods[index].amount = Math.round((methods[index].amount / totalAmount) * 100);
          amountInput.value = methods[index].amount;
          
          // Update slider to match percentage
          if (amountSlider) {
            amountSlider.value = methods[index].amount;
          }
        }
        
        updateSummary(methods);
      }
    });
  });
}

// Update summary section
function updateSummary(methods) {
  const cartTotal = parseFloat(document.getElementById('gbp-total-amount').value) || 0;
  
  // Calculate service fee (2.5% of cart total)
  const serviceFeePercent = 2.5;
  const serviceFee = (cartTotal * serviceFeePercent / 100);
  const totalWithFee = cartTotal + serviceFee;
  
  // Update the amounts that needs to be allocated
  const allocatedAmount = calculateAllocatedAmount(methods, totalWithFee);
  const remainingAmount = calculateRemainingAmount(methods, totalWithFee);
  
  // Update all summary elements
  document.getElementById('gbp-summary-cart-total').textContent = cartTotal.toFixed(2);
  document.getElementById('gbp-summary-fee').textContent = serviceFee.toFixed(2);
  document.getElementById('gbp-summary-with-fee').textContent = totalWithFee.toFixed(2);
  document.getElementById('gbp-card-load-amount').textContent = cartTotal.toFixed(2);
  
  document.getElementById('gbp-summary-allocated').textContent = allocatedAmount.toFixed(2);
  document.getElementById('gbp-summary-remaining').textContent = remainingAmount.toFixed(2);
  
  // Update error message if needed
  const errorElement = document.getElementById('gbp-error-message');
  const createButton = document.querySelector('.gbp-modal-footer .gbp-button:not(.secondary)');
  
  if (cartTotal <= 0) {
    errorElement.textContent = 'Please enter a valid amount';
    errorElement.style.display = 'block';
    createButton.disabled = true;
    return;
  }
  
  const selectedMethods = methods.filter(method => method.isSelected);
  if (selectedMethods.length === 0) {
    errorElement.textContent = 'Please select at least one payment method';
    errorElement.style.display = 'block';
    createButton.disabled = true;
    return;
  }
  
  // Check if allocation matches total
  if (Math.abs(remainingAmount) > 0.01) { // Allow small floating point differences
    errorElement.textContent = 'Please allocate the entire amount';
    errorElement.style.display = 'block';
    createButton.disabled = true;
    return;
  }
  
  // All checks passed
  errorElement.style.display = 'none';
  createButton.disabled = false;
}

// Calculate allocated amount
function calculateAllocatedAmount(methods, totalAmount) {
  return methods.reduce((sum, method) => {
    if (method.isSelected && method.amount > 0) {
      if (method.amountType === 'fixed') {
        return sum + method.amount;
      } else {
        return sum + ((method.amount / 100) * totalAmount);
      }
    }
    return sum;
  }, 0);
}

// Calculate remaining amount
function calculateRemainingAmount(methods, totalAmount) {
  const allocated = calculateAllocatedAmount(methods, totalAmount);
  return totalAmount - allocated;
}

// Calculate fee distribution for payment methods
function calculateFeeDistribution(methods, cartTotal, serviceFee) {
  // Calculate proportions of each method's contribution
  const selectedMethods = methods.filter(method => method.isSelected && method.amount > 0);
  const totalAllocated = calculateAllocatedAmount(selectedMethods, cartTotal);
  
  return selectedMethods.map(method => {
    let amount = method.amountType === 'fixed' 
      ? method.amount 
      : ((method.amount / 100) * cartTotal);
    
    // Calculate proportion of total and corresponding fee
    const proportion = amount / totalAllocated;
    const feeContribution = serviceFee * proportion;
    
    return {
      ...method,
      originalAmount: amount,
      feeContribution: parseFloat(feeContribution.toFixed(2)),
      totalCharge: parseFloat((amount + feeContribution).toFixed(2))
    };
  });
}

// Show card created success view
function showCardCreatedSuccessView(bodyElement, overlayElement, cardDetails) {
  bodyElement.innerHTML = `
    <div class="gbp-success-animation">
      <div class="gbp-success-icon">✓</div>
      <h3 class="gbp-success-title">Virtual Card Created!</h3>
      <p class="gbp-success-message">Your virtual card is ready to use for this purchase.</p>
      
      <div class="gbp-card-details">
        <div class="gbp-card-row">
          <div class="gbp-card-label">Card Number:</div>
          <div class="gbp-card-value gbp-card-number">${cardDetails.cardNumber}</div>
        </div>
        <div class="gbp-card-row">
          <div class="gbp-card-label">Cardholder Name:</div>
          <div class="gbp-card-value">${cardDetails.cardholderName}</div>
        </div>
        <div class="gbp-card-row">
          <div class="gbp-card-label">Expiry Date:</div>
          <div class="gbp-card-value">${cardDetails.expiryDate}</div>
        </div>
        <div class="gbp-card-row">
          <div class="gbp-card-label">CVV:</div>
          <div class="gbp-card-value">${cardDetails.cvv}</div>
        </div>
        <div class="gbp-card-row">
          <div class="gbp-card-label">Card Balance:</div>
          <div class="gbp-card-value">$${cardDetails.balance.toFixed(2)}</div>
        </div>
        <div class="gbp-card-row">
          <div class="gbp-card-label">Service Fee:</div>
          <div class="gbp-card-value">$${cardDetails.serviceFee ? parseFloat(cardDetails.serviceFee).toFixed(2) : '0.00'}</div>
        </div>
        <div class="gbp-card-row">
          <div class="gbp-card-label">Total Charged:</div>
          <div class="gbp-card-value">$${cardDetails.totalCharged ? parseFloat(cardDetails.totalCharged).toFixed(2) : (parseFloat(cardDetails.balance) + parseFloat(cardDetails.serviceFee || 0)).toFixed(2)}</div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal footer with action buttons
  const footer = document.createElement('div');
  footer.className = 'gbp-modal-footer';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'gbp-button secondary';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(overlayElement);
  });
  
  const fillButton = document.createElement('button');
  fillButton.className = 'gbp-button';
  fillButton.textContent = 'Auto-Fill Card Details';
  fillButton.addEventListener('click', () => {
    // Fill the card details in the page
    fillCardDetails(cardDetails);
    document.body.removeChild(overlayElement);
  });
  
  footer.appendChild(closeButton);
  footer.appendChild(fillButton);
  
  // Replace existing footer
  const existingFooter = overlayElement.querySelector('.gbp-modal-footer');
  if (existingFooter) {
    existingFooter.replaceWith(footer);
  } else {
    overlayElement.querySelector('.gbp-modal').appendChild(footer);
  }
}

// Helper function to get icon for payment method type
function getPaymentMethodIcon(type) {
  switch (type) {
    case 'card':
      return '💳';
    case 'bank_account':
      return '🏦';
    case 'wallet':
      return '👛';
    default:
      return '💵';
  }
}

// Helper function to get default name for payment method
function getDefaultMethodName(method) {
  if (method.type === 'card') {
    return `${method.brand || 'Card'} (${method.lastFour})`;
  } else if (method.type === 'bank_account') {
    return 'Bank Account';
  } else if (method.type === 'wallet') {
    return 'Digital Wallet';
  }
  return 'Payment Method';
}

// Helper function to get description for payment method
function getPaymentMethodDescription(method) {
  if (method.type === 'card') {
    return `${method.brand || 'Card'} ending in ${method.lastFour}`;
  } else if (method.type === 'bank_account') {
    return method.bankName || 'Bank Account';
  } else if (method.type === 'wallet') {
    return method.provider || 'Digital Wallet';
  }
  return '';
}

// Initialize and listen for messages
function initialize() {
  // Check if the page has a payment form
  const hasPaymentForm = detectPaymentForm();

  // If it does, notify the background script
  if (hasPaymentForm) {
    chrome.runtime.sendMessage({ 
      type: 'PAYMENT_FORM_DETECTED',
      url: window.location.href 
    });
    
    // Try to extract the total amount
    const totalAmount = extractTotalAmount();
    
    // Inject a button to use bPay
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    
    const button = document.createElement('button');
    button.textContent = totalAmount ? `Split $${totalAmount.toFixed(2)} with bPay` : 'Split Payment with bPay';
    button.style.backgroundColor = '#3B82F6';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.padding = '10px 16px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    // Add a small icon
    const icon = document.createElement('span');
    icon.textContent = '💳';
    icon.style.marginRight = '8px';
    button.prepend(icon);
    
    button.addEventListener('click', () => {
      // Open the split payment modal
      createSplitPaymentModal(totalAmount || 0);
    });
    
    container.appendChild(button);
    document.body.appendChild(container);
  }
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'OPEN_SPLIT_PAYMENT_MODAL') {
      const totalAmount = extractTotalAmount() || 0;
      createSplitPaymentModal(totalAmount);
      sendResponse({ success: true });
      return true;
    }
    
    return false;
  });
}

// Run the initialization
initialize();
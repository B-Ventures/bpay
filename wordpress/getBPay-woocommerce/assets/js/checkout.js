/**
 * getBPay WooCommerce Checkout JS
 * Handles the integration between WooCommerce checkout and getBPay
 */

(function($) {
    'use strict';

    // Main checkout handler
    const getBPayCheckout = {
        // Store API configuration
        config: {
            apiUrl: getbpayWC.apiUrl,
            ajaxUrl: getbpayWC.ajaxUrl,
            nonce: getbpayWC.nonce
        },

        // Track payment state
        state: {
            orderTotal: 0,
            paymentSources: [],
            virtualCard: null,
            modalOpen: false
        },

        /**
         * Initialize the checkout
         */
        init: function() {
            // Get order total from the page
            this.state.orderTotal = this.getOrderTotal();

            // Set up event listeners
            this.setupEventListeners();

            console.log('getBPay checkout initialized with order total:', this.state.orderTotal);
        },

        /**
         * Set up checkout-related event listeners
         */
        setupEventListeners: function() {
            // Handle the "Split Payment with getBPay" button click
            $('#getbpay-checkout-button').on('click', function(e) {
                e.preventDefault();
                getBPayCheckout.openModal();
            });

            // Listen for order total changes
            $(document.body).on('updated_checkout', function() {
                getBPayCheckout.state.orderTotal = getBPayCheckout.getOrderTotal();
                console.log('Order total updated:', getBPayCheckout.state.orderTotal);
            });
        },

        /**
         * Get the current order total from the page
         */
        getOrderTotal: function() {
            // Try to get the order total from the getBPay data element
            const dataElement = $('#getbpay-payment-data');
            if (dataElement.length && dataElement.data('order-total')) {
                return parseFloat(dataElement.data('order-total'));
            }

            // Fallback: Try to get from WooCommerce total
            const totalElement = $('.order-total .woocommerce-Price-amount');
            if (totalElement.length) {
                // Remove currency symbol and parse as float
                const totalText = totalElement.text().replace(/[^0-9.,]/g, '').replace(',', '.');
                return parseFloat(totalText);
            }

            return 0;
        },

        /**
         * Open the getBPay split payment modal
         */
        openModal: function() {
            // Prevent opening multiple modals
            if (this.state.modalOpen) {
                return;
            }

            this.state.modalOpen = true;

            // Create modal HTML
            const modalHtml = this.createModalHtml();
            $('body').append(modalHtml);

            // Initialize the modal functionality
            this.initializeModal();

            // Fetch the user's payment methods if they're logged in
            this.fetchPaymentMethods();
        },

        /**
         * Create the HTML for the getBPay modal
         */
        createModalHtml: function() {
            return `
                <div id="getbpay-modal" class="getbpay-modal">
                    <div class="getbpay-modal-overlay"></div>
                    <div class="getbpay-modal-container">
                        <div class="getbpay-modal-header">
                            <h2>Split Your Payment</h2>
                            <button type="button" class="getbpay-modal-close">&times;</button>
                        </div>
                        <div class="getbpay-modal-body">
                            <div class="getbpay-order-summary">
                                <h3>Order Summary</h3>
                                <div class="getbpay-order-amount">
                                    <span class="getbpay-label">Total Amount:</span>
                                    <span class="getbpay-amount">$${this.state.orderTotal.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div class="getbpay-payment-allocation">
                                <h3>Payment Allocation</h3>
                                <p class="getbpay-helper-text">
                                    Split your payment across multiple payment sources. 
                                    The total must equal the order amount.
                                </p>
                                
                                <div id="getbpay-payment-methods" class="getbpay-payment-methods">
                                    <div class="getbpay-loading">Loading payment methods...</div>
                                </div>
                                
                                <div class="getbpay-allocation-summary">
                                    <div class="getbpay-row">
                                        <span class="getbpay-label">Total Allocated:</span>
                                        <span id="getbpay-allocated-amount" class="getbpay-amount">$0.00</span>
                                    </div>
                                    <div class="getbpay-row">
                                        <span class="getbpay-label">Remaining:</span>
                                        <span id="getbpay-remaining-amount" class="getbpay-amount">$${this.state.orderTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="getbpay-virtual-card-name">
                                <h3>Virtual Card Name</h3>
                                <input type="text" id="getbpay-card-name" placeholder="e.g., Shopping Card" value="WooCommerce Order">
                            </div>
                        </div>
                        <div class="getbpay-modal-footer">
                            <button type="button" class="getbpay-modal-cancel">Cancel</button>
                            <button type="button" id="getbpay-complete-payment" class="getbpay-modal-submit" disabled>Complete Payment</button>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Initialize modal functionality
         */
        initializeModal: function() {
            const self = this;
            
            // Close modal when clicking the X, the overlay, or the cancel button
            $('.getbpay-modal-close, .getbpay-modal-overlay, .getbpay-modal-cancel').on('click', function() {
                self.closeModal();
            });
            
            // Complete payment button handler
            $('#getbpay-complete-payment').on('click', function() {
                self.processPayment();
            });
            
            // Prevent clicks inside the modal from closing it
            $('.getbpay-modal-container').on('click', function(e) {
                e.stopPropagation();
            });
            
            // Close modal when pressing Escape key
            $(document).on('keyup.getbpay-modal', function(e) {
                if (e.key === 'Escape') {
                    self.closeModal();
                }
            });
        },

        /**
         * Close the getBPay modal
         */
        closeModal: function() {
            $('#getbpay-modal').remove();
            $(document).off('keyup.getbpay-modal');
            this.state.modalOpen = false;
            this.state.paymentSources = [];
        },

        /**
         * Fetch the user's payment methods from getBPay
         */
        fetchPaymentMethods: function() {
            // In a real implementation, this would fetch the user's getBPay payment methods
            // For now, we'll simulate with some sample payment methods
            setTimeout(() => {
                this.renderPaymentMethods([
                    { id: 'card_1', name: 'Visa ending in 4242', type: 'card', balance: 500 },
                    { id: 'bank_1', name: 'Checking Account', type: 'bank_account', balance: 1000 },
                    { id: 'wallet_1', name: 'Digital Wallet', type: 'wallet', balance: 250 },
                ]);
            }, 500);
        },

        /**
         * Render payment methods in the modal
         */
        renderPaymentMethods: function(paymentMethods) {
            const container = $('#getbpay-payment-methods');
            container.empty();

            if (paymentMethods.length === 0) {
                container.html('<div class="getbpay-no-methods">No payment methods available. Please add payment methods in your getBPay account.</div>');
                return;
            }

            // Create payment method elements
            paymentMethods.forEach(method => {
                const methodHtml = `
                    <div class="getbpay-payment-method" data-id="${method.id}" data-type="${method.type}">
                        <div class="getbpay-method-details">
                            <div class="getbpay-method-name">${method.name}</div>
                            <div class="getbpay-method-balance">Available: $${method.balance.toFixed(2)}</div>
                        </div>
                        <div class="getbpay-method-amount">
                            <div class="getbpay-amount-field">
                                <input type="checkbox" class="getbpay-method-checkbox" id="getbpay-method-${method.id}-check">
                                <input type="number" class="getbpay-method-amount-input" 
                                    id="getbpay-method-${method.id}-amount" 
                                    min="0.01" 
                                    max="${Math.min(method.balance, this.state.orderTotal).toFixed(2)}" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    disabled>
                            </div>
                        </div>
                    </div>
                `;
                container.append(methodHtml);
            });

            // Set up event handlers for payment method selection and amount input
            this.setupPaymentMethodHandlers();
        },

        /**
         * Set up event handlers for payment method interaction
         */
        setupPaymentMethodHandlers: function() {
            const self = this;

            // Handle checkbox selection
            $('.getbpay-method-checkbox').on('change', function() {
                const methodId = $(this).closest('.getbpay-payment-method').data('id');
                const amountInput = $(`#getbpay-method-${methodId}-amount`);
                
                if ($(this).is(':checked')) {
                    amountInput.prop('disabled', false);
                    
                    // If no amount is entered yet, suggest the remaining amount
                    if (!amountInput.val()) {
                        const remaining = self.getRemainingAmount();
                        const max = parseFloat(amountInput.attr('max'));
                        amountInput.val(Math.min(remaining, max).toFixed(2));
                    }
                    
                    amountInput.focus();
                } else {
                    amountInput.prop('disabled', true).val('');
                }
                
                self.updateAllocationSummary();
            });

            // Handle amount input changes
            $('.getbpay-method-amount-input').on('input', function() {
                self.updateAllocationSummary();
            });
        },

        /**
         * Update the allocation summary displayed in the modal
         */
        updateAllocationSummary: function() {
            const allocated = this.getAllocatedAmount();
            const remaining = this.state.orderTotal - allocated;
            
            $('#getbpay-allocated-amount').text('$' + allocated.toFixed(2));
            $('#getbpay-remaining-amount').text('$' + remaining.toFixed(2));
            
            // Enable the complete payment button if allocations match the order total
            $('#getbpay-complete-payment').prop('disabled', Math.abs(remaining) > 0.01);
        },

        /**
         * Calculate the total allocated amount
         */
        getAllocatedAmount: function() {
            let total = 0;
            
            $('.getbpay-method-checkbox:checked').each(function() {
                const methodId = $(this).closest('.getbpay-payment-method').data('id');
                const amountInput = $(`#getbpay-method-${methodId}-amount`);
                const amount = parseFloat(amountInput.val()) || 0;
                total += amount;
            });
            
            return total;
        },

        /**
         * Calculate the remaining amount to be allocated
         */
        getRemainingAmount: function() {
            return this.state.orderTotal - this.getAllocatedAmount();
        },

        /**
         * Process the getBPay payment
         */
        processPayment: function() {
            // Collect payment sources data
            this.state.paymentSources = [];
            
            $('.getbpay-method-checkbox:checked').each(function() {
                const methodElement = $(this).closest('.getbpay-payment-method');
                const methodId = methodElement.data('id');
                const methodType = methodElement.data('type');
                const amountInput = $(`#getbpay-method-${methodId}-amount`);
                const amount = parseFloat(amountInput.val()) || 0;
                
                if (amount > 0) {
                    // Calculate percentage of order total
                    const percentage = (amount / getBPayCheckout.state.orderTotal) * 100;
                    
                    getBPayCheckout.state.paymentSources.push({
                        id: methodId,
                        type: methodType,
                        amount: amount,
                        percentage: percentage.toFixed(2)
                    });
                }
            });
            
            // Get the virtual card name
            const cardName = $('#getbpay-card-name').val() || 'WooCommerce Order';
            
            // Prepare the request data
            const requestData = {
                name: cardName,
                amount: this.state.orderTotal,
                paymentSources: this.state.paymentSources
            };
            
            console.log('Creating virtual card with:', requestData);
            
            // Show processing state
            this.showProcessingState();
            
            // In a real implementation, make an API call to create the virtual card
            // and complete the payment
            setTimeout(() => {
                // Simulate successful payment
                this.completePayment({
                    id: 'vc_' + Date.now(),
                    name: cardName,
                    amount: this.state.orderTotal,
                    status: 'active'
                });
            }, 1500);
        },

        /**
         * Show processing state in the modal
         */
        showProcessingState: function() {
            const modalBody = $('.getbpay-modal-body');
            const modalFooter = $('.getbpay-modal-footer');
            
            // Save current content to restore if needed
            this.savedModalContent = modalBody.html();
            
            // Update modal content
            modalBody.html(`
                <div class="getbpay-processing">
                    <div class="getbpay-spinner"></div>
                    <p>Processing your payment...</p>
                </div>
            `);
            
            // Disable footer buttons
            modalFooter.find('button').prop('disabled', true);
        },

        /**
         * Complete the payment process
         */
        completePayment: function(virtualCard) {
            const self = this;
            
            // Store the virtual card
            this.state.virtualCard = virtualCard;
            
            // Update modal
            $('.getbpay-modal-body').html(`
                <div class="getbpay-success">
                    <div class="getbpay-success-icon">✓</div>
                    <h3>Payment Successful!</h3>
                    <p>Your virtual card has been created and your payment has been processed.</p>
                    <div class="getbpay-card-details">
                        <div class="getbpay-card-name">Card name: ${virtualCard.name}</div>
                        <div class="getbpay-card-amount">Amount: $${this.state.orderTotal.toFixed(2)}</div>
                    </div>
                </div>
            `);
            
            // Update footer buttons
            $('.getbpay-modal-footer').html(`
                <button type="button" class="getbpay-modal-close-success">Close</button>
            `);
            
            // Setup close button
            $('.getbpay-modal-close-success').on('click', function() {
                self.closeModal();
                
                // Submit the WooCommerce form to complete the order
                $('form.checkout').submit();
            });
        },

        /**
         * Handle payment errors
         */
        handlePaymentError: function(error) {
            // Restore modal content
            if (this.savedModalContent) {
                $('.getbpay-modal-body').html(this.savedModalContent);
                
                // Re-initialize the handlers
                this.setupPaymentMethodHandlers();
                this.updateAllocationSummary();
            }
            
            // Enable footer buttons
            $('.getbpay-modal-footer').find('button').prop('disabled', false);
            
            // Show error message
            $('<div class="getbpay-error"></div>')
                .text(error.message || 'An error occurred while processing your payment.')
                .prependTo('.getbpay-modal-body')
                .delay(5000)
                .fadeOut();
        }
    };

    // Initialize when the document is ready
    $(document).ready(function() {
        // Only initialize on the checkout page
        if ($('form.checkout').length) {
            getBPayCheckout.init();
        }
    });

})(jQuery);
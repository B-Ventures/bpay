# getBPay for WooCommerce Integration Guide

This guide explains how to integrate the getBPay for WooCommerce plugin with your getBPay account and configure it to work with your WooCommerce store.

## Prerequisites

Before you begin, make sure you have:

1. A WordPress website with WooCommerce installed and configured
2. A getBPay merchant account (sign up at [getbpay.com](https://getbpay.com) if you don't have one)
3. API credentials from your getBPay merchant dashboard

## Installation

1. Log in to your WordPress admin dashboard
2. Navigate to Plugins > Add New
3. Click "Upload Plugin" and select the `getBPay-woocommerce.zip` file
4. Click "Install Now" and then "Activate Plugin"

## Configuration

### Step 1: Access Plugin Settings

1. In your WordPress admin dashboard, go to WooCommerce > Settings
2. Click on the "Payments" tab
3. Find "Split Payment with getBPay" in the list and click "Manage"

### Step 2: Enter API Credentials

1. Set "Enable/Disable" to "Yes" to activate the payment method
2. Enter your preferred title and description (what customers will see at checkout)
3. For testing purposes, you can enable "Test Mode"
4. Enter your API Key from the getBPay merchant dashboard
5. Enter your Merchant ID from the getBPay merchant dashboard
6. Save changes

### Step 3: Set Up Webhooks

1. Copy the Webhook URL displayed in the settings
2. Log in to your getBPay merchant dashboard
3. Navigate to Settings > Webhooks
4. Add a new webhook with the copied URL
5. Select the following events to monitor:
   - `payment.completed`
   - `payment.failed`
   - `virtual_card.created`
   - `virtual_card.updated`

## Testing the Integration

To test that your integration is working correctly:

1. Make a test purchase on your WooCommerce store
2. At checkout, select "Split Payment with getBPay"
3. Complete the checkout process
4. You should be redirected to the split payment interface
5. Allocate funds to different payment methods
6. Complete the payment
7. Verify the payment is completed in your WooCommerce order and getBPay dashboard

## Customization

### Customizing the Payment Button

You can customize the appearance of the getBPay payment button by adding custom CSS to your theme. For example:

```css
.getbpay-checkout-button {
    background-color: #your-brand-color !important;
    /* Add other custom styles */
}
```

### Customizing the Modal

The split payment modal can also be customized using CSS:

```css
.getbpay-modal-container {
    /* Your custom styles */
}

.getbpay-modal-header {
    /* Your custom styles */
}

/* And so on for other modal elements */
```

## API Integration Details

The WordPress plugin integrates with the getBPay API using the following endpoints:

- **Sessions API**: Creates a payment session for the current order
- **Virtual Cards API**: Creates virtual cards for split payments
- **Transactions API**: Processes the payment using the virtual card

The flow is as follows:

1. Customer selects getBPay at checkout
2. Plugin creates a session with order details
3. Customer allocates payment across multiple sources
4. Plugin creates a virtual card
5. Payment is completed using the virtual card
6. Webhook notifies WooCommerce when payment is successful

## Troubleshooting

### Common Issues

#### Payment Button Not Appearing

- Make sure the plugin is activated
- Check that the payment method is enabled in WooCommerce settings
- Verify there are no JavaScript errors on the checkout page

#### API Connection Errors

- Confirm your API key and merchant ID are correct
- Check that your server can connect to the getBPay API
- Verify SSL is properly configured on your server

#### Webhook Issues

- Ensure the webhook URL is correctly entered in your getBPay dashboard
- Check that your server is accessible from the internet
- Verify your server allows incoming POST requests

### Getting Support

If you encounter issues with the integration, contact getBPay support:

- Email: support@getbpay.com
- Support Portal: https://getbpay.com/support
- Documentation: https://developers.getbpay.com/docs
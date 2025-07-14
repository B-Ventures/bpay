# getBPay for WooCommerce Demo Implementation

This document provides a step-by-step guide to setting up a demo implementation of the getBPay for WooCommerce plugin.

## Setting Up a Test Environment

### Prerequisites

- A WordPress test site with WooCommerce installed
- WooCommerce properly configured with at least one product
- A test getBPay merchant account

### Installation Steps

1. Install the getBPay for WooCommerce plugin
2. Configure the plugin with test credentials
3. Set up a test product in WooCommerce
4. Test the checkout process

## Test Account Setup

For testing purposes, use these test credentials:

```
API Key: test_api_key_12345
Merchant ID: test_merchant_12345
API URL: https://api.test.getbpay.com
```

These credentials will connect to the getBPay sandbox environment where you can simulate payments without real financial transactions.

## Test Integration Flow

### 1. Configure WooCommerce Products

Create a test product in WooCommerce:
- Name: "Test Product"
- Price: $25.00
- Make sure it's published and available for purchase

### 2. Configure Payment Gateway

In WooCommerce > Settings > Payments:
- Enable "Split Payment with getBPay"
- Enable "Test Mode"
- Enter the test API key and merchant ID
- Save settings

### 3. Test Checkout Process

1. Add the test product to cart
2. Proceed to checkout
3. Fill in the required billing information
4. Select "Split Payment with getBPay" as the payment method
5. Click "Place Order"
6. You should be presented with the getBPay split payment interface
7. Test splitting the payment between multiple payment sources
8. Complete the payment

### 4. Test Webhook Integration

To test the webhook integration:

1. In your getBPay test account, navigate to the Webhooks section
2. Add the webhook URL from your WordPress settings
3. Select the events to monitor
4. Send a test webhook event
5. Verify that your WordPress site received and processed the webhook

## Sample Test Cards

Use these sample cards in the test environment:

| Card Number       | Expiry | CVV | Result           |
|-------------------|--------|-----|------------------|
| 4242424242424242 | Any    | Any | Successful charge |
| 4000000000000002 | Any    | Any | Declined charge   |
| 4000000000009995 | Any    | Any | Insufficient funds|

## Test Bank Accounts

Use these sample bank accounts in the test environment:

| Account Number    | Routing Number | Result           |
|-------------------|----------------|------------------|
| 000123456789      | 110000000      | Successful transfer |
| 000111111111      | 110000000      | Failed transfer  |

## Integration with getBPay API

### API Test Console

You can test API calls directly using the test console at:
https://api.test.getbpay.com/console

### Sample API Call

Here's an example of creating a test payment session:

```bash
curl -X POST https://api.test.getbpay.com/sessions \
  -H "Authorization: Bearer test_api_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "test_merchant_12345",
    "amount": 25.00,
    "currency": "USD",
    "description": "Test Order",
    "metadata": {
      "order_id": "test-001",
      "source": "woocommerce"
    }
  }'
```

## Debugging Tips

### Enabling Debug Mode

Add the following to your WordPress `wp-config.php` file to enable debugging:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

### Plugin Logging

The plugin logs important events and errors to:
`wp-content/uploads/getbpay-wc-logs/`

### Common Test Issues

1. **API Connection Errors**
   - Check that your test credentials are correct
   - Verify your server can connect to the test API URL

2. **Split Payment Modal Not Working**
   - Check browser console for JavaScript errors
   - Verify there are no conflicts with other plugins

3. **Webhook Not Receiving Events**
   - Check the webhook URL is correctly entered
   - Verify your test site is publicly accessible

## Transitioning to Production

When you're ready to go live:

1. Obtain production API credentials from your getBPay account
2. Disable "Test Mode" in the plugin settings
3. Update the API credentials to production values
4. Test a small real transaction
5. Monitor the orders and webhooks

## Support Resources

If you encounter issues during testing:

- Test Environment Support: test-support@getbpay.com
- API Documentation: https://developers.getbpay.com/docs
- Test Account Dashboard: https://dashboard.test.getbpay.com
# getBPay for WooCommerce

A WordPress plugin that enables split payments in WooCommerce checkout using getBPay virtual cards.

## Description

The getBPay for WooCommerce plugin allows customers to split their payment across multiple payment sources during the WooCommerce checkout process. When a customer chooses to pay with getBPay, they can allocate portions of the total order amount to different payment methods they have registered in their getBPay account.

Key features:
- Seamless integration with WooCommerce checkout
- Customizable payment button and styling
- Split payments across multiple payment sources
- Complete payment tracking and management
- Support for refunds through the WooCommerce interface

## Installation

### Automatic Installation
1. Log in to your WordPress dashboard, navigate to the Plugins menu, and click "Add New"
2. Search for "getBPay for WooCommerce"
3. Click "Install Now" and then "Activate" the plugin

### Manual Installation
1. Download the plugin ZIP file
2. Log in to your WordPress dashboard, navigate to the Plugins menu, and click "Add New"
3. Click "Upload Plugin", choose the ZIP file, and click "Install Now"
4. Activate the plugin after installation

## Configuration

1. Go to WooCommerce > Settings > Payments
2. Find "Split Payment with getBPay" in the payment methods list and click "Manage"
3. Configure the following settings:
   - **Enable/Disable**: Toggle to enable or disable the payment method
   - **Title**: The payment method title displayed to customers
   - **Description**: The payment method description displayed to customers
   - **Test Mode**: Toggle to enable or disable test mode
   - **API Key**: Enter your getBPay API key
   - **Merchant ID**: Enter your getBPay merchant ID
   - **Webhook URL**: Copy this URL to your getBPay dashboard to receive payment notifications

## Usage

### For Merchants
1. Install and configure the plugin as described above
2. The getBPay payment option will appear on the WooCommerce checkout page
3. You can track and manage payments through the WooCommerce Orders interface

### For Customers
1. During checkout, customers will see the "Split Payment with getBPay" option
2. After selecting this payment method and clicking "Place Order", they'll be prompted to split their payment
3. Customers can allocate portions of the total order amount to different payment methods in their getBPay account
4. Once the payment is complete, they'll be redirected back to the order confirmation page

## Troubleshooting

### Common Issues
- **Payment Button Not Appearing**: Make sure the plugin is activated and the payment method is enabled in WooCommerce settings
- **Payment Processing Errors**: Check that your API credentials are correct and that your getBPay account is properly configured
- **Webhook Not Receiving Events**: Verify that the webhook URL is correctly set in your getBPay dashboard

### Support
For support, please contact support@getbpay.com or visit our website at https://getbpay.com/support.

## Changelog

### 1.0.0
- Initial release

## License

This plugin is licensed under the [GPL v2 or later](https://www.gnu.org/licenses/gpl-2.0.html).
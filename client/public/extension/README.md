# bPay Browser Extension

The bPay Browser Extension allows users to split payments across multiple funding sources when making online purchases. This document provides information on how to install, use, and develop the extension.

## Features

- **Payment Form Detection**: Automatically detects checkout pages and payment forms.
- **Transaction Amount Extraction**: Extracts the total amount from checkout pages.
- **Split Payment**: Allows splitting payments across multiple funding sources.
- **Virtual Card Generation**: Creates virtual cards funded from multiple sources.
- **Auto-Fill**: Automatically fills payment forms with the generated virtual card details.

## Installation

### For Users

1. Download the extension from the Chrome Web Store (coming soon).
2. Click "Add to Chrome" to install the extension.
3. Sign in to your bPay account when prompted.

### For Developers

1. Clone the repository.
2. Build the extension by running `./build-extension.sh`.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable "Developer mode" in the top-right corner.
5. Click "Load unpacked" and select the `dist/extension` directory.

## Usage

1. Navigate to any e-commerce or checkout page.
2. A "Split Payment with bPay" button will appear in the bottom-right corner of the page.
3. Click the button to open the split payment modal.
4. Enter or confirm the total amount.
5. Select the payment sources you want to use and allocate amounts to each.
6. Click "Create Virtual Card" to generate a virtual card.
7. Click "Auto-Fill Card Details" to fill the payment form with the virtual card information.
8. Complete the checkout process as usual.

## Development

The extension consists of the following key components:

- **manifest.json**: Configuration file for the extension.
- **background.js**: Background script that handles API communication.
- **contentScript.js**: Content script injected into web pages for form detection and UI injection.
- **popup.html/popup.js**: Popup UI for managing payment methods and virtual cards.

To modify the extension:

1. Edit the respective files in the `client/public/extension` directory.
2. Rebuild the extension using `./build-extension.sh`.
3. Reload the extension in Chrome (`chrome://extensions/` > find bPay > click reload).

## Permissions

The extension requires the following permissions:

- **storage**: To store user preferences and detected checkout pages.
- **tabs**: To open the bPay dashboard in a new tab.
- **activeTab**: To interact with the current tab's content.
- **contextMenus**: To add a right-click menu option for split payments.
- **host_permissions**: To access websites for payment form detection and auto-filling.

## Support

For issues or feature requests, please contact support@getbpay.com or visit our website at https://getbpay.com/support.
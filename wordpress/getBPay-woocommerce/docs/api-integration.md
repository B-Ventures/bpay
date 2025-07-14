# getBPay for WooCommerce API Integration

This document outlines the technical details of how the getBPay WordPress plugin integrates with the getBPay API.

## API Endpoints Used

The plugin interacts with the following getBPay API endpoints:

### 1. Sessions API
- **Endpoint**: `https://api.getbpay.com/sessions`
- **Method**: `POST`
- **Purpose**: Creates a payment session for a WooCommerce order
- **Payload Example**:
```json
{
  "merchant_id": "mer_123456789",
  "amount": 75.50,
  "currency": "USD",
  "description": "Order #1001",
  "order": {
    "id": "1001",
    "total": 75.50,
    "currency": "USD",
    "items": [
      {
        "name": "Product A",
        "quantity": 2,
        "price": 25.00,
        "sku": "PROD-A"
      },
      {
        "name": "Product B",
        "quantity": 1,
        "price": 25.50,
        "sku": "PROD-B"
      }
    ]
  },
  "customer": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "555-123-4567"
  },
  "callback_url": "https://example.com/wc-api/getbpay_callback",
  "metadata": {
    "order_id": "1001",
    "source": "woocommerce"
  }
}
```

### 2. Virtual Cards API
- **Endpoint**: `https://api.getbpay.com/virtual-cards`
- **Method**: `POST`
- **Purpose**: Creates a virtual card funded from multiple payment sources
- **Payload Example**:
```json
{
  "name": "WooCommerce Order #1001",
  "amount": 75.50,
  "currency": "USD",
  "payment_sources": [
    {
      "id": "card_123456",
      "type": "card",
      "amount": 50.00
    },
    {
      "id": "bank_123456",
      "type": "bank_account",
      "amount": 25.50
    }
  ],
  "metadata": {
    "order_id": "1001",
    "source": "woocommerce",
    "session_id": "sess_123456789"
  }
}
```

### 3. Sessions Completion API
- **Endpoint**: `https://api.getbpay.com/sessions/{session_id}/complete`
- **Method**: `POST`
- **Purpose**: Completes a payment session using a virtual card
- **Payload Example**:
```json
{
  "virtual_card_id": "vc_123456789"
}
```

### 4. Refunds API
- **Endpoint**: `https://api.getbpay.com/refunds`
- **Method**: `POST`
- **Purpose**: Processes refunds for WooCommerce orders
- **Payload Example**:
```json
{
  "transaction_id": "txn_123456789",
  "amount": 25.50,
  "reason": "Customer requested refund"
}
```

## Webhook Integration

The plugin registers a webhook endpoint at `https://your-store.com/wc-api/getbpay_callback` to receive updates from getBPay. This endpoint handles the following events:

- `payment.completed`: Updates the order status to "Processing" or "Completed"
- `payment.failed`: Updates the order status to "Failed"
- `virtual_card.created`: Stores virtual card details in order meta
- `virtual_card.updated`: Updates stored virtual card details

## Authentication

All API requests are authenticated using the merchant's API key in the Authorization header:

```
Authorization: Bearer your_api_key_here
```

## Integration with getBPay Backend

### Database Connections

The WordPress plugin doesn't directly connect to the getBPay database. All interactions happen through the API endpoints.

### User Authentication

Users are not required to have a getBPay account to use the plugin. The merchant account credentials are used for API authentication.

If the user does have a getBPay account and is logged in, the plugin can retrieve their stored payment methods using:

- **Endpoint**: `https://api.getbpay.com/payment-methods`
- **Method**: `GET`
- **Headers**:
  - `Authorization: Bearer user_access_token`

## Development Considerations

### API Versioning

The plugin is designed to work with getBPay API v1. Any updates to the API should maintain backward compatibility or include version handling in the plugin.

### Error Handling

The plugin implements comprehensive error handling for API responses:
- API timeouts are retried up to 3 times
- Error messages from the API are displayed to the user in a friendly format
- Connection issues are logged for debugging

### Security Considerations

- API keys are stored securely using WordPress's encryption functions
- All API requests use HTTPS
- Webhook requests are verified using signature validation
- User input is sanitized before being used in API requests

## Testing

When in test mode, the plugin uses the test API endpoints (`https://api.test.getbpay.com/`) and displays a test payment interface.

## Example Integration Flow

1. Customer places an order on WooCommerce store
2. Customer selects getBPay payment method and clicks "Place Order"
3. WooCommerce creates an order with "Pending Payment" status
4. Plugin creates a payment session with getBPay API
5. Customer is presented with the split payment interface
6. Customer allocates payment across different sources
7. Plugin creates a virtual card with specified allocations
8. Plugin completes the payment session with the virtual card
9. getBPay processes the payment and sends a webhook notification
10. Plugin updates the order status based on the webhook
11. Customer receives order confirmation

This flow ensures a seamless checkout experience while allowing customers to split their payment across multiple sources.
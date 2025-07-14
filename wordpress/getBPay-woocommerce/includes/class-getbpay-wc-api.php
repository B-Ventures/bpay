<?php
/**
 * API Endpoints for getBPay WooCommerce Integration
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class GetBPay_WC_API {
    /**
     * Constructor.
     */
    public function __construct() {
        // Register REST API routes
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        register_rest_route('getbpay/v1', '/process', array(
            'methods'  => 'GET',
            'callback' => array($this, 'process_payment'),
            'permission_callback' => '__return_true',
        ));

        register_rest_route('getbpay/v1', '/session', array(
            'methods'  => 'POST',
            'callback' => array($this, 'create_session'),
            'permission_callback' => '__return_true',
        ));

        register_rest_route('getbpay/v1', '/complete', array(
            'methods'  => 'POST',
            'callback' => array($this, 'complete_payment'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * Process payment endpoint handler
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return WP_REST_Response
     */
    public function process_payment($request) {
        $order_id = $request->get_param('order_id');
        $amount = $request->get_param('amount');
        $currency = $request->get_param('currency');
        $return_url = $request->get_param('return_url');
        $cancel_url = $request->get_param('cancel_url');

        // Validate the request
        if (empty($order_id) || empty($amount)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Missing required parameters',
            ), 400);
        }

        // Get the order
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Order not found',
            ), 404);
        }

        // Store the return URL in the session
        WC()->session->set('getbpay_return_url', $return_url);
        WC()->session->set('getbpay_cancel_url', $cancel_url);

        // Create a payment session with getBPay API
        $session = $this->create_getbpay_session($order, $amount, $currency);

        if (!$session || isset($session->error)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => isset($session->error) ? $session->error : 'Failed to create payment session',
            ), 500);
        }

        // Determine redirect URL to getBPay page or inline modal
        $redirect_url = home_url('/getbpay-checkout/?session_id=' . $session->id);

        return new WP_REST_Response(array(
            'success' => true,
            'redirect_url' => $redirect_url,
            'session_id' => $session->id,
        ));
    }

    /**
     * Create a payment session with getBPay API
     *
     * @param WC_Order $order The order
     * @param float $amount The payment amount
     * @param string $currency The currency code
     * @return object|false The session object or false on failure
     */
    private function create_getbpay_session($order, $amount, $currency) {
        // Get the gateway settings
        $settings = get_option('woocommerce_getbpay_settings', array());
        $api_key = isset($settings['api_key']) ? $settings['api_key'] : '';
        $merchant_id = isset($settings['merchant_id']) ? $settings['merchant_id'] : '';
        $test_mode = isset($settings['testmode']) && $settings['testmode'] === 'yes';
        
        // Set the API URL based on test mode
        $api_url = $test_mode ? 'https://api.test.getbpay.com' : 'https://api.getbpay.com';
        
        // Prepare the callback URL
        $callback_url = WC()->api_request_url('getbpay_callback');
        
        // Prepare the customer data
        $customer = array(
            'name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            'email' => $order->get_billing_email(),
            'phone' => $order->get_billing_phone(),
        );
        
        // Prepare the order data
        $order_data = array(
            'id' => $order->get_id(),
            'total' => $amount,
            'currency' => $currency,
            'items' => $this->get_order_items($order),
        );
        
        // Prepare the request data
        $request_data = array(
            'merchant_id' => $merchant_id,
            'amount' => $amount,
            'currency' => $currency,
            'description' => 'Order #' . $order->get_order_number(),
            'order' => $order_data,
            'customer' => $customer,
            'callback_url' => $callback_url,
            'metadata' => array(
                'order_id' => $order->get_id(),
                'source' => 'woocommerce',
            ),
        );
        
        // Make the API request
        $response = wp_remote_post($api_url . '/sessions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($request_data),
            'timeout' => 30,
        ));
        
        // Check for errors
        if (is_wp_error($response)) {
            error_log('getBPay API Error: ' . $response->get_error_message());
            return false;
        }
        
        // Parse the response
        $body = wp_remote_retrieve_body($response);
        $session = json_decode($body);
        
        // Check if the session was created successfully
        if (!$session || !isset($session->id)) {
            error_log('getBPay API Error: ' . ($session->message ?? 'Unknown error'));
            return false;
        }
        
        return $session;
    }

    /**
     * Get order items for API request
     *
     * @param WC_Order $order The order
     * @return array Array of line items
     */
    private function get_order_items($order) {
        $items = array();
        
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            
            $items[] = array(
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'price' => $order->get_item_total($item, false),
                'sku' => $product ? $product->get_sku() : '',
            );
        }
        
        return $items;
    }

    /**
     * Create session endpoint handler
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return WP_REST_Response
     */
    public function create_session($request) {
        $data = $request->get_json_params();
        
        if (empty($data['order_id']) || empty($data['amount'])) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Missing required parameters',
            ), 400);
        }
        
        $order_id = $data['order_id'];
        $amount = $data['amount'];
        $currency = isset($data['currency']) ? $data['currency'] : get_woocommerce_currency();
        
        // Get the order
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Order not found',
            ), 404);
        }
        
        // Create a session with getBPay API
        $session = $this->create_getbpay_session($order, $amount, $currency);
        
        if (!$session || isset($session->error)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => isset($session->error) ? $session->error : 'Failed to create payment session',
            ), 500);
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'session_id' => $session->id,
            'public_id' => $session->public_id,
        ));
    }

    /**
     * Complete payment endpoint handler
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return WP_REST_Response
     */
    public function complete_payment($request) {
        $data = $request->get_json_params();
        
        if (empty($data['order_id']) || empty($data['session_id']) || empty($data['virtual_card_id'])) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Missing required parameters',
            ), 400);
        }
        
        // Log payment data for debugging allocation issues
        error_log('bPay WordPress Plugin - Payment Data: ' . json_encode([
            'order_id' => $data['order_id'],
            'virtual_card_id' => $data['virtual_card_id'],
            'payment_sources' => isset($data['payment_sources']) ? $data['payment_sources'] : []
        ]));
        
        $order_id = $data['order_id'];
        $session_id = $data['session_id'];
        $virtual_card_id = $data['virtual_card_id'];
        
        // Get the order
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Order not found',
            ), 404);
        }
        
        // Get the gateway settings
        $settings = get_option('woocommerce_getbpay_settings', array());
        $api_key = isset($settings['api_key']) ? $settings['api_key'] : '';
        $test_mode = isset($settings['testmode']) && $settings['testmode'] === 'yes';
        
        // Set the API URL based on test mode
        $api_url = $test_mode ? 'https://api.test.getbpay.com' : 'https://api.getbpay.com';
        
        // Make the API request to confirm the payment
        $response = wp_remote_post($api_url . '/sessions/' . $session_id . '/complete', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'virtual_card_id' => $virtual_card_id,
            )),
            'timeout' => 30,
        ));
        
        // Check for errors
        if (is_wp_error($response)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $response->get_error_message(),
            ), 500);
        }
        
        // Parse the response
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body);
        
        // Check if the payment was completed successfully
        if (!$result || !isset($result->success) || !$result->success) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => isset($result->message) ? $result->message : 'Failed to complete payment',
            ), 500);
        }
        
        // Update the order
        $order->payment_complete(isset($result->transaction_id) ? $result->transaction_id : $virtual_card_id);
        $order->add_order_note(__('getBPay payment completed. Virtual Card ID: ', 'getbpay-woocommerce') . $virtual_card_id);
        
        // Add transaction ID and virtual card ID as order meta
        update_post_meta($order_id, '_getbpay_virtual_card_id', $virtual_card_id);
        if (isset($result->transaction_id)) {
            update_post_meta($order_id, '_transaction_id', $result->transaction_id);
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'redirect_url' => $order->get_checkout_order_received_url(),
        ));
    }
}

// Initialize the API
new GetBPay_WC_API();
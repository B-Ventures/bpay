<?php
/**
 * WooCommerce getBPay Payment Gateway class
 */
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * WC_Gateway_GetBPay
 */
class WC_Gateway_GetBPay extends WC_Payment_Gateway {
    /**
     * Constructor for the gateway.
     */
    public function __construct() {
        $this->id                 = 'getbpay';
        $this->icon               = apply_filters('woocommerce_getbpay_icon', GETBPAY_WC_PLUGIN_URL . 'assets/images/getbpay-logo.png');
        $this->has_fields         = true;
        $this->method_title       = __('getBPay', 'getbpay-woocommerce');
        $this->method_description = __('Allow customers to use getBPay to split payments between multiple payment sources.', 'getbpay-woocommerce');
        $this->supports           = array(
            'products',
            'refunds',
        );

        // Load the settings
        $this->init_form_fields();
        $this->init_settings();

        // Define variables
        $this->title          = $this->get_option('title');
        $this->description    = $this->get_option('description');
        $this->enabled        = $this->get_option('enabled');
        $this->testmode       = 'yes' === $this->get_option('testmode');
        $this->api_key        = $this->get_option('api_key');
        $this->merchant_id    = $this->get_option('merchant_id');
        $this->api_url        = $this->testmode ? 'https://api.test.getbpay.com' : 'https://api.getbpay.com';

        // Save settings
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        
        // Handle the return from getBPay
        add_action('woocommerce_api_getbpay_callback', array($this, 'handle_callback'));
    }

    /**
     * Initialize Gateway Settings Form Fields
     */
    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title'       => __('Enable/Disable', 'getbpay-woocommerce'),
                'type'        => 'checkbox',
                'label'       => __('Enable getBPay Payment', 'getbpay-woocommerce'),
                'default'     => 'no',
            ),
            'title' => array(
                'title'       => __('Title', 'getbpay-woocommerce'),
                'type'        => 'text',
                'description' => __('This controls the title which the user sees during checkout.', 'getbpay-woocommerce'),
                'default'     => __('Split Payment with getBPay', 'getbpay-woocommerce'),
                'desc_tip'    => true,
            ),
            'description' => array(
                'title'       => __('Description', 'getbpay-woocommerce'),
                'type'        => 'textarea',
                'description' => __('This controls the description which the user sees during checkout.', 'getbpay-woocommerce'),
                'default'     => __('Split your payment across multiple payment sources securely with getBPay.', 'getbpay-woocommerce'),
                'desc_tip'    => true,
            ),
            'testmode' => array(
                'title'       => __('Test mode', 'getbpay-woocommerce'),
                'type'        => 'checkbox',
                'label'       => __('Enable Test Mode', 'getbpay-woocommerce'),
                'default'     => 'yes',
                'description' => __('Place the payment gateway in test mode using test API keys.', 'getbpay-woocommerce'),
            ),
            'api_key' => array(
                'title'       => __('API Key', 'getbpay-woocommerce'),
                'type'        => 'password',
                'description' => __('Get your API key from your getBPay account.', 'getbpay-woocommerce'),
                'default'     => '',
                'desc_tip'    => true,
            ),
            'merchant_id' => array(
                'title'       => __('Merchant ID', 'getbpay-woocommerce'),
                'type'        => 'text',
                'description' => __('Get your Merchant ID from your getBPay account.', 'getbpay-woocommerce'),
                'default'     => '',
                'desc_tip'    => true,
            ),
            'webhook_url' => array(
                'title'       => __('Webhook URL', 'getbpay-woocommerce'),
                'type'        => 'text',
                'description' => __('Provide this URL to getBPay to receive payment confirmations.', 'getbpay-woocommerce'),
                'default'     => WC()->api_request_url('getbpay_callback'),
                'custom_attributes' => array('readonly' => 'readonly'),
            ),
        );
    }

    /**
     * Output the payment fields
     */
    public function payment_fields() {
        // Output description if set
        if ($this->description) {
            echo wpautop(wptexturize($this->description));
        }
        
        // Add custom getBPay fields if needed
        echo '<div id="getbpay-payment-data" data-order-total="' . esc_attr(WC()->cart->get_total('')) . '"></div>';
    }

    /**
     * Process the payment
     *
     * @param int $order_id
     * @return array
     */
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        
        // Mark as pending (we're awaiting the getBPay payment)
        $order->update_status('pending', __('Awaiting getBPay payment', 'getbpay-woocommerce'));
        
        // Store order ID in session
        WC()->session->set('getbpay_order_id', $order_id);
        
        // Return redirect URL for getBPay process
        return array(
            'result'   => 'success',
            'redirect' => add_query_arg(array(
                'order_id'   => $order_id,
                'amount'     => $order->get_total(),
                'currency'   => get_woocommerce_currency(),
                'return_url' => $this->get_return_url($order),
                'cancel_url' => $order->get_cancel_order_url(),
            ), home_url('wp-json/getbpay/v1/process')),
        );
    }

    /**
     * Handle the callback from getBPay
     */
    public function handle_callback() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data) || !isset($data['order_id']) || !isset($data['status'])) {
            wp_die('Invalid callback data', 'getBPay Error', array('response' => 400));
        }
        
        $order_id = $data['order_id'];
        $order = wc_get_order($order_id);
        
        if (!$order) {
            wp_die('Order not found', 'getBPay Error', array('response' => 404));
        }
        
        // Verify the callback using the API key
        $headers = getallheaders();
        $signature = isset($headers['X-Getbpay-Signature']) ? $headers['X-Getbpay-Signature'] : '';
        
        // In a real implementation, validate the signature here
        
        // Process the payment status
        if ($data['status'] === 'completed') {
            // Payment completed
            $order->payment_complete($data['transaction_id']);
            $order->add_order_note(__('getBPay payment completed. Transaction ID: ', 'getbpay-woocommerce') . $data['transaction_id']);
        } else if ($data['status'] === 'failed') {
            // Payment failed
            $order->update_status('failed', __('getBPay payment failed.', 'getbpay-woocommerce'));
        }
        
        echo json_encode(array('success' => true));
        exit;
    }

    /**
     * Process refunds
     * 
     * @param int $order_id
     * @param float $amount
     * @param string $reason
     * @return bool
     */
    public function process_refund($order_id, $amount = null, $reason = '') {
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return false;
        }
        
        // Get the transaction ID
        $transaction_id = $order->get_transaction_id();
        
        if (!$transaction_id) {
            return false;
        }
        
        try {
            // Make API request to getBPay to process the refund
            $response = wp_remote_post($this->api_url . '/refunds', array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->api_key,
                    'Content-Type'  => 'application/json',
                ),
                'body' => json_encode(array(
                    'transaction_id' => $transaction_id,
                    'amount'         => $amount,
                    'reason'         => $reason,
                )),
            ));
            
            if (is_wp_error($response)) {
                throw new Exception($response->get_error_message());
            }
            
            $response_data = json_decode(wp_remote_retrieve_body($response), true);
            
            if (!$response_data || !isset($response_data['success']) || !$response_data['success']) {
                throw new Exception($response_data['message'] ?? 'Unknown refund error');
            }
            
            // Add refund note to the order
            $order->add_order_note(
                sprintf(__('Refund of %s processed through getBPay. Refund ID: %s', 'getbpay-woocommerce'),
                    wc_price($amount),
                    $response_data['refund_id']
                )
            );
            
            return true;
            
        } catch (Exception $e) {
            $order->add_order_note(sprintf(__('getBPay refund failed: %s', 'getbpay-woocommerce'), $e->getMessage()));
            return false;
        }
    }
}
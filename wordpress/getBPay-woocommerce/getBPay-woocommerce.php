<?php
/**
 * Plugin Name: getBPay for WooCommerce
 * Plugin URI: https://getbpay.com/wordpress
 * Description: Enables split payments in WooCommerce checkout using getBPay virtual cards.
 * Version: 1.0.0
 * Author: getBPay
 * Author URI: https://getbpay.com
 * Text Domain: getbpay-woocommerce
 * Domain Path: /languages
 * WC requires at least: 5.0.0
 * WC tested up to: 8.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('GETBPAY_WC_VERSION', '1.0.0');
define('GETBPAY_WC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('GETBPAY_WC_PLUGIN_PATH', plugin_dir_path(__FILE__));

/**
 * Check if WooCommerce is active
 */
function getbpay_wc_is_woocommerce_active() {
    $active_plugins = (array) get_option('active_plugins', array());
    
    if (is_multisite()) {
        $active_plugins = array_merge($active_plugins, get_site_option('active_sitewide_plugins', array()));
    }
    
    return in_array('woocommerce/woocommerce.php', $active_plugins) || array_key_exists('woocommerce/woocommerce.php', $active_plugins);
}

/**
 * Initialize the plugin
 */
function getbpay_wc_init() {
    // Check if WooCommerce is active
    if (!getbpay_wc_is_woocommerce_active()) {
        add_action('admin_notices', 'getbpay_wc_woocommerce_missing_notice');
        return;
    }
    
    // Load plugin text domain
    load_plugin_textdomain('getbpay-woocommerce', false, dirname(plugin_basename(__FILE__)) . '/languages');
    
    // Include required files
    require_once GETBPAY_WC_PLUGIN_PATH . 'includes/class-getbpay-wc-gateway.php';
    require_once GETBPAY_WC_PLUGIN_PATH . 'includes/class-getbpay-wc-api.php';
    
    // Add payment gateway to WooCommerce
    add_filter('woocommerce_payment_gateways', 'getbpay_wc_add_gateway');
    
    // Enqueue scripts
    add_action('wp_enqueue_scripts', 'getbpay_wc_enqueue_scripts');
    
    // Add action links to the plugins page
    add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'getbpay_wc_action_links');
}
add_action('plugins_loaded', 'getbpay_wc_init');

/**
 * Add payment gateway to WooCommerce
 */
function getbpay_wc_add_gateway($gateways) {
    $gateways[] = 'WC_Gateway_GetBPay';
    return $gateways;
}

/**
 * Display admin notice if WooCommerce is missing
 */
function getbpay_wc_woocommerce_missing_notice() {
    echo '<div class="error"><p>' . sprintf(__('getBPay for WooCommerce requires WooCommerce to be installed and active. You can download %s here.', 'getbpay-woocommerce'), '<a href="https://woocommerce.com/" target="_blank">WooCommerce</a>') . '</p></div>';
}

/**
 * Enqueue frontend scripts and styles
 */
function getbpay_wc_enqueue_scripts() {
    if (is_checkout()) {
        wp_enqueue_script('getbpay-wc-checkout', GETBPAY_WC_PLUGIN_URL . 'assets/js/checkout.js', array('jquery'), GETBPAY_WC_VERSION, true);
        
        // Pass variables to JavaScript
        wp_localize_script('getbpay-wc-checkout', 'getbpayWC', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'apiUrl' => get_option('getbpay_wc_api_url', 'https://api.getbpay.com'),
            'nonce' => wp_create_nonce('getbpay-wc-nonce'),
        ));
        
        wp_enqueue_style('getbpay-wc-checkout', GETBPAY_WC_PLUGIN_URL . 'assets/css/checkout.css', array(), GETBPAY_WC_VERSION);
    }
}

/**
 * Add action links to the plugins page
 */
function getbpay_wc_action_links($links) {
    $plugin_links = array(
        '<a href="' . admin_url('admin.php?page=wc-settings&tab=checkout&section=getbpay') . '">' . __('Settings', 'getbpay-woocommerce') . '</a>',
    );
    
    return array_merge($plugin_links, $links);
}

/**
 * Add getBPay checkout button after WooCommerce checkout
 */
function getbpay_wc_add_checkout_button() {
    // Only show the button if getBPay is enabled
    $settings = get_option('woocommerce_getbpay_settings', array());
    
    if (isset($settings['enabled']) && $settings['enabled'] === 'yes') {
        echo '<div id="getbpay-checkout-container" class="getbpay-checkout-button-container">';
        echo '<button type="button" id="getbpay-checkout-button" class="button getbpay-checkout-button">';
        echo '<span class="getbpay-button-text">' . __('Split Payment with getBPay', 'getbpay-woocommerce') . '</span>';
        echo '</button>';
        echo '</div>';
    }
}
add_action('woocommerce_review_order_after_payment', 'getbpay_wc_add_checkout_button');

/**
 * Register activation hook to set up the plugin
 */
function getbpay_wc_activate() {
    // Create necessary database tables or options
    add_option('getbpay_wc_api_url', 'https://api.getbpay.com');
    add_option('getbpay_wc_merchant_id', '');
}
register_activation_hook(__FILE__, 'getbpay_wc_activate');

/**
 * Register deactivation hook to clean up
 */
function getbpay_wc_deactivate() {
    // Clean up if needed
}
register_deactivation_hook(__FILE__, 'getbpay_wc_deactivate');
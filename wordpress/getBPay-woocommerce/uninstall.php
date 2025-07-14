<?php
/**
 * Uninstall getBPay for WooCommerce
 *
 * This file runs when the plugin is uninstalled to clean up any plugin data.
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete plugin options
delete_option('getbpay_wc_api_url');
delete_option('getbpay_wc_merchant_id');
delete_option('woocommerce_getbpay_settings');

// Clear any transients
delete_transient('getbpay_wc_api_status');
delete_transient('getbpay_wc_payment_methods');

// Delete cron schedules if any
wp_clear_scheduled_hook('getbpay_wc_scheduled_sync');

// Remove meta data from orders
global $wpdb;

// Remove virtual card IDs from order meta
$wpdb->query("DELETE FROM {$wpdb->prefix}postmeta WHERE meta_key = '_getbpay_virtual_card_id'");

// If any database tables were created, drop them here
// Note: We don't create custom tables in the plugin, but if that changes, add cleanup here
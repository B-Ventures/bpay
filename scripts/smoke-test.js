
const axios = require('axios');

const BASE_URL = 'http://0.0.0.0:5000/api';

async function runSmokeTest() {
  try {
    console.log('Running smoke tests...\n');

    // 1. Health check
    console.log('Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('Health check:', health.data);

    // 2. Stripe status
    console.log('\nTesting Stripe connection...');
    const stripe = await axios.get(`${BASE_URL}/stripe/status`);
    console.log('Stripe status:', stripe.data);

    // 3. Virtual Cards API
    console.log('\nTesting virtual cards endpoints...');
    const cards = await axios.get(`${BASE_URL}/virtual-cards`);
    console.log('Virtual cards fetched:', cards.data.length);

    // 4. Payment Methods API
    console.log('\nTesting payment methods endpoints...');
    const methods = await axios.get(`${BASE_URL}/payment-methods`);
    console.log('Payment methods fetched:', methods.data.length);

    // 5. System Settings
    console.log('\nTesting system settings...');
    const settings = await axios.get(`${BASE_URL}/system-settings`);
    console.log('System settings fetched:', settings.data.length);

    console.log('\nAll smoke tests completed successfully! ✅');
  } catch (error) {
    console.error('\nSmoke test failed! ❌');
    console.error('Error:', error.response?.data || error.message);
  }
}

runSmokeTest();

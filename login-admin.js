import axios from 'axios';

async function loginAsAdmin() {
  try {
    const response = await axios.post('http://localhost:5000/api/login', {
      username: 'admin',
      password: 'admin'
    }, {
      withCredentials: true
    });
    
    console.log('Login successful!', response.data);
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

loginAsAdmin();

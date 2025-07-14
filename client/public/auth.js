// Simple authentication handling

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      
      fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Login failed');
      })
      .then(user => {
        console.log('Logged in successfully:', user);
        window.location.href = '/dashboard';
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Login failed. Please check your credentials and try again.');
      });
    });
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      
      fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, username, email, password }),
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Registration failed');
      })
      .then(user => {
        console.log('Registered successfully:', user);
        window.location.href = '/dashboard';
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Registration failed. Username may already be taken.');
      });
    });
  }
});
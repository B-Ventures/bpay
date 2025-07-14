import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * A component for quick login during development/testing
 */
export const QuickLoginForm = () => {
  const { user, login, logout } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (user) {
    return (
      <div className="quick-login-form p-4 bg-gray-100 rounded shadow mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">
              <span className="font-semibold">Logged in as:</span> {user.username}
            </p>
            <p className="text-xs text-green-600">
              {user.isAdmin || user.is_admin ? '✓ Admin user' : 'Regular user'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-login-form p-4 bg-gray-100 rounded shadow mb-4">
      <h3 className="text-sm font-semibold mb-2">Quick Login (Admin)</h3>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-xs mb-2">
          {error}
        </div>
      )}
      <form onSubmit={handleLogin} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="flex-1 px-2 py-1 text-sm border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="flex-1 px-2 py-1 text-sm border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default QuickLoginForm;
import React, { useState, useEffect } from 'react';
import { authApi, contentManagementApi } from '../lib/api';
import QuickLoginForm from './QuickLoginForm';

/**
 * A debugging component for verifying admin authentication and CMS API access
 */
const AdminDebugger = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [error, setError] = useState(null);
  const [logMessages, setLogMessages] = useState([]);

  // Add a log message with timestamp
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [...prev, { timestamp, message, type }]);
  };

  // Test authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthLoading(true);
        addLog('Checking authentication status...');
        
        const userData = await authApi.getCurrentUser();
        setUser(userData);
        
        if (userData) {
          addLog(`✅ Authenticated as ${userData.username}, Admin: ${userData.isAdmin || userData.is_admin}`);
        } else {
          addLog('❌ Not authenticated', 'error');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        addLog(`❌ Auth check error: ${err.message}`, 'error');
        setError(err.message);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Function to test login
  const handleLogin = async (username, password) => {
    try {
      setAuthLoading(true);
      addLog(`Attempting login with username: ${username}`);
      
      const userData = await authApi.login({ username, password });
      setUser(userData);
      
      addLog(`✅ Login successful: ${userData.username}, Admin: ${userData.isAdmin || userData.is_admin}`);
      setError(null);
    } catch (err) {
      console.error('Login error:', err);
      addLog(`❌ Login failed: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Function to test logout
  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      addLog('Logging out...');
      
      await authApi.logout();
      setUser(null);
      
      addLog('✅ Logout successful');
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      addLog(`❌ Logout failed: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Function to test fetching CMS pages
  const handleFetchPages = async () => {
    try {
      setLoadingPages(true);
      addLog('Fetching CMS pages...');
      
      const pagesData = await contentManagementApi.getAllPageContent();
      setPages(pagesData);
      
      addLog(`✅ Fetched ${pagesData.length} pages`);
      setError(null);
    } catch (err) {
      console.error('Error fetching pages:', err);
      addLog(`❌ Failed to fetch pages: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setLoadingPages(false);
    }
  };

  // Function to test creating a test page
  const handleCreateTestPage = async () => {
    try {
      addLog('Creating test page...');
      
      const testPage = {
        page_id: `test-page-${Date.now()}`,
        title: 'Test Page',
        description: 'This is a test page created by the admin debugger',
        status: 'published',
        metadata: { testData: true }
      };
      
      const newPage = await contentManagementApi.createPageContent(testPage);
      
      addLog(`✅ Test page created: ${newPage.title}`);
      setError(null);
      
      // Refresh pages list
      handleFetchPages();
    } catch (err) {
      console.error('Error creating test page:', err);
      addLog(`❌ Failed to create test page: ${err.message}`, 'error');
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Admin CMS Debugger</h2>
      
      {/* Authentication Status */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Authentication Status:</h3>
        {authLoading ? (
          <div className="flex items-center text-gray-500">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking authentication...
          </div>
        ) : user ? (
          <div className="bg-green-100 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Logged in as: {user.username}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Admin: {(user.isAdmin || user.is_admin) ? 'Yes' : 'No'}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  User ID: {user.id}
                </p>
                <div className="mt-2">
                  <button
                    onClick={handleLogout}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Not logged in
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Use the form below to login as an admin user.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <QuickLoginForm />
            </div>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* CMS Testing */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">CMS API Testing:</h3>
        <div className="flex space-x-2 mb-4">
          <button
            onClick={handleFetchPages}
            disabled={loadingPages}
            className={`px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
              loadingPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loadingPages ? 'Loading...' : 'Fetch Pages'}
          </button>
          <button
            onClick={handleCreateTestPage}
            disabled={!user || !(user.isAdmin || user.is_admin)}
            className={`px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${
              !user || !(user.isAdmin || user.is_admin) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Create Test Page
          </button>
        </div>
        
        {/* Pages Results */}
        {pages.length > 0 && (
          <div className="border rounded overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-medium text-sm">
              Pages ({pages.length})
            </div>
            <div className="divide-y">
              {pages.map((page, index) => (
                <div key={index} className="px-4 py-3">
                  <h4 className="font-medium">{page.title}</h4>
                  <p className="text-sm text-gray-600">ID: {page.pageId || page.page_id}</p>
                  <p className="text-sm text-gray-500 mt-1">{page.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Activity Log */}
      <div>
        <h3 className="font-medium mb-2">Activity Log:</h3>
        <div className="bg-gray-100 rounded p-3 max-h-40 overflow-y-auto text-sm">
          {logMessages.length === 0 ? (
            <p className="text-gray-500">No activity yet.</p>
          ) : (
            <div className="space-y-1">
              {logMessages.map((log, index) => (
                <div 
                  key={index} 
                  className={`${
                    log.type === 'error' ? 'text-red-600' : 'text-gray-800'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDebugger;
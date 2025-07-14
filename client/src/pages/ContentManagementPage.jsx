import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageEditor from '../components/admin/PageEditor';
import MediaLibrary from '../components/admin/MediaLibrary';
import ThemeSettings from '../components/admin/ThemeSettings';
import QuickLoginForm from '../components/QuickLoginForm';
import AdminDebugger from '../components/AdminDebugger';
import CmsNavigation from '../components/CmsNavigation';
import { useApp } from '../lib/AppContext';
import { authApi } from '../lib/api';

const ContentManagementPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pages');
  const { user, isAdmin, authLoading } = useApp();
  
  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, isAdmin, authLoading, navigate]);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'pages':
        return <PageEditor />;
      case 'media':
        return <MediaLibrary />;
      case 'themes':
        return <ThemeSettings />;
      default:
        return <PageEditor />;
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold">bPay</Link>
            <div className="hidden md:flex ml-10 space-x-6">
              <Link to="/dashboard" className="text-slate-300 hover:text-white">Dashboard</Link>
              {isAdmin && (
                <>
                  <Link to="/admin/settings" className="text-slate-300 hover:text-white">Admin Settings</Link>
                  <Link to="/admin/content" className="text-white font-medium">Content Management</Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-slate-300 hover:text-white">
              Notifications
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="font-medium">JD</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Content Management</h1>
            <p className="text-slate-600 mt-1">Edit website content, manage media files, and customize themes</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
            >
              View Website
            </button>
          </div>
        </div>
        
        {/* CMS Navigation Component */}
        <CmsNavigation />
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pages')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'pages'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'media'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('themes')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'themes'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Theme Settings
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        {!user ? (
          <div className="mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You need to be logged in with admin privileges to access the Content Management System.
                  </p>
                </div>
              </div>
            </div>
            <QuickLoginForm />
            
            {/* Add AdminDebugger for troubleshooting */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">CMS Troubleshooting</h3>
              <p className="text-sm text-gray-600 mb-4">
                The debugger below can help identify issues with the CMS functionality.
              </p>
              
              <div className="border-t border-gray-200 pt-4">
                <AdminDebugger />
              </div>
            </div>
          </div>
        ) : (
          <>
            {renderTabContent()}
            
            {/* Add logout button and debugger for authenticated users as well */}
            <div className="mt-8">
              <div className="mb-6 bg-gray-50 p-4 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Logged in as: <span className="text-blue-600">{user.username}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Admin status: {(user.isAdmin || user.is_admin) ? '✅ Admin' : '❌ Not admin'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      authApi.logout().then(() => window.location.reload());
                    }}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
              
              <details className="border rounded mb-6">
                <summary className="bg-gray-50 px-4 py-2 cursor-pointer font-medium text-sm">
                  CMS Troubleshooting Tools (Click to expand)
                </summary>
                <div className="p-4">
                  <AdminDebugger />
                </div>
              </details>
            </div>
          </>
        )}
        
        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => navigate('/admin/settings')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Admin Settings
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default ContentManagementPage;
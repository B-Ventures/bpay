import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { stripeApi, systemSettingsApi } from '../lib/api';
import { useApp } from '../lib/AppContext';

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, authLoading } = useApp();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentProvider, setCurrentProvider] = useState('stripe');
  const [supportedProviders, setSupportedProviders] = useState(['stripe', 'other_provider1', 'other_provider2']);
  const [regionalProviders, setRegionalProviders] = useState({});
  const [newRegion, setNewRegion] = useState({ region: '', provider: 'stripe' });
  
  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/dashboard');
    }
  }, [user, isAdmin, authLoading, navigate]);
  
  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Fetch all system settings
        const data = await systemSettingsApi.getAllSettings();
        setSettings(data);
        
        // Fetch current card provider
        const providerData = await systemSettingsApi.getCardProvider();
        setCurrentProvider(providerData.provider);
        setSupportedProviders(providerData.supportedProviders || ['stripe', 'other_provider1', 'other_provider2']);
        
        // Fetch regional providers
        const regionalData = await systemSettingsApi.getRegionalCardProviders();
        setRegionalProviders(regionalData.regionalProviders || {});
        
        setError(null);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleProviderChange = async (event) => {
    const newProvider = event.target.value;
    
    try {
      const data = await systemSettingsApi.updateCardProvider(newProvider);
      setCurrentProvider(data.provider);
      alert(`Successfully updated card provider to ${data.provider}`);
    } catch (err) {
      console.error('Error updating provider:', err);
      alert(`Failed to update provider: ${err.message}`);
    }
  };
  
  const handleRegionChange = (e) => {
    setNewRegion({ ...newRegion, region: e.target.value });
  };
  
  const handleRegionProviderChange = (e) => {
    setNewRegion({ ...newRegion, provider: e.target.value });
  };
  
  const addRegionalProvider = async () => {
    if (!newRegion.region.trim()) {
      alert('Please enter a region name');
      return;
    }
    
    // Create updated regional providers object
    const updatedRegionalProviders = {
      ...regionalProviders,
      [newRegion.region]: newRegion.provider,
    };
    
    try {
      const data = await systemSettingsApi.updateRegionalCardProviders(updatedRegionalProviders);
      setRegionalProviders(data.regionalProviders);
      setNewRegion({ region: '', provider: 'stripe' });
      alert('Successfully updated regional providers');
    } catch (err) {
      console.error('Error updating regional providers:', err);
      alert(`Failed to update regional providers: ${err.message}`);
    }
  };
  
  const removeRegionalProvider = async (regionToRemove) => {
    const updatedRegionalProviders = { ...regionalProviders };
    delete updatedRegionalProviders[regionToRemove];
    
    try {
      const data = await systemSettingsApi.updateRegionalCardProviders(updatedRegionalProviders);
      setRegionalProviders(data.regionalProviders);
      alert(`Successfully removed ${regionToRemove} region`);
    } catch (err) {
      console.error('Error updating regional providers:', err);
      alert(`Failed to remove regional provider: ${err.message}`);
    }
  };
  
  const testStripeConnection = async () => {
    try {
      const response = await stripeApi.testConnection();
      if (response.success) {
        alert('Stripe connection successful!');
      } else {
        alert(`Stripe connection failed: ${response.error}`);
      }
    } catch (err) {
      console.error('Error testing Stripe connection:', err);
      alert(`Failed to test Stripe connection: ${err.message}`);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white px-6 py-4 mb-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold">bPay</Link>
            <div className="hidden md:flex ml-10 space-x-6">
              <Link to="/dashboard" className="text-slate-300 hover:text-white">Dashboard</Link>
              {isAdmin && (
                <>
                  <Link to="/admin/settings" className="text-white font-medium">Admin Settings</Link>
                  <Link to="/admin/content" className="text-slate-300 hover:text-white">Content Management</Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-slate-300 hover:text-white">
              Notifications
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="font-medium">{user?.name?.substring(0, 2) || 'AD'}</span>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Virtual Card Provider Configuration</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">Global Provider</h3>
            <p className="text-gray-600 mb-3">
              Select the primary virtual card provider to use for all regions unless overridden:
            </p>
            
            <div className="flex items-center space-x-4">
              <select 
                value={currentProvider}
                onChange={handleProviderChange}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportedProviders.map(provider => (
                  <option key={provider} value={provider}>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </option>
                ))}
              </select>
              
              {currentProvider === 'stripe' && (
                <button 
                  onClick={testStripeConnection}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test Stripe Connection
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Regional Providers</h3>
            <p className="text-gray-600 mb-3">
              Configure different card providers for specific regions:
            </p>
            
            <div className="mb-4">
              <div className="flex flex-wrap items-center space-x-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Region name (e.g. US, EU, Asia)"
                  value={newRegion.region}
                  onChange={handleRegionChange}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select 
                  value={newRegion.provider}
                  onChange={handleRegionProviderChange}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {supportedProviders.map(provider => (
                    <option key={provider} value={provider}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={addRegionalProvider}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Region
                </button>
              </div>
            </div>
            
            {Object.keys(regionalProviders).length > 0 ? (
              <div className="border rounded">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(regionalProviders).map(([region, provider]) => (
                      <tr key={region}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {region}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button 
                            onClick={() => removeRegionalProvider(region)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500 italic">No regional providers configured</div>
            )}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">All System Settings</h2>
          
          <div className="border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settings.map((setting) => (
                  <tr key={setting.key}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {setting.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {setting.isSecret ? '********' : 
                        (typeof setting.value === 'object' ? 
                          JSON.stringify(setting.value) : setting.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {setting.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {setting.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 mr-2"
            >
              Back to Home
            </button>
            <button 
              onClick={() => navigate('/admin/content')}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Content Management
            </button>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        </div>
        
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
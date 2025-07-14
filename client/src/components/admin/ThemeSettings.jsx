import React, { useState, useEffect } from 'react';
import { contentManagementApi } from '../../lib/api';

const ThemeSettings = () => {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    primaryColor: '#3b82f6',
    backgroundColor: '#f9fafb',
    textColor: '#111827',
    accentColor: '#2563eb',
    secondaryColor: '#4b5563',
    fontPrimary: 'Inter, sans-serif',
    fontSecondary: 'Inter, sans-serif',
    borderRadius: '0.5rem',
    buttonStyle: 'rounded'
  });
  
  useEffect(() => {
    fetchThemes();
  }, []);
  
  const fetchThemes = async () => {
    setLoading(true);
    try {
      const data = await contentManagementApi.getAllThemes();
      setThemes(data);
      
      // Find active theme and select it by default
      const activeTheme = data.find(theme => theme.isActive);
      if (activeTheme) {
        setSelectedTheme(activeTheme);
        setFormData(activeTheme);
      } else if (data.length > 0) {
        setSelectedTheme(data[0]);
        setFormData(data[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching themes:', err);
      setError('Failed to load themes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setFormData(theme);
    setEditing(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleNewTheme = () => {
    // Start with default values
    const newTheme = {
      name: 'New Theme',
      primaryColor: '#3b82f6',
      backgroundColor: '#f9fafb',
      textColor: '#111827',
      accentColor: '#2563eb',
      secondaryColor: '#4b5563',
      fontPrimary: 'Inter, sans-serif',
      fontSecondary: 'Inter, sans-serif',
      borderRadius: '0.5rem',
      buttonStyle: 'rounded',
      isActive: false
    };
    
    setSelectedTheme(null);
    setFormData(newTheme);
    setEditing(true);
  };
  
  const handleEditToggle = () => {
    setEditing(!editing);
  };
  
  const handleActivateTheme = async () => {
    if (!selectedTheme) return;
    
    try {
      const activatedTheme = await contentManagementApi.activateTheme(selectedTheme.id);
      
      // Update the themes list with the new active status
      setThemes(prevThemes => 
        prevThemes.map(theme => ({
          ...theme,
          isActive: theme.id === selectedTheme.id
        }))
      );
      
      // Update the selected theme
      setSelectedTheme({
        ...selectedTheme,
        isActive: true
      });
      
      alert('Theme activated successfully');
    } catch (err) {
      console.error(`Error activating theme ${selectedTheme.id}:`, err);
      alert(`Failed to activate theme: ${err.message}`);
    }
  };
  
  const handleSaveTheme = async () => {
    setSaving(true);
    try {
      let savedTheme;
      
      if (selectedTheme && !editing) {
        // Not in edit mode, nothing to save
        setSaving(false);
        return;
      }
      
      if (selectedTheme) {
        // Update existing theme
        savedTheme = await contentManagementApi.updateTheme(selectedTheme.id, formData);
        
        // Update the themes list
        setThemes(prevThemes => 
          prevThemes.map(theme => 
            theme.id === savedTheme.id ? savedTheme : theme
          )
        );
        
        alert('Theme updated successfully');
      } else {
        // Create new theme
        savedTheme = await contentManagementApi.createTheme(formData);
        
        // Add the new theme to the list
        setThemes(prevThemes => [...prevThemes, savedTheme]);
        
        alert('Theme created successfully');
      }
      
      // Select the saved theme and exit edit mode
      setSelectedTheme(savedTheme);
      setEditing(false);
      
      setError(null);
    } catch (err) {
      console.error('Error saving theme:', err);
      setError(`Failed to save theme: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteTheme = async () => {
    if (!selectedTheme) return;
    
    if (!window.confirm(`Are you sure you want to delete the theme "${selectedTheme.name}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      const success = await contentManagementApi.deleteTheme(selectedTheme.id);
      
      if (success) {
        // Remove the deleted theme from the list
        const updatedThemes = themes.filter(theme => theme.id !== selectedTheme.id);
        setThemes(updatedThemes);
        
        // Select another theme if available
        if (updatedThemes.length > 0) {
          setSelectedTheme(updatedThemes[0]);
          setFormData(updatedThemes[0]);
        } else {
          setSelectedTheme(null);
          setFormData({
            name: '',
            primaryColor: '#3b82f6',
            backgroundColor: '#f9fafb',
            textColor: '#111827',
            accentColor: '#2563eb',
            secondaryColor: '#4b5563',
            fontPrimary: 'Inter, sans-serif',
            fontSecondary: 'Inter, sans-serif',
            borderRadius: '0.5rem',
            buttonStyle: 'rounded'
          });
        }
        
        setEditing(false);
        alert('Theme deleted successfully');
      }
    } catch (err) {
      console.error(`Error deleting theme ${selectedTheme.id}:`, err);
      alert(`Failed to delete theme: ${err.message}`);
    }
  };
  
  const renderColorPreview = () => {
    if (!formData) return null;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Theme Preview</h3>
        
        <div 
          className="p-6 rounded-lg mb-6"
          style={{ backgroundColor: formData.backgroundColor }}
        >
          <h4 
            className="text-xl font-bold mb-4"
            style={{ color: formData.textColor }}
          >
            Typography Example
          </h4>
          
          <p 
            className="mb-4"
            style={{ 
              color: formData.textColor,
              fontFamily: formData.fontPrimary
            }}
          >
            This is how your main text will appear on the site. The quick brown fox jumps over the lazy dog.
          </p>
          
          <p 
            className="mb-6 text-sm"
            style={{ 
              color: formData.secondaryColor,
              fontFamily: formData.fontSecondary
            }}
          >
            This is secondary text with a different color and potentially a different font.
          </p>
          
          <div className="space-y-4">
            <button 
              className="px-4 py-2 text-white"
              style={{ 
                backgroundColor: formData.primaryColor,
                borderRadius: formData.buttonStyle === 'rounded' ? formData.borderRadius : '0'
              }}
            >
              Primary Button
            </button>
            
            <div>
              <button 
                className="px-4 py-2 text-white mr-2"
                style={{ 
                  backgroundColor: formData.accentColor,
                  borderRadius: formData.buttonStyle === 'rounded' ? formData.borderRadius : '0'
                }}
              >
                Accent Button
              </button>
              
              <button 
                className="px-4 py-2 border"
                style={{ 
                  color: formData.textColor,
                  borderColor: formData.secondaryColor,
                  borderRadius: formData.buttonStyle === 'rounded' ? formData.borderRadius : '0'
                }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div 
              className="h-12 rounded mb-2"
              style={{ backgroundColor: formData.primaryColor }}
            ></div>
            <p className="text-xs font-medium">Primary Color</p>
            <p className="text-xs font-mono">{formData.primaryColor}</p>
          </div>
          
          <div className="text-center">
            <div 
              className="h-12 rounded mb-2"
              style={{ backgroundColor: formData.accentColor }}
            ></div>
            <p className="text-xs font-medium">Accent Color</p>
            <p className="text-xs font-mono">{formData.accentColor}</p>
          </div>
          
          <div className="text-center">
            <div 
              className="h-12 rounded mb-2 border"
              style={{ backgroundColor: formData.backgroundColor }}
            ></div>
            <p className="text-xs font-medium">Background</p>
            <p className="text-xs font-mono">{formData.backgroundColor}</p>
          </div>
          
          <div className="text-center">
            <div 
              className="h-12 rounded mb-2"
              style={{ 
                backgroundColor: formData.textColor,
                color: formData.backgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px'
              }}
            >
              Text
            </div>
            <p className="text-xs font-medium">Text Color</p>
            <p className="text-xs font-mono">{formData.textColor}</p>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading && themes.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Theme Settings</h2>
          
          <div className="space-x-2">
            <button
              onClick={handleNewTheme}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              New Theme
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-6 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
        {/* Themes List */}
        <div className="p-6 md:col-span-3 border-r border-gray-200">
          <h3 className="font-medium mb-4">Available Themes</h3>
          
          {themes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No themes available</p>
              <button
                onClick={handleNewTheme}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create Your First Theme
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {themes.map(theme => (
                <li key={theme.id}>
                  <button
                    onClick={() => handleThemeSelect(theme)}
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedTheme?.id === theme.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: theme.primaryColor }}
                      ></div>
                      <span>{theme.name}</span>
                      {theme.isActive && (
                        <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Theme Editor */}
        <div className="p-6 md:col-span-9">
          {!selectedTheme && !editing ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p className="mb-4">Select a theme to edit or create a new one</p>
              <button
                onClick={handleNewTheme}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create New Theme
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {editing 
                    ? (selectedTheme ? `Editing: ${selectedTheme.name}` : 'Create New Theme')
                    : selectedTheme.name
                  }
                </h3>
                
                <div className="space-x-2">
                  {selectedTheme && !editing && (
                    <>
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      >
                        Edit Theme
                      </button>
                      
                      {!selectedTheme.isActive && (
                        <button
                          onClick={handleActivateTheme}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Activate Theme
                        </button>
                      )}
                    </>
                  )}
                  
                  {editing && (
                    <button
                      onClick={handleSaveTheme}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Theme'}
                    </button>
                  )}
                  
                  {selectedTheme && themes.length > 1 && (
                    <button
                      onClick={handleDeleteTheme}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
              {renderColorPreview()}
              
              {editing ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Theme Properties</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Theme Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Button Style
                      </label>
                      <select
                        name="buttonStyle"
                        value={formData.buttonStyle}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="rounded">Rounded</option>
                        <option value="square">Square</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Color
                      </label>
                      <div className="flex">
                        <input
                          type="color"
                          name="primaryColor"
                          value={formData.primaryColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 border border-gray-300 rounded-l-md"
                        />
                        <input
                          type="text"
                          name="primaryColor"
                          value={formData.primaryColor}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Accent Color
                      </label>
                      <div className="flex">
                        <input
                          type="color"
                          name="accentColor"
                          value={formData.accentColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 border border-gray-300 rounded-l-md"
                        />
                        <input
                          type="text"
                          name="accentColor"
                          value={formData.accentColor}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Color
                      </label>
                      <div className="flex">
                        <input
                          type="color"
                          name="backgroundColor"
                          value={formData.backgroundColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 border border-gray-300 rounded-l-md"
                        />
                        <input
                          type="text"
                          name="backgroundColor"
                          value={formData.backgroundColor}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Color
                      </label>
                      <div className="flex">
                        <input
                          type="color"
                          name="textColor"
                          value={formData.textColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 border border-gray-300 rounded-l-md"
                        />
                        <input
                          type="text"
                          name="textColor"
                          value={formData.textColor}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secondary Color
                      </label>
                      <div className="flex">
                        <input
                          type="color"
                          name="secondaryColor"
                          value={formData.secondaryColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 border border-gray-300 rounded-l-md"
                        />
                        <input
                          type="text"
                          name="secondaryColor"
                          value={formData.secondaryColor}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Border Radius
                      </label>
                      <input
                        type="text"
                        name="borderRadius"
                        value={formData.borderRadius}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.5rem, 8px, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Font
                      </label>
                      <input
                        type="text"
                        name="fontPrimary"
                        value={formData.fontPrimary}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Font name, fallbacks"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secondary Font
                      </label>
                      <input
                        type="text"
                        name="fontSecondary"
                        value={formData.fontSecondary}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Font name, fallbacks"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                selectedTheme && (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Theme Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 ${selectedTheme.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                          {selectedTheme.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2">
                          {new Date(selectedTheme.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <span className="ml-2">
                          {new Date(selectedTheme.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2">{selectedTheme.id}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
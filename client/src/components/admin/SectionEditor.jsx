import React, { useState } from 'react';
import JSONEditor from './JSONEditor';

const SectionEditor = ({ 
  section, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [jsonEditMode, setJsonEditMode] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [localSection, setLocalSection] = useState(section);
  const [saving, setSaving] = useState(false);
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
    
    // Reset edit modes when collapsing
    if (expanded) {
      setEditMode(false);
      setJsonEditMode(false);
    }
  };
  
  const handleEditModeToggle = () => {
    // Update local state with current section when entering edit mode
    if (!editMode) {
      setLocalSection({...section});
    }
    
    setEditMode(!editMode);
    setJsonEditMode(false);
  };
  
  const handleJsonEditToggle = () => {
    if (!jsonEditMode) {
      // Enter JSON edit mode - prepare the JSON string
      setJsonValue(JSON.stringify(section, null, 2));
    }
    
    setJsonEditMode(!jsonEditMode);
    setEditMode(false);
  };
  
  const handleSaveJson = async () => {
    try {
      // Parse the JSON to validate it
      const parsedJson = JSON.parse(jsonValue);
      
      // Update the section
      setSaving(true);
      const success = await onUpdate(parsedJson);
      
      if (success) {
        setJsonEditMode(false);
        setJsonError(null);
      }
    } catch (err) {
      console.error('JSON parse error:', err);
      setJsonError(`Invalid JSON: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested settings properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setLocalSection({
        ...localSection,
        [parent]: {
          ...localSection[parent],
          [child]: value
        }
      });
    } else {
      setLocalSection({
        ...localSection,
        [name]: value
      });
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    // Handle nested settings properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setLocalSection({
        ...localSection,
        [parent]: {
          ...localSection[parent],
          [child]: checked
        }
      });
    } else {
      setLocalSection({
        ...localSection,
        [name]: checked
      });
    }
  };
  
  const handleJsonContentChange = (e) => {
    try {
      const value = e.target.value;
      
      // Try to parse it to validate, but keep as string in state
      JSON.parse(value);
      
      setLocalSection({
        ...localSection,
        content: value
      });
      
      setJsonError(null);
    } catch (err) {
      console.error('JSON content parse error:', err);
      setJsonError(`Invalid JSON: ${err.message}`);
    }
  };
  
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Try to ensure content is an object if it's a string
      let updatedSection = {...localSection};
      
      if (typeof updatedSection.content === 'string') {
        try {
          updatedSection.content = JSON.parse(updatedSection.content);
        } catch (err) {
          // Keep as is if parsing fails
          console.warn('Failed to parse content JSON string:', err);
        }
      }
      
      const success = await onUpdate(updatedSection);
      
      if (success) {
        setEditMode(false);
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Determine preview content based on section type
  const renderPreview = () => {
    if (!section) return null;
    
    switch (section.type) {
      case 'hero':
        return (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold text-lg">{section.content?.headline || 'Hero Section'}</h3>
            {section.content?.subheadline && <p className="text-gray-600">{section.content.subheadline}</p>}
            {section.content?.buttonText && (
              <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
                {section.content.buttonText}
              </button>
            )}
          </div>
        );
        
      case 'features':
        return (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-medium mb-2">Features Section</h3>
            <div className="grid grid-cols-3 gap-2">
              {Array.isArray(section.content?.features) && section.content.features.map((feature, idx) => (
                <div key={idx} className="p-2 bg-white rounded">
                  <p className="font-medium">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'content':
        return (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-medium mb-2">Content Section</h3>
            {section.content?.title && <p className="font-bold">{section.content.title}</p>}
            {section.content?.body && <p className="text-sm text-gray-600">{section.content.body.substring(0, 100)}...</p>}
          </div>
        );
        
      default:
        return (
          <div className="bg-gray-100 p-4 rounded flex justify-center items-center text-gray-500">
            <span>Custom Section</span>
          </div>
        );
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Section Header */}
      <div 
        className={`p-4 flex justify-between items-center ${
          expanded ? 'bg-gray-50 border-b border-gray-200' : ''
        }`}
      >
        <div className="flex items-center">
          <button
            onClick={handleToggleExpand}
            className="mr-2 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200"
            aria-label={expanded ? 'Collapse section' : 'Expand section'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <div>
            <h4 className="font-medium">{section.name}</h4>
            <span className="text-xs text-gray-500">
              {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isFirst && (
            <button
              onClick={onMoveUp}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500"
              aria-label="Move section up"
              title="Move Up"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          
          {!isLast && (
            <button
              onClick={onMoveDown}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500"
              aria-label="Move section down"
              title="Move Down"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          
          <div className={`w-3 h-3 rounded-full ${section.settings?.isVisible ? 'bg-green-500' : 'bg-red-500'}`} title={section.settings?.isVisible ? 'Visible' : 'Hidden'}></div>
        </div>
      </div>
      
      {/* Section Content - Expanded View */}
      {expanded && (
        <div className="p-4">
          {!editMode && !jsonEditMode && (
            <>
              <div className="flex justify-between mb-4">
                <h4 className="font-medium">Section Preview</h4>
                
                <div className="space-x-2">
                  <button
                    onClick={handleEditModeToggle}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Edit Settings
                  </button>
                  
                  <button
                    onClick={handleJsonEditToggle}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Edit as JSON
                  </button>
                  
                  <button
                    onClick={onDelete}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                {renderPreview()}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2">{section.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Visibility:</span>
                  <span className="ml-2">{section.settings?.isVisible ? 'Visible' : 'Hidden'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Order:</span>
                  <span className="ml-2">{section.order}</span>
                </div>
                <div>
                  <span className="text-gray-500">Background:</span>
                  <span className="ml-2">{section.settings?.backgroundColor || 'Default'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Padding:</span>
                  <span className="ml-2">{section.settings?.padding || 'Default'}</span>
                </div>
              </div>
            </>
          )}
          
          {editMode && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <h4 className="font-medium">Edit Section</h4>
                
                <div className="space-x-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={localSection.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Type
                  </label>
                  <select
                    name="type"
                    value={localSection.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="custom">Custom</option>
                    <option value="hero">Hero</option>
                    <option value="features">Features</option>
                    <option value="content">Content</option>
                    <option value="cta">Call to Action</option>
                    <option value="testimonials">Testimonials</option>
                    <option value="pricing">Pricing</option>
                    <option value="faq">FAQ</option>
                    <option value="contact">Contact</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <select
                    name="settings.backgroundColor"
                    value={localSection.settings?.backgroundColor || 'bg-white'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bg-white">White</option>
                    <option value="bg-gray-50">Light Gray</option>
                    <option value="bg-gray-100">Gray</option>
                    <option value="bg-blue-50">Light Blue</option>
                    <option value="bg-green-50">Light Green</option>
                    <option value="bg-red-50">Light Red</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Padding
                  </label>
                  <select
                    name="settings.padding"
                    value={localSection.settings?.padding || 'py-12'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="py-4">Small (py-4)</option>
                    <option value="py-8">Medium (py-8)</option>
                    <option value="py-12">Large (py-12)</option>
                    <option value="py-16">Extra Large (py-16)</option>
                    <option value="py-24">Huge (py-24)</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    id={`visible-${section.id}`}
                    name="settings.isVisible"
                    type="checkbox"
                    checked={localSection.settings?.isVisible ?? true}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`visible-${section.id}`} className="ml-2 block text-sm text-gray-900">
                    Visible
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Content (JSON)
                </label>
                <textarea
                  value={typeof localSection.content === 'object' 
                    ? JSON.stringify(localSection.content, null, 2) 
                    : localSection.content || '{}'}
                  onChange={handleJsonContentChange}
                  className={`w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                    jsonError ? 'border-red-500 text-red-800' : ''
                  }`}
                />
                {jsonError && (
                  <p className="mt-1 text-sm text-red-600">{jsonError}</p>
                )}
              </div>
            </div>
          )}
          
          {jsonEditMode && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <h4 className="font-medium">Edit Section JSON</h4>
                
                <div className="space-x-2">
                  <button
                    onClick={() => setJsonEditMode(false)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSaveJson}
                    disabled={!!jsonError || saving}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save JSON'}
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <JSONEditor
                  value={jsonValue}
                  onChange={setJsonValue}
                  error={jsonError}
                />
              </div>
              
              {jsonError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                  <p>{jsonError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionEditor;
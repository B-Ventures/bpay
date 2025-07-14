import React, { useState, useEffect } from 'react';
import SectionEditor from './SectionEditor';
import JSONEditor from './JSONEditor';
import { contentManagementApi } from '../../lib/api';

const PageEditor = () => {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [jsonEditMode, setJsonEditMode] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState(null);
  
  useEffect(() => {
    fetchPages();
  }, []);
  
  const fetchPages = async () => {
    setLoading(true);
    try {
      const data = await contentManagementApi.getAllPageContent();
      setPages(data);
      
      // Set the first page as selected by default
      if (data.length > 0) {
        setSelectedPage(data[0]);
        fetchSections(data[0].page_id); // Use page_id instead of id
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchSections = async (pageId) => {
    try {
      console.log('Fetching sections for pageId:', pageId, typeof pageId);
      const data = await contentManagementApi.getSectionsByPage(pageId);
      console.log('Received sections:', data);
      setSections(data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching sections for page ${pageId}:`, err);
      setError('Failed to load page sections. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageSelect = (page) => {
    setSelectedPage(page);
    setEditMode(false);
    setJsonEditMode(false);
    
    // Get the page ID string (page_id) not the numeric ID
    const pageIdString = page.page_id || page.pageId;
    
    console.log('Selected page:', page);
    console.log('Using page_id for sections:', pageIdString);
    
    if (!pageIdString) {
      console.error('No valid page_id found in the page object:', page);
      setError('Page ID is missing or invalid');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetchSections(pageIdString);
  };
  
  const handleCreatePage = async () => {
    const pageName = prompt('Enter a name for the new page:');
    if (!pageName) return;
    
    // Create a URL-friendly pageId from the page name
    const pageId = pageName.toLowerCase().replace(/\s+/g, '-');
    
    console.log('Creating new page with pageId:', pageId);
    
    const defaultTemplate = {
      page_id: pageId, // Use snake_case to match database schema
      pageId: pageId, // Include both forms for compatibility
      title: pageName,
      description: 'Page description',
      status: 'published',
      metadata: {
        slug: pageId,
        metaTags: {},
        settings: {
          isPublished: true,
          layout: 'default',
          access: 'public'
        }
      }
    };
    
    try {
      const newPage = await contentManagementApi.createPageContent(defaultTemplate);
      
      // Update pages list
      setPages(prev => [...prev, newPage]);
      
      // Select the new page
      setSelectedPage(newPage);
      setSections([]);
      setError(null);
    } catch (err) {
      console.error('Error creating page:', err);
      setError(`Failed to create page: ${err.message}`);
    }
  };
  
  const handleDeletePage = async () => {
    if (!selectedPage) return;
    
    // Get page title for confirmation message
    const pageTitle = selectedPage.title || selectedPage.name || 'this page';
    
    if (!window.confirm(`Are you sure you want to delete "${pageTitle}"? This cannot be undone and will delete all sections within the page.`)) {
      return;
    }
    
    // Get page ID from selectedPage.pageId (string) or fall back to selectedPage.page_id or selectedPage.id
    const pageId = selectedPage.pageId || selectedPage.page_id || selectedPage.id;
    console.log('Deleting page with ID:', pageId);
    
    try {
      const success = await contentManagementApi.deletePageContent(pageId);
      
      if (success) {
        // Remove the deleted page from the list - handle both id and pageId as identifiers
        const updatedPages = pages.filter(page => 
          (page.pageId !== pageId) && (page.page_id !== pageId) && (page.id !== pageId)
        );
        setPages(updatedPages);
        
        // Select another page if available
        if (updatedPages.length > 0) {
          setSelectedPage(updatedPages[0]);
          const nextPageId = updatedPages[0].pageId || updatedPages[0].page_id || updatedPages[0].id;
          fetchSections(nextPageId);
        } else {
          setSelectedPage(null);
          setSections([]);
        }
        
        setEditMode(false);
        setJsonEditMode(false);
        setError(null);
      }
    } catch (err) {
      console.error(`Error deleting page ${pageId}:`, err);
      setError(`Failed to delete page: ${err.message}`);
    }
  };
  
  const handleUpdatePage = async (updates) => {
    if (!selectedPage) return;
    
    // Get page ID from selectedPage.pageId (string) or fall back to selectedPage.page_id or selectedPage.id
    const pageId = selectedPage.pageId || selectedPage.page_id || selectedPage.id;
    console.log('Updating page with ID:', pageId);
    
    setSaving(true);
    try {
      const updatedPage = await contentManagementApi.updatePageContent(pageId, updates);
      
      // Update the page in the list - matching by any id field
      setPages(prev => 
        prev.map(page => {
          if (
            (page.pageId === pageId) || 
            (page.page_id === pageId) || 
            (page.id === pageId)
          ) {
            return updatedPage;
          }
          return page;
        })
      );
      
      // Update the selected page
      setSelectedPage(updatedPage);
      
      setError(null);
      return true;
    } catch (err) {
      console.error(`Error updating page ${pageId}:`, err);
      setError(`Failed to update page: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  const handleEditModeToggle = () => {
    setEditMode(!editMode);
    setJsonEditMode(false);
  };
  
  const handleJsonEditToggle = () => {
    if (!jsonEditMode) {
      // Enter JSON edit mode - prepare the JSON string
      setJsonValue(JSON.stringify(selectedPage, null, 2));
    } else {
      // Exit JSON edit mode - just switch the toggle
    }
    
    setJsonEditMode(!jsonEditMode);
    setEditMode(false);
  };
  
  const handleSavePageJson = async () => {
    try {
      // Parse the JSON to validate it
      const parsedJson = JSON.parse(jsonValue);
      
      // Update the page
      const success = await handleUpdatePage(parsedJson);
      
      if (success) {
        setJsonEditMode(false);
        setJsonError(null);
      }
    } catch (err) {
      console.error('JSON parse error:', err);
      setJsonError(`Invalid JSON: ${err.message}`);
    }
  };
  
  const handleCreateSection = async () => {
    if (!selectedPage) return;
    
    const sectionName = prompt('Enter a name for the new section:');
    if (!sectionName) return;
    
    // Get the page ID string (page_id) not the numeric ID
    const pageIdString = selectedPage.page_id || selectedPage.pageId;
    
    if (!pageIdString) {
      console.error('No valid page_id found in the selectedPage object:', selectedPage);
      setError('Page ID is missing or invalid - cannot create section');
      return;
    }
    
    // Create unique section ID
    const sectionId = `section-${Date.now()}`;
    
    const defaultSection = {
      page_id: pageIdString, // Use snake_case for DB compatibility
      pageId: pageIdString, // Include camelCase for code compatibility
      section_id: sectionId, // Use snake_case for DB compatibility
      sectionId: sectionId, // Include camelCase for code compatibility
      name: sectionName,
      content: {
        title: sectionName,
        description: 'New section content',
        items: []
      },
      order: sections.length > 0 ? Math.max(...sections.map(s => s.order || 0)) + 1 : 1,
      isActive: true
    };
    
    console.log('Creating section for page:', pageIdString, 'with section data:', defaultSection);
    
    try {
      const newSection = await contentManagementApi.createSectionContent(pageIdString, defaultSection);
      
      // Add the new section to the list
      setSections(prev => [...prev, newSection]);
      
      setError(null);
    } catch (err) {
      console.error('Error creating section:', err);
      setError(`Failed to create section: ${err.message}`);
    }
  };
  
  const handleUpdateSection = async (sectionId, updates) => {
    if (!selectedPage) return;
    
    // Get the page ID string (page_id) not the numeric ID
    const pageIdString = selectedPage.page_id || selectedPage.pageId;
    
    if (!pageIdString) {
      console.error('No valid page_id found in the selectedPage object:', selectedPage);
      setError('Page ID is missing or invalid - cannot update section');
      return false;
    }
    
    console.log('Updating section for page:', pageIdString, 'with section ID:', sectionId);
    
    try {
      const updatedSection = await contentManagementApi.updateSectionContent(
        pageIdString, 
        sectionId, 
        updates
      );
      
      // Update the section in the list
      setSections(prev => 
        prev.map(section => 
          section.id === updatedSection.id ? updatedSection : section
        )
      );
      
      setError(null);
      return true;
    } catch (err) {
      console.error(`Error updating section ${sectionId}:`, err);
      setError(`Failed to update section: ${err.message}`);
      return false;
    }
  };
  
  const handleDeleteSection = async (sectionId) => {
    if (!selectedPage) return;
    
    if (!window.confirm('Are you sure you want to delete this section? This cannot be undone.')) {
      return;
    }
    
    // Get the page ID string (page_id) not the numeric ID
    const pageIdString = selectedPage.page_id || selectedPage.pageId;
    
    if (!pageIdString) {
      console.error('No valid page_id found in the selectedPage object:', selectedPage);
      setError('Page ID is missing or invalid - cannot delete section');
      return;
    }
    
    console.log('Deleting section for page:', pageIdString, 'with section ID:', sectionId);
    
    try {
      const success = await contentManagementApi.deleteSectionContent(
        pageIdString, 
        sectionId
      );
      
      if (success) {
        // Remove the deleted section from the list
        setSections(prev => prev.filter(section => section.id !== sectionId));
        setError(null);
      }
    } catch (err) {
      console.error(`Error deleting section ${sectionId}:`, err);
      setError(`Failed to delete section: ${err.message}`);
    }
  };
  
  const handleMoveSection = async (sectionId, direction) => {
    if (!selectedPage || sections.length < 2) return;
    
    const currentIndex = sections.findIndex(section => section.id === sectionId);
    if (currentIndex === -1) return;
    
    // Calculate the new index
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1) 
      : Math.min(sections.length - 1, currentIndex + 1);
    
    // Don't proceed if we're already at the boundary
    if (newIndex === currentIndex) return;
    
    const updatedSections = [...sections];
    const sectionToMove = updatedSections[currentIndex];
    const otherSection = updatedSections[newIndex];
    
    // Swap the order
    const tempOrder = sectionToMove.order;
    sectionToMove.order = otherSection.order;
    otherSection.order = tempOrder;
    
    // Update both sections in the database
    try {
      await Promise.all([
        handleUpdateSection(sectionToMove.id, { order: sectionToMove.order }),
        handleUpdateSection(otherSection.id, { order: otherSection.order })
      ]);
      
      // Resort the sections by order
      setSections([...updatedSections].sort((a, b) => a.order - b.order));
      
      setError(null);
    } catch (err) {
      console.error('Error reordering sections:', err);
      setError('Failed to reorder sections. Please try again.');
    }
  };
  
  const renderSectionEditor = (section) => {
    return (
      <SectionEditor
        key={section.id}
        section={section}
        onUpdate={(updates) => handleUpdateSection(section.id, updates)}
        onDelete={() => handleDeleteSection(section.id)}
        onMoveUp={() => handleMoveSection(section.id, 'up')}
        onMoveDown={() => handleMoveSection(section.id, 'down')}
        isFirst={section.order === Math.min(...sections.map(s => s.order))}
        isLast={section.order === Math.max(...sections.map(s => s.order))}
      />
    );
  };
  
  if (loading && pages.length === 0) {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Page Editor</h2>
          
          <div className="flex gap-4">
            <button
              onClick={handleCreatePage}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create New Page
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
      
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        {/* Pages Sidebar */}
        <div className="p-6 md:col-span-3 border-r border-gray-200">
          <h3 className="font-medium mb-4">Pages</h3>
          
          {pages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No pages available</p>
              <button
                onClick={handleCreatePage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create Your First Page
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {pages.map(page => (
                <li key={page.id}>
                  <button
                    onClick={() => handlePageSelect(page)}
                    className={`w-full text-left px-4 py-2 rounded ${
                      selectedPage?.id === page.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <span>{page.title}</span>
                      {page.status === 'published' && (
                        <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Published
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      /{page.page_id}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Main Editor Area */}
        <div className="p-6 md:col-span-9 overflow-auto">
          {!selectedPage ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mb-4">Select a page to edit or create a new one</p>
              <button
                onClick={handleCreatePage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create New Page
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {selectedPage.title}
                </h3>
                
                <div className="space-x-2">
                  <button
                    onClick={handleEditModeToggle}
                    className={`px-4 py-2 ${
                      editMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    } rounded hover:bg-gray-300`}
                  >
                    {editMode ? 'Exit Edit Mode' : 'Edit Page Settings'}
                  </button>
                  
                  <button
                    onClick={handleJsonEditToggle}
                    className={`px-4 py-2 ${
                      jsonEditMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    } rounded hover:bg-gray-300`}
                  >
                    {jsonEditMode ? 'Exit JSON Mode' : 'Edit as JSON'}
                  </button>
                  
                  {!editMode && !jsonEditMode && (
                    <button
                      onClick={handleDeletePage}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
              {jsonEditMode ? (
                <div className="space-y-4">
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
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePageJson}
                      disabled={!!jsonError}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      Save JSON
                    </button>
                  </div>
                </div>
              ) : editMode ? (
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Page Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Page Name
                        </label>
                        <input
                          type="text"
                          value={selectedPage.name || ''}
                          onChange={(e) => setSelectedPage({
                            ...selectedPage,
                            name: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slug
                        </label>
                        <input
                          type="text"
                          value={selectedPage.slug || ''}
                          onChange={(e) => setSelectedPage({
                            ...selectedPage,
                            slug: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          URL path: /{selectedPage.slug}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Page Title
                        </label>
                        <input
                          type="text"
                          value={selectedPage.title || ''}
                          onChange={(e) => setSelectedPage({
                            ...selectedPage,
                            title: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Layout
                        </label>
                        <select
                          value={selectedPage.settings?.layout || 'default'}
                          onChange={(e) => setSelectedPage({
                            ...selectedPage,
                            settings: {
                              ...selectedPage.settings,
                              layout: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="default">Default</option>
                          <option value="landing">Landing Page</option>
                          <option value="fullwidth">Full Width</option>
                          <option value="sidebar">With Sidebar</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={selectedPage.description || ''}
                          onChange={(e) => setSelectedPage({
                            ...selectedPage,
                            description: e.target.value
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center">
                          <input
                            id="published"
                            type="checkbox"
                            checked={selectedPage.settings?.isPublished || false}
                            onChange={(e) => setSelectedPage({
                              ...selectedPage,
                              settings: {
                                ...selectedPage.settings,
                                isPublished: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                            Published
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Access
                        </label>
                        <select
                          value={selectedPage.settings?.access || 'public'}
                          onChange={(e) => setSelectedPage({
                            ...selectedPage,
                            settings: {
                              ...selectedPage.settings,
                              access: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private (requires login)</option>
                          <option value="admin">Admin Only</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={handleEditModeToggle}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={() => {
                          handleUpdatePage(selectedPage).then(success => {
                            if (success) setEditMode(false);
                          });
                        }}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6 p-6 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700">Page Details</h4>
                        <dl className="mt-2 text-sm">
                          <div className="py-1 flex justify-between">
                            <dt className="text-gray-500">URL Path:</dt>
                            <dd className="font-mono">/{selectedPage.page_id}</dd>
                          </div>
                          <div className="py-1 flex justify-between">
                            <dt className="text-gray-500">Title:</dt>
                            <dd>{selectedPage.title}</dd>
                          </div>
                          <div className="py-1 flex justify-between">
                            <dt className="text-gray-500">Layout:</dt>
                            <dd>{selectedPage.settings?.layout || 'default'}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700">Status</h4>
                        <dl className="mt-2 text-sm">
                          <div className="py-1 flex justify-between">
                            <dt className="text-gray-500">Published:</dt>
                            <dd>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                selectedPage.status === 'published' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {selectedPage.status === 'published' ? 'Yes' : 'No'}
                              </span>
                            </dd>
                          </div>
                          <div className="py-1 flex justify-between">
                            <dt className="text-gray-500">Access:</dt>
                            <dd>{selectedPage.settings?.access || 'public'}</dd>
                          </div>
                          <div className="py-1 flex justify-between">
                            <dt className="text-gray-500">Last Updated:</dt>
                            <dd>{new Date(selectedPage.updatedAt).toLocaleString()}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    {selectedPage.description && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700">Description</h4>
                        <p className="mt-1 text-sm text-gray-600">{selectedPage.description}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Page Sections</h3>
                      
                      <button
                        onClick={handleCreateSection}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add Section
                      </button>
                    </div>
                    
                    {loading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : sections.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <p className="text-gray-500 mb-4">No sections available for this page</p>
                        <button
                          onClick={handleCreateSection}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Add Your First Section
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {sections
                          .sort((a, b) => a.order - b.order)
                          .map(section => renderSectionEditor(section))
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageEditor;
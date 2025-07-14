import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const SimpleCmsPage = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pages');
  const [editMode, setEditMode] = useState(false);
  const [pageToEdit, setPageToEdit] = useState(null);
  const [sectionToEdit, setSectionToEdit] = useState(null);

  // Initial data fetch
  useEffect(() => {
    fetchPages();
  }, []);

  // Helper function to make API requests with proper error handling
  const apiRequest = async (method, url, data = null) => {
    try {
      const config = {
        method,
        url: `/api${url}`,
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      };
      
      if (data && (method === 'post' || method === 'put')) {
        config.data = data;
      }
      
      console.log(`Making ${method.toUpperCase()} request to ${config.url}`);
      const response = await axios(config);
      console.log(`Response from ${config.url}:`, response.data);
      return response.data;
    } catch (err) {
      console.error(`Error in ${method.toUpperCase()} ${url}:`, err);
      throw err;
    }
  };

  // Fetch all pages
  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('get', '/content-management/pages');
      setPages(data);
      
      // Auto-select first page if none is selected
      if (data.length > 0 && !selectedPage) {
        setSelectedPage(data[0]);
        fetchSections(data[0].pageId || data[0].page_id);
      }
    } catch (err) {
      setError('Failed to load pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sections for a page
  const fetchSections = async (pageId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching sections for pageId:', pageId);
      const data = await apiRequest('get', `/content-management/pages/${pageId}/sections`);
      console.log('Sections data:', data);
      setSections(data);
    } catch (err) {
      console.error(`Error fetching sections for page ${pageId}:`, err);
      setError('Failed to load sections. Please try again.');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle page selection
  const handlePageSelect = (page) => {
    setSelectedPage(page);
    setEditMode(false);
    
    // Get page ID from either camelCase or snake_case property
    const pageId = page.pageId || page.page_id;
    if (pageId) {
      fetchSections(pageId);
    } else {
      console.error('No valid page_id found in page object:', page);
      setError('Page ID is missing or invalid');
    }
  };

  // Create new page
  const handleCreatePage = async () => {
    const title = prompt('Enter page title:');
    if (!title) return;
    
    const pageId = title.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const newPage = await apiRequest('post', '/content-management/pages', {
        page_id: pageId,
        title,
        status: 'published'
      });
      
      setPages([...pages, newPage]);
      setSelectedPage(newPage);
      setSections([]);
    } catch (err) {
      setError('Failed to create page: ' + (err.response?.data?.error || err.message));
    }
  };

  // Create new section
  const handleCreateSection = async () => {
    if (!selectedPage) return;
    
    const name = prompt('Enter section name:');
    if (!name) return;
    
    const pageId = selectedPage.pageId || selectedPage.page_id;
    const sectionId = `section-${Date.now()}`;
    
    try {
      const newSection = await apiRequest('post', `/content-management/pages/${pageId}/sections`, {
        section_id: sectionId,
        name,
        content: {
          title: name,
          description: 'New section content'
        },
        order: sections.length + 1,
        isActive: true
      });
      
      setSections([...sections, newSection]);
    } catch (err) {
      setError('Failed to create section: ' + (err.response?.data?.error || err.message));
    }
  };

  // Save edited page
  const handleSavePage = async () => {
    if (!pageToEdit) return;
    
    const pageId = pageToEdit.pageId || pageToEdit.page_id;
    
    try {
      const updatedPage = await apiRequest('put', `/content-management/pages/${pageId}`, pageToEdit);
      
      setPages(pages.map(p => 
        (p.pageId === pageId || p.page_id === pageId) ? updatedPage : p
      ));
      setSelectedPage(updatedPage);
      setEditMode(false);
      setPageToEdit(null);
    } catch (err) {
      setError('Failed to update page: ' + (err.response?.data?.error || err.message));
    }
  };

  // Save edited section
  const handleSaveSection = async () => {
    if (!sectionToEdit || !selectedPage) return;
    
    const pageId = selectedPage.pageId || selectedPage.page_id;
    const sectionId = sectionToEdit.sectionId || sectionToEdit.section_id;
    
    try {
      const updatedSection = await apiRequest('put', `/content-management/pages/${pageId}/sections/${sectionId}`, sectionToEdit);
      
      setSections(sections.map(s => 
        (s.sectionId === sectionId || s.section_id === sectionId) ? updatedSection : s
      ));
      setEditMode(false);
      setSectionToEdit(null);
    } catch (err) {
      setError('Failed to update section: ' + (err.response?.data?.error || err.message));
    }
  };

  // Delete page
  const handleDeletePage = async () => {
    if (!selectedPage) return;
    
    if (!window.confirm(`Are you sure you want to delete the page "${selectedPage.title}"?`)) {
      return;
    }
    
    const pageId = selectedPage.pageId || selectedPage.page_id;
    
    try {
      await apiRequest('delete', `/content-management/pages/${pageId}`);
      
      const updatedPages = pages.filter(p => 
        p.pageId !== pageId && p.page_id !== pageId
      );
      setPages(updatedPages);
      
      if (updatedPages.length > 0) {
        setSelectedPage(updatedPages[0]);
        const nextPageId = updatedPages[0].pageId || updatedPages[0].page_id;
        fetchSections(nextPageId);
      } else {
        setSelectedPage(null);
        setSections([]);
      }
    } catch (err) {
      setError('Failed to delete page: ' + (err.response?.data?.error || err.message));
    }
  };

  // Delete section
  const handleDeleteSection = async (section) => {
    if (!selectedPage) return;
    
    if (!window.confirm(`Are you sure you want to delete the section "${section.name}"?`)) {
      return;
    }
    
    const pageId = selectedPage.pageId || selectedPage.page_id;
    const sectionId = section.sectionId || section.section_id;
    
    try {
      await apiRequest('delete', `/content-management/pages/${pageId}/sections/${sectionId}`);
      
      setSections(sections.filter(s => 
        s.sectionId !== sectionId && s.section_id !== sectionId
      ));
    } catch (err) {
      setError('Failed to delete section: ' + (err.response?.data?.error || err.message));
    }
  };

  // Edit page
  const handleEditPage = () => {
    setPageToEdit({...selectedPage});
    setSectionToEdit(null);
    setEditMode(true);
  };

  // Edit section
  const handleEditSection = (section) => {
    setSectionToEdit({...section});
    setPageToEdit(null);
    setEditMode(true);
  };

  // Render page list
  const renderPageList = () => {
    if (pages.length === 0) {
      return (
        <div className="text-center p-4">
          <p className="text-gray-500 mb-3">No pages found</p>
          <button 
            onClick={handleCreatePage}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create First Page
          </button>
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">Pages</h3>
          <button 
            onClick={handleCreatePage}
            className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            + Add Page
          </button>
        </div>
        <ul className="border rounded divide-y">
          {pages.map(page => (
            <li 
              key={page.id} 
              onClick={() => handlePageSelect(page)}
              className={`p-3 cursor-pointer hover:bg-gray-50 ${
                selectedPage?.id === page.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="font-medium">{page.title}</div>
              <div className="text-sm text-gray-500">/{page.pageId || page.page_id}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render sections
  const renderSections = () => {
    if (!selectedPage) {
      return (
        <div className="text-center p-4">
          <p className="text-gray-500">Select a page to view its sections</p>
        </div>
      );
    }
    
    if (sections.length === 0) {
      return (
        <div className="text-center p-4">
          <p className="text-gray-500 mb-3">No sections found for this page</p>
          <button 
            onClick={handleCreateSection}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create First Section
          </button>
        </div>
      );
    }
    
    return (
      <div>
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">Sections for {selectedPage.title}</h3>
          <button 
            onClick={handleCreateSection}
            className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            + Add Section
          </button>
        </div>
        <div className="space-y-4">
          {sections.map(section => (
            <div key={section.id} className="border rounded p-4">
              <div className="flex justify-between">
                <h4 className="font-medium">{section.name}</h4>
                <div className="space-x-2">
                  <button 
                    onClick={() => handleEditSection(section)}
                    className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteSection(section)}
                    className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-sm text-gray-500">Content:</div>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(section.content, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render edit form for page
  const renderPageEditForm = () => {
    if (!pageToEdit) return null;
    
    return (
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-4">Edit Page</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Title
            </label>
            <input
              type="text"
              value={pageToEdit.title || ''}
              onChange={(e) => setPageToEdit({...pageToEdit, title: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={pageToEdit.description || ''}
              onChange={(e) => setPageToEdit({...pageToEdit, description: e.target.value})}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={pageToEdit.status || 'published'}
              onChange={(e) => setPageToEdit({...pageToEdit, status: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => { setEditMode(false); setPageToEdit(null); }}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePage}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render edit form for section
  const renderSectionEditForm = () => {
    if (!sectionToEdit) return null;
    
    return (
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-4">Edit Section</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section Name
            </label>
            <input
              type="text"
              value={sectionToEdit.name || ''}
              onChange={(e) => setSectionToEdit({...sectionToEdit, name: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content (JSON)
            </label>
            <textarea
              value={JSON.stringify(sectionToEdit.content || {}, null, 2)}
              onChange={(e) => {
                try {
                  const content = JSON.parse(e.target.value);
                  setSectionToEdit({...sectionToEdit, content});
                } catch (err) {
                  // Don't update if invalid JSON
                  console.error('Invalid JSON');
                }
              }}
              className="w-full px-3 py-2 border rounded font-mono"
              rows={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <input
              type="number"
              value={sectionToEdit.order || 0}
              onChange={(e) => setSectionToEdit({...sectionToEdit, order: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded"
              min={0}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={sectionToEdit.isActive || false}
              onChange={(e) => setSectionToEdit({...sectionToEdit, isActive: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => { setEditMode(false); setSectionToEdit(null); }}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render main content based on active tab and edit mode
  const renderMainContent = () => {
    if (loading && (!pages.length || !sections.length)) {
      return (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (editMode) {
      return pageToEdit ? renderPageEditForm() : renderSectionEditForm();
    }
    
    return activeTab === 'pages' ? renderPageList() : renderSections();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Content Management System</h2>
          <p className="text-gray-600 mt-1">Manage your website content</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="p-6">
          {/* Only show login if user is not authenticated */}
          {!user ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Login Required</h3>
              <p className="text-gray-600 mb-4">You need to be logged in with admin privileges to access the CMS.</p>
              <a 
                href="/login" 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go to Login
              </a>
            </div>
          ) : !user.isAdmin && !user.is_admin ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-red-600 mb-4">Admin Access Required</h3>
              <p className="text-gray-600">You are logged in as {user.username}, but you need admin privileges to access the CMS.</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="border-b mb-6">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('pages')}
                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'pages'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Pages
                  </button>
                  <button
                    onClick={() => setActiveTab('sections')}
                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'sections'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Sections
                  </button>
                </nav>
              </div>
              
              {/* Main content */}
              <div className="mb-6">
                {renderMainContent()}
              </div>
              
              {/* Selected page info */}
              {selectedPage && !editMode && (
                <div className="mt-8 pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Selected Page: {selectedPage.title}</h3>
                    <div className="space-x-2">
                      <button 
                        onClick={handleEditPage}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit Page
                      </button>
                      <button 
                        onClick={handleDeletePage}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete Page
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded">
                    <div><strong>ID:</strong> {selectedPage.pageId || selectedPage.page_id}</div>
                    <div><strong>Status:</strong> {selectedPage.status}</div>
                    <div><strong>Description:</strong> {selectedPage.description || 'No description'}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleCmsPage;
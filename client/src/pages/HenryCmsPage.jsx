import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const HenryCmsPage = () => {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [pageTags, setPageTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('pages');

  // Fetch pages on component mount
  useEffect(() => {
    fetchPages();
  }, []);

  // Fetch all pages
  const fetchPages = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/henry-cms/pages');
      setPages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Select a page to view/edit
  const handleSelectPage = (page) => {
    setSelectedPage(page);
    setPageTitle(page.title);
    setPageSlug(page.slug);
    setPageContent(page.content);
    setPageDescription(page.description || '');
    setPageTags(page.tags || '');
    setEditMode(false);
  };

  // Clear form for creating a new page
  const handleNewPage = () => {
    setSelectedPage(null);
    setPageTitle('');
    setPageSlug('');
    setPageContent('');
    setPageDescription('');
    setPageTags('');
    setEditMode(true);
  };

  // Save a page (create or update)
  const handleSavePage = async (e) => {
    e.preventDefault();
    
    if (!pageTitle || !pageSlug || !pageContent) {
      setError('Title, slug, and content are required');
      return;
    }
    
    const pageData = {
      title: pageTitle,
      slug: pageSlug,
      content: pageContent,
      description: pageDescription,
      tags: pageTags,
      status: 'published'
    };
    
    try {
      let response;
      
      if (selectedPage) {
        // Update existing page
        response = await axios.put(`/api/henry-cms/pages/${selectedPage.slug}`, pageData);
        const updatedPages = pages.map(p => 
          p.id === response.data.id ? response.data : p
        );
        setPages(updatedPages);
      } else {
        // Create new page
        response = await axios.post('/api/henry-cms/pages', pageData);
        setPages([...pages, response.data]);
      }
      
      setSelectedPage(response.data);
      setEditMode(false);
      setError(null);
    } catch (err) {
      console.error('Error saving page:', err);
      setError(err.response?.data?.error || 'Failed to save page. Please try again.');
    }
  };

  // Delete a page
  const handleDeletePage = async () => {
    if (!selectedPage) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedPage.title}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`/api/henry-cms/pages/${selectedPage.slug}`);
      setPages(pages.filter(p => p.id !== selectedPage.id));
      setSelectedPage(null);
      setPageTitle('');
      setPageSlug('');
      setPageContent('');
      setPageDescription('');
      setPageTags('');
      setError(null);
    } catch (err) {
      console.error('Error deleting page:', err);
      setError('Failed to delete page. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Henry CMS (Node.js Adapter)</h1>
        <p className="text-gray-600">
          A lightweight CMS integration for getBPay
        </p>
        
        <div className="mt-4 flex space-x-4">
          <Link 
            to="/dashboard"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
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
            onClick={() => setActiveTab('themes')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'themes'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar - Pages list */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pages</h2>
              <button
                onClick={handleNewPage}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                New Page
              </button>
            </div>
            
            {loading ? (
              <p className="text-gray-500">Loading pages...</p>
            ) : pages.length === 0 ? (
              <p className="text-gray-500">No pages found</p>
            ) : (
              <ul className="space-y-2">
                {pages.map((page) => (
                  <li
                    key={page.id}
                    className={`p-2 rounded cursor-pointer ${
                      selectedPage?.id === page.id
                        ? 'bg-blue-100 border-l-4 border-blue-500'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleSelectPage(page)}
                  >
                    <div className="font-medium">{page.title}</div>
                    <div className="text-sm text-gray-500">{page.slug}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Right content area - Page editor */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:col-span-2">
            {selectedPage || editMode ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {editMode
                      ? selectedPage
                        ? `Edit: ${selectedPage.title}`
                        : 'Create New Page'
                      : selectedPage.title}
                  </h2>
                  <div className="space-x-2">
                    {!editMode && (
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Edit
                      </button>
                    )}
                    {selectedPage && !editMode && (
                      <button
                        onClick={handleDeletePage}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                
                {editMode ? (
                  <form onSubmit={handleSavePage}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          value={pageTitle}
                          onChange={(e) => setPageTitle(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Slug (URL)
                        </label>
                        <input
                          type="text"
                          value={pageSlug}
                          onChange={(e) => setPageSlug(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <input
                          type="text"
                          value={pageDescription}
                          onChange={(e) => setPageDescription(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Tags (comma separated)
                        </label>
                        <input
                          type="text"
                          value={pageTags}
                          onChange={(e) => setPageTags(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Content (Markdown)
                        </label>
                        <textarea
                          value={pageContent}
                          onChange={(e) => setPageContent(e.target.value)}
                          rows={10}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedPage) {
                              handleSelectPage(selectedPage);
                            } else {
                              setEditMode(false);
                              setSelectedPage(null);
                            }
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <span className="text-sm text-gray-500">URL: /</span>
                      <span className="font-mono">{selectedPage.slug}</span>
                    </div>
                    
                    {selectedPage.description && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Description:</h3>
                        <p className="text-gray-600">{selectedPage.description}</p>
                      </div>
                    )}
                    
                    {selectedPage.tags && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Tags:</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedPage.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Content:</h3>
                      <div className="prose prose-blue max-w-none border p-4 rounded bg-white">
                        <pre className="whitespace-pre-wrap">{selectedPage.content}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500">Select a page to view or edit, or create a new page</p>
                <button
                  onClick={handleNewPage}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create New Page
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'themes' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Themes</h2>
          <p className="text-gray-600">Theme management functionality would be implemented here.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 h-40 flex items-center justify-center">
                <span className="text-lg text-gray-500">Default Theme</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">Default</h3>
                <p className="text-sm text-gray-500">Standard website theme</p>
                <div className="mt-3">
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 h-40 flex items-center justify-center">
                <span className="text-lg text-gray-500">Jumbotron</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">Jumbotron</h3>
                <p className="text-sm text-gray-500">Bootstrap Jumbotron theme</p>
                <div className="mt-3">
                  <button className="text-sm px-2 py-1 bg-blue-500 text-white rounded">
                    Activate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
          <p className="text-gray-600">Site configuration settings would be implemented here.</p>
          
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Site Title
              </label>
              <input
                type="text"
                value="getBPay"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Site Description
              </label>
              <input
                type="text"
                value="Modern digital tipping and payment splitting platform"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Site Keywords
              </label>
              <input
                type="text"
                value="tipping, payments, service workers, digital payments"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HenryCmsPage;
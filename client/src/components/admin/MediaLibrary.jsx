import React, { useState, useEffect, useRef } from 'react';
import { contentManagementApi } from '../../lib/api';

const MediaLibrary = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    fetchMediaItems();
  }, []);
  
  const fetchMediaItems = async () => {
    setLoading(true);
    try {
      const data = await contentManagementApi.getAllMedia();
      setMediaItems(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Failed to load media library. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMediaSelect = (media) => {
    setSelectedMedia(media === selectedMedia ? null : media);
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('altText', '');
    
    setUploading(true);
    try {
      const uploadedMedia = await contentManagementApi.uploadMedia(formData);
      
      // Add the new media to the list
      setMediaItems(prev => [uploadedMedia, ...prev]);
      
      // Select the new media
      setSelectedMedia(uploadedMedia);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setError(null);
    } catch (err) {
      console.error('Error uploading media:', err);
      setError(`Failed to upload media: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media item? This cannot be undone.')) {
      return;
    }
    
    try {
      const success = await contentManagementApi.deleteMedia(mediaId);
      
      if (success) {
        // Remove the deleted media from the list
        setMediaItems(prev => prev.filter(media => media.id !== mediaId));
        
        // Unselect the media if it was selected
        if (selectedMedia && selectedMedia.id === mediaId) {
          setSelectedMedia(null);
        }
        
        alert('Media deleted successfully');
      }
    } catch (err) {
      console.error(`Error deleting media ${mediaId}:`, err);
      alert(`Failed to delete media: ${err.message}`);
    }
  };
  
  const handleUpdateMedia = async (mediaId, updates) => {
    try {
      const updatedMedia = await contentManagementApi.updateMedia(mediaId, updates);
      
      // Update the media item in the list
      setMediaItems(prev => 
        prev.map(media => media.id === mediaId ? updatedMedia : media)
      );
      
      // Update the selected media if it was selected
      if (selectedMedia && selectedMedia.id === mediaId) {
        setSelectedMedia(updatedMedia);
      }
      
      return true;
    } catch (err) {
      console.error(`Error updating media ${mediaId}:`, err);
      return false;
    }
  };
  
  const handleTitleChange = (e) => {
    if (!selectedMedia) return;
    
    setSelectedMedia({
      ...selectedMedia,
      title: e.target.value
    });
  };
  
  const handleAltTextChange = (e) => {
    if (!selectedMedia) return;
    
    setSelectedMedia({
      ...selectedMedia,
      altText: e.target.value
    });
  };
  
  const handleSaveMediaDetails = async () => {
    if (!selectedMedia) return;
    
    const success = await handleUpdateMedia(selectedMedia.id, {
      title: selectedMedia.title,
      altText: selectedMedia.altText
    });
    
    if (success) {
      alert('Media details updated successfully');
    } else {
      alert('Failed to update media details');
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredMedia = mediaItems.filter(media => {
    const searchLower = searchTerm.toLowerCase();
    return (
      media.originalFilename.toLowerCase().includes(searchLower) ||
      (media.title && media.title.toLowerCase().includes(searchLower)) ||
      (media.altText && media.altText.toLowerCase().includes(searchLower))
    );
  });
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };
  
  if (loading && mediaItems.length === 0) {
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
          <h2 className="text-xl font-semibold">Media Library</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute left-2 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Media
                  </>
                )}
              </button>
            </div>
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
        {/* Media Grid */}
        <div className={`p-6 ${selectedMedia ? 'md:col-span-8' : 'md:col-span-12'} overflow-auto`}>
          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No media items found</p>
              <button
                onClick={() => fileInputRef.current.click()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Upload Your First Media
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMedia.map(media => (
                <div 
                  key={media.id}
                  onClick={() => handleMediaSelect(media)}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition hover:shadow-md ${
                    selectedMedia?.id === media.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                  }`}
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {media.mimeType.startsWith('image/') ? (
                      <img 
                        src={media.url} 
                        alt={media.altText || media.title || media.originalFilename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-gray-500 mt-1">{media.mimeType.split('/')[1].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">
                      {media.title || media.originalFilename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(media.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Media Details Panel */}
        {selectedMedia && (
          <div className="border-t md:border-t-0 md:border-l border-gray-200 md:col-span-4 bg-gray-50 p-6 overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Media Details</h3>
            
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-center">
                {selectedMedia.mimeType.startsWith('image/') ? (
                  <img 
                    src={selectedMedia.url} 
                    alt={selectedMedia.altText || selectedMedia.title || selectedMedia.originalFilename}
                    className="max-h-48 max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-500 mt-2">{selectedMedia.mimeType}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedMedia.title || ''}
                    onChange={handleTitleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={selectedMedia.altText || ''}
                    onChange={handleAltTextChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Describe the image for accessibility.
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Media Information</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Filename:</span>
                    <span className="font-mono text-gray-700">{selectedMedia.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Original Filename:</span>
                    <span className="font-mono text-gray-700">{selectedMedia.originalFilename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">MIME Type:</span>
                    <span className="font-mono text-gray-700">{selectedMedia.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Size:</span>
                    <span className="font-mono text-gray-700">
                      {Math.round(selectedMedia.size / 1024)} KB
                    </span>
                  </div>
                  {selectedMedia.width && selectedMedia.height && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dimensions:</span>
                      <span className="font-mono text-gray-700">
                        {selectedMedia.width} × {selectedMedia.height}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Uploaded:</span>
                    <span className="font-mono text-gray-700">
                      {new Date(selectedMedia.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">URL</h4>
                <div className="flex">
                  <input
                    type="text"
                    value={selectedMedia.url}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedMedia.url)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
                    title="Copy URL"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDeleteMedia(selectedMedia.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete Media
                </button>
                
                <button
                  onClick={handleSaveMediaDetails}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibrary;
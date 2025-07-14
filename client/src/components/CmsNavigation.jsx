import React from 'react';
import { Link } from 'react-router-dom';

const CmsNavigation = () => {
  return (
    <div className="bg-white shadow mb-6 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">CMS Navigation</h3>
      <div className="flex flex-wrap gap-3">
        <Link 
          to="/admin/content" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Original CMS
        </Link>
        <Link 
          to="/admin/simple-cms" 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Simple CMS
        </Link>
        <Link 
          to="/admin/henry-cms" 
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Henry CMS (Test)
        </Link>
        <Link 
          to="/dashboard" 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default CmsNavigation;
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../lib/AppContext';
import bpayLogo from '../assets/bpay-logo.svg';

const Navbar = () => {
  const { user, isAdmin, logout } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return 'BP';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-slate-900 text-white px-6 py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src={bpayLogo} alt="bPay Logo" className="h-8 mr-2" />
          </Link>
          
          {user && (
            <div className="hidden md:flex ml-10 space-x-6">
              <Link to="/dashboard" className="text-slate-300 hover:text-white">Dashboard</Link>
              <Link to="/payment-methods" className="text-slate-300 hover:text-white">Payment Methods</Link>
              <Link to="/transactions" className="text-slate-300 hover:text-white">Transactions</Link>
              {isAdmin && (
                <>
                  <Link to="/admin/settings" className="text-slate-300 hover:text-white">Admin Settings</Link>
                  <Link to="/admin/content" className="text-slate-300 hover:text-white">Content Management</Link>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <button className="text-slate-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              <div className="relative">
                <button 
                  onClick={toggleProfileMenu}
                  className="flex items-center focus:outline-none"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="font-medium">{getUserInitials()}</span>
                  </div>
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user.name || user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Your Profile
                    </Link>
                    
                    <Link
                      to="/payment-methods"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Payment Methods
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Settings
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-x-4">
              <Link to="/auth" className="hover:text-blue-400">
                Login
              </Link>
              <Link
                to="/auth"
                className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
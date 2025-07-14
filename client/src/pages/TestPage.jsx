import React from 'react';
import { Link } from 'react-router-dom';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">This is a test page to verify routing is working correctly.</p>
      
      <div className="flex flex-col space-y-2">
        <Link to="/" className="text-blue-500 hover:underline">Home</Link>
        <Link to="/checkout" className="text-blue-500 hover:underline">Checkout</Link>
        <Link to="/dashboard" className="text-blue-500 hover:underline">Dashboard</Link>
      </div>
    </div>
  );
};

export default TestPage;
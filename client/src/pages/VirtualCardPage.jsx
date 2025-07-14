import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function VirtualCardPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await api.get('/payment-methods');
      setPaymentMethods(methods);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create Virtual Card</h1>
        <div>Loading payment methods...</div>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Create Virtual Card</h1>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">No payment methods found. Please add a payment method first.</p>
          <Link to="/add-payment-method" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Add Payment Method
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Create Virtual Card</h1>
      </div>

      {/* Add your virtual card creation form here */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Form implementation */}
      </div>
    </div>
  );
}
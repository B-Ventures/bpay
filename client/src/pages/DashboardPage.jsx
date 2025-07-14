import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../lib/AppContext';
import Navbar from '../components/Navbar';

const DashboardPage = () => {
  const { 
    virtualCards,
    paymentMethods,
    fetchVirtualCards,
    fetchPaymentMethods,
    loadingVirtualCards,
    loadingPaymentMethods,
    error,
    clearError,
    user,
    isAdmin
  } = useApp();

  // Fetch data when component mounts
  useEffect(() => {
    fetchVirtualCards();
    fetchPaymentMethods();
  }, []);

  // Format date to a readable string
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => clearError()}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage your bPay account and payment methods</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link 
              to="/setup-payment" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none"
              role="button"
              aria-label="Create new virtual card"
            >
              Create Virtual Card
            </Link>
          </div>
        </div>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Virtual Cards</h2>

          {loadingVirtualCards ? (
            <div className="flex justify-center items-center py-12" role="status" aria-live="polite">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" aria-label="Loading virtual cards"></div>
              <span className="sr-only">Loading virtual cards...</span>
            </div>
          ) : virtualCards.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 text-xl">+</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No virtual cards yet</h3>
              <p className="text-slate-500 mb-4">Create your first virtual card to get started.</p>
              <Link 
                to="/setup-payment" 
                className="text-blue-600 font-medium hover:text-blue-800"
              >
                Create your first virtual card
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {virtualCards.map(card => (
                <div 
                  key={card.id} 
                  className={`bg-gradient-to-r ${
                    card.status === 'active' 
                      ? 'from-blue-600 to-indigo-700' 
                      : 'from-slate-500 to-slate-700'
                  } rounded-xl p-6 text-white shadow-lg`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-sm opacity-80">Virtual Card</p>
                      <p className="font-mono text-lg mt-1">•••• {card.lastFour}</p>
                    </div>
                    <div 
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        card.status === 'active' 
                          ? 'bg-green-500/20 text-green-100' 
                          : 'bg-red-500/20 text-red-100'
                      }`}
                    >
                      {card.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm opacity-80">Balance</p>
                    <p className="text-2xl font-semibold">${card.balance.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs opacity-80">Expires</p>
                      <p>{card.expiryDate}</p>
                    </div>
                    <Link 
                      to={`/virtual-card/${card.id}`}
                      className="text-sm underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}

              {/* Add Card Placeholder */}
              <Link
                to="/setup-payment"
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-blue-500 hover:bg-blue-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:outline-none"
                role="button"
                aria-label="Create New Virtual Card"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <span className="text-blue-600 text-2xl">+</span>
                </div>
                <p className="font-medium text-slate-700">Create New Virtual Card</p>
              </Link>
            </div>
          )}
        </section>

        {/* Payment Methods Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Your Payment Methods</h2>
            <Link 
              to="/add-payment-method" 
              className="text-blue-600 font-medium hover:text-blue-800"
            >
              Add New
            </Link>
          </div>

          {loadingPaymentMethods ? (
            <div className="flex justify-center items-center py-12" role="status" aria-live="polite">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" aria-label="Loading payment methods"></div>
              <span className="sr-only">Loading payment methods...</span>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 text-xl">+</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No payment methods yet</h3>
              <p className="text-slate-500 mb-4">Add a payment method to get started with creating virtual cards.</p>
              <Link 
                to="/add-payment-method" 
                className="text-blue-600 font-medium hover:text-blue-800"
              >
                Add your first payment method
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {paymentMethods.map((method, index) => (
              <div 
                key={method.id}
                className={`p-4 ${
                  index < paymentMethods.length - 1 ? 'border-b border-slate-200' : ''
                } flex justify-between items-center`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center mr-4">
                    {method.type === 'card' ? (
                      <span className="uppercase font-semibold text-slate-700">{method.brand.substring(0, 2)}</span>
                    ) : (
                      <span className="text-slate-700">W</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {method.type === 'card' 
                        ? `${method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• ${method.lastFour}`
                        : method.name
                      }
                    </div>
                    <div className="text-sm text-slate-500">
                      {method.type === 'card' 
                        ? `Credit Card${method.isDefault ? ' • Default' : ''}`
                        : `Balance: ${method.balance}${method.isDefault ? ' • Default' : ''}`
                      }
                    </div>
                  </div>
                </div>
                <div>
                  <button className="text-sm text-slate-600 hover:text-blue-600">Edit</button>
                </div>
              </div>
            ))}
            </div>
          )}
        </section>

        {/* Recent Transactions Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Recent Transactions</h2>
            <Link 
              to="/transactions" 
              className="text-blue-600 font-medium hover:text-blue-800"
            >
              View All
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Empty state - You can replace this with real transaction data */}
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 text-xl">$</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions yet</h3>
              <p className="text-slate-500 mb-4">When you use your virtual cards, your transactions will appear here.</p>
              <Link 
                to="/setup-payment" 
                className="text-blue-600 font-medium hover:text-blue-800"
              >
                Create your first virtual card
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
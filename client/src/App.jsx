import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AppProvider } from './lib/AppContext'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import PaymentSetupPage from './pages/PaymentSetupPage'
import VirtualCardPage from './pages/VirtualCardPage'
import AddPaymentMethod from './pages/AddPaymentMethod'
import AdminSettingsPage from './pages/AdminSettingsPage'
import ContentManagementPage from './pages/ContentManagementPage'
import SimpleCmsPage from './pages/SimpleCmsPage'
import HenryCmsPage from './pages/HenryCmsPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import TestPage from './pages/TestPage'
import ExtensionPopup from './components/ExtensionPopup'
import ExtensionInject from './components/ExtensionInject'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { isExtension } from './utils/extensionHelper'

function App() {
  const [runningAsExtension, setRunningAsExtension] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're running as a browser extension
  useEffect(() => {
    setRunningAsExtension(isExtension());
  }, []);
  
  // Handle API routes - prevent Router from handling them
  useEffect(() => {
    if (location.pathname.startsWith('/api/')) {
      // Don't try to handle API routes with the router
      // Just leave the page as is for the server to handle
      return;
    }
  }, [location]);
  
  // In extension mode with no specific route, show the popup
  const showExtensionPopup = runningAsExtension && (location.pathname === '/' || location.pathname === '');
  
  // Debug routing
  console.log('Current location:', location.pathname);
  
  return (
    <AppProvider>
      <div className={`${runningAsExtension ? 'min-h-[600px] w-96' : 'min-h-screen'} bg-slate-100 dark:bg-slate-900`}>
        {showExtensionPopup ? (
          <ExtensionPopup />
        ) : (
          <>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/setup-payment" element={<PaymentSetupPage />} />
              <Route path="/virtual-card/:id" element={<VirtualCardPage />} />
              <Route path="/add-payment-method" element={<AddPaymentMethod />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/content" element={<ContentManagementPage />} />
              <Route path="/admin/simple-cms" element={<SimpleCmsPage />} />
              <Route path="/admin/henry-cms" element={<HenryCmsPage />} />
              <Route path="/extension" element={<ExtensionPopup />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/api/*" element={null} />
            </Routes>
            
            {/* ExtensionInject is always present on sites (when running as extension) */}
            {runningAsExtension && !showExtensionPopup && <ExtensionInject />}
            
            {/* PWA Installation Prompt - only show if not in extension mode */}
            {!runningAsExtension && <PWAInstallPrompt />}
          </>
        )}
      </div>
    </AppProvider>
  )
}

export default App
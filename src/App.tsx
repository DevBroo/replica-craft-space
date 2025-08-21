import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { PropertyCacheProvider } from '@/contexts/PropertyCacheContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { Toaster } from '@/components/ui/toaster';

// Public Pages
import Index from '@/pages/Index';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Properties from '@/pages/Properties';
import PropertyDetails from '@/pages/PropertyDetails';
import NotFound from '@/pages/NotFound';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import HowItWorks from '@/pages/HowItWorks';
import SafetyGuidelines from '@/pages/SafetyGuidelines';
import TrustSafety from '@/pages/TrustSafety';
import HelpCenter from '@/pages/HelpCenter';
import BookingAssistance from '@/pages/BookingAssistance';
import Locations from '@/pages/Locations';

// Authentication Pages
import CustomerLogin from '@/pages/CustomerLogin';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ResendVerification from '@/pages/ResendVerification';

// Customer Pages
import CustomerDashboard from '@/pages/CustomerDashboard';
import BookingDetails from '@/pages/BookingDetails';

// Admin Pages
import AdminIndex from '@/pages/admin/Index';
import ModernAdminDashboard from '@/pages/admin/ModernAdminDashboard';
import AdminLoginPage from '@/pages/admin/LoginPage';
import Settings from '@/pages/admin/Settings';

// Host/Owner Pages
import HostLogin from '@/pages/HostLogin';
import HostSignup from '@/pages/HostSignup';
import HostDashboard from '@/pages/HostDashboard';
import DayPicnicSetup from '@/components/owner/DayPicnicSetup';
import DayPicnicBooking from '@/pages/DayPicnicBooking';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PropertyCacheProvider>
          <WishlistProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/property/:id" element={<PropertyDetails />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/safety-guidelines" element={<SafetyGuidelines />} />
                  <Route path="/trust-safety" element={<TrustSafety />} />
                  <Route path="/help-center" element={<HelpCenter />} />
                  <Route path="/booking-assistance" element={<BookingAssistance />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="*" element={<NotFound />} />

                  {/* Authentication Routes */}
                  <Route path="/login" element={<CustomerLogin />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/resend-verification" element={<ResendVerification />} />

                  {/* Customer Routes */}
                  <Route path="/dashboard" element={<CustomerDashboard />} />
                  <Route path="/booking/:id" element={<BookingDetails />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminIndex />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin/dashboard" element={<ModernAdminDashboard />} />
                  <Route path="/admin/settings" element={<Settings />} />
                  
                  {/* Host/Owner Routes */}
                  <Route path="/host/login" element={<HostLogin />} />
                  <Route path="/host/signup" element={<HostSignup />} />
                  <Route path="/host/dashboard" element={<HostDashboard />} />
                  <Route path="/host/day-picnic-setup/:propertyId" element={<DayPicnicSetup />} />
                  
                  {/* Day Picnic Routes */}
                  <Route path="/day-picnic/:propertyId" element={<DayPicnicBooking />} />
                  
                </Routes>
                <Toaster />
              </div>
            </BrowserRouter>
          </WishlistProvider>
        </PropertyCacheProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

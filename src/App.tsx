import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient } from 'react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { PropertyCacheProvider } from '@/contexts/PropertyCacheContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { Toaster } from '@/components/ui/toaster';

// Public Pages
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Properties from '@/pages/Properties';
import PropertyDetails from '@/pages/PropertyDetails';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import FAQ from '@/pages/FAQ';
import NotFound from '@/pages/NotFound';
import UnderConstruction from '@/pages/UnderConstruction';

// Authentication Pages
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import VerifyEmail from '@/pages/VerifyEmail';
import ProfilePage from '@/pages/ProfilePage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Users from '@/pages/admin/Users';
import AdminProperties from '@/pages/admin/AdminProperties';
import Bookings from '@/pages/admin/Bookings';
import Payments from '@/pages/admin/Payments';
import Reviews from '@/pages/admin/Reviews';
import Messages from '@/pages/admin/Messages';
import Settings from '@/pages/admin/Settings';

// Host/Owner Pages
import HostLogin from '@/pages/HostLogin';
import HostSignup from '@/pages/HostSignup';
import HostDashboard from '@/pages/HostDashboard';
import DayPicnicSetup from '@/components/owner/DayPicnicSetup';
import DayPicnicBooking from '@/pages/DayPicnicBooking';

function App() {
  return (
    <QueryClient>
      <AuthProvider>
        <PropertyCacheProvider>
          <WishlistProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/property/:id" element={<PropertyDetails />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/under-construction" element={<UnderConstruction />} />
                  <Route path="*" element={<NotFound />} />

                  {/* Authentication Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/profile" element={<ProfilePage />} />

                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/properties" element={<AdminProperties />} />
                  <Route path="/admin/bookings" element={<Bookings />} />
                  <Route path="/admin/payments" element={<Payments />} />
                  <Route path="/admin/reviews" element={<Reviews />} />
                  <Route path="/admin/messages" element={<Messages />} />
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
    </QueryClient>
  );
}

export default App;

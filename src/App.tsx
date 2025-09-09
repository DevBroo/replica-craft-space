import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { PropertyCacheProvider } from "@/contexts/PropertyCacheContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { OwnerRoute } from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import PublicLayout from "@/components/layout/PublicLayout";
import ScrollToTop from "@/components/ScrollToTop";

// Public Pages (immediate load)
import Index from "@/pages/Index";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Properties from "@/pages/Properties";
import OptimizedProperties from "@/pages/OptimizedProperties";
import PropertyDetails from "@/pages/PropertyDetails";
import NotFound from "@/pages/NotFound";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import HowItWorks from "@/pages/HowItWorks";
import SafetyGuidelines from "@/pages/SafetyGuidelines";
import TrustSafety from "@/pages/TrustSafety";
import HelpCenter from "@/pages/HelpCenter";
import BookingAssistance from "@/pages/BookingAssistance";
import Locations from "@/pages/Locations";
import HostResources from "@/pages/HostResources";

// Authentication Pages (immediate load)
import CustomerLogin from "@/pages/CustomerLogin";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import ResendVerification from "@/pages/ResendVerification";

// Customer Pages (immediate load)
import CustomerDashboard from "@/pages/CustomerDashboard";
import BookingDetails from "@/pages/BookingDetails";
import DayPicnicBooking from "@/pages/DayPicnicBooking";

// Payment Pages (lazy)
const PaymentSuccess = React.lazy(() => import("@/pages/PaymentSuccess"));
const PaymentCallback = React.lazy(() => import("@/pages/PaymentCallback"));
const BookingPayment = React.lazy(() => import("@/pages/BookingPayment"));

// Lazy-loaded Admin Pages
const AdminIndex = React.lazy(() => import("@/pages/admin/Index"));
const ModernAdminDashboard = React.lazy(
  () => import("@/pages/admin/ModernAdminDashboard")
);
const AdminLoginPage = React.lazy(() => import("@/pages/admin/LoginPage"));
const Settings = React.lazy(() => import("@/pages/admin/Settings"));
const OwnerManagement = React.lazy(
  () => import("@/pages/admin/OwnerManagement")
);
const AgentManagement = React.lazy(
  () => import("@/pages/admin/AgentManagement")
);
const LocationManagement = React.lazy(
  () => import("@/pages/admin/LocationManagement")
);
const PropertyApproval = React.lazy(
  () => import("@/pages/admin/PropertyApproval")
);
const BookingManagement = React.lazy(
  () => import("@/pages/admin/BookingManagement")
);
const CommissionDisbursement = React.lazy(
  () => import("@/pages/admin/CommissionDisbursement")
);
const CMSManagement = React.lazy(() => import("@/pages/admin/CMSManagement"));
const NotificationsManagement = React.lazy(
  () => import("@/pages/admin/NotificationsManagement")
);
const Analytics = React.lazy(() => import("@/pages/admin/Analytics"));
const SupportTickets = React.lazy(() => import("@/pages/admin/SupportTickets"));
const LiveChatDashboard = React.lazy(() => import("@/components/admin/LiveChatDashboard"));
const ProtectedRoute = React.lazy(
  () => import("@/components/admin/ProtectedRoute")
);

// Lazy-loaded Host/Owner Pages
const HostLogin = React.lazy(() => import("@/pages/HostLogin"));
const HostSignup = React.lazy(() => import("@/pages/HostSignup"));
const HostDashboard = React.lazy(() => import("@/pages/HostDashboard"));
const OwnerLogin = React.lazy(() => import("@/pages/owner/OwnerLogin"));
const OwnerDashboard = React.lazy(() => import("@/pages/owner/OwnerDashboard"));
const DayPicnicSetup = React.lazy(
  () => import("@/components/owner/DayPicnicSetup")
);

// Auth Callback Component
const AuthCallback = React.lazy(() => import("@/pages/auth/AuthCallback"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <Skeleton className="h-8 w-64 mx-auto" />
      <Skeleton className="h-4 w-48 mx-auto" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  </div>
);

function App() {
  console.log("🚀 App component initializing");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <PropertyCacheProvider>
            <WishlistProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}
              >
                <ScrollToTop />
                <div className="min-h-screen bg-background">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={
                      <PublicLayout>
                        <Index />
                      </PublicLayout>
                    } />
                    <Route path="/about" element={
                      <PublicLayout>
                        <About />
                      </PublicLayout>
                    } />
                    <Route path="/contact" element={
                      <PublicLayout>
                        <Contact />
                      </PublicLayout>
                    } />
                    <Route path="/properties" element={
                      <PublicLayout>
                        <OptimizedProperties />
                      </PublicLayout>
                    } />
                    <Route path="/properties-legacy" element={
                      <PublicLayout>
                        <Properties />
                      </PublicLayout>
                    } />
                    <Route path="/property/:id" element={
                      <PublicLayout>
                        <PropertyDetails />
                      </PublicLayout>
                    } />
                    <Route path="/terms-of-service" element={
                      <PublicLayout>
                        <TermsOfService />
                      </PublicLayout>
                    } />
                    <Route path="/privacy-policy" element={
                      <PublicLayout>
                        <PrivacyPolicy />
                      </PublicLayout>
                    } />
                    <Route path="/how-it-works" element={
                      <PublicLayout>
                        <HowItWorks />
                      </PublicLayout>
                    } />
                    <Route path="/safety-guidelines" element={
                      <PublicLayout>
                        <SafetyGuidelines />
                      </PublicLayout>
                    } />
                    <Route path="/trust-safety" element={
                      <PublicLayout>
                        <TrustSafety />
                      </PublicLayout>
                    } />
                    <Route path="/help-center" element={
                      <PublicLayout>
                        <HelpCenter />
                      </PublicLayout>
                    } />
                    <Route path="/help" element={
                      <PublicLayout>
                        <HelpCenter />
                      </PublicLayout>
                    } />
                    <Route path="/booking-assistance" element={
                      <PublicLayout>
                        <BookingAssistance />
                      </PublicLayout>
                    } />
                    <Route path="/locations" element={
                      <PublicLayout>
                        <Locations />
                      </PublicLayout>
                    } />
                    <Route path="/host-resources" element={
                      <PublicLayout>
                        <HostResources />
                      </PublicLayout>
                    } />
                    <Route path="*" element={
                      <PublicLayout>
                        <NotFound />
                      </PublicLayout>
                    } />

                    {/* Authentication Routes */}
                    <Route path="/login" element={<CustomerLogin />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/resend-verification" element={<ResendVerification />} />
                    <Route path="/auth/callback" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <AuthCallback />
                      </Suspense>
                    } />

                    {/* Customer Routes */}
                    <Route path="/dashboard" element={<CustomerDashboard />} />
                    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                    <Route path="/booking/:id" element={<BookingDetails />} />

                    {/* Admin Routes - Lazy Loaded */}
                    <Route path="/admin" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminIndex />
                      </Suspense>
                    } />
                    <Route path="/admin/login" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminLoginPage />
                      </Suspense>
                    } />
                    <Route path="/admin/dashboard" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><ModernAdminDashboard /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/owner-management" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><OwnerManagement /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/agent-management" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><AgentManagement /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/location-management" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><LocationManagement /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/property-approval" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><PropertyApproval /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/booking-management" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><BookingManagement /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/commission-disbursement" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><CommissionDisbursement /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/cms-management" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><CMSManagement /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/notifications-management" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><NotificationsManagement /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/analytics" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><Analytics /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/support-tickets" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><SupportTickets /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/live-chat" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><LiveChatDashboard /></ProtectedRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/settings" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ProtectedRoute><Settings /></ProtectedRoute>
                      </Suspense>
                    } />

                    {/* Host/Owner Routes - Lazy Loaded */}
                    <Route path="/host/login" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HostLogin />
                      </Suspense>
                    } />
                    <Route path="/host/signup" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HostSignup />
                      </Suspense>
                    } />
                    <Route path="/host/dashboard" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HostDashboard />
                      </Suspense>
                    } />
                    <Route path="/host/day-picnic-setup/:propertyId" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <DayPicnicSetup />
                      </Suspense>
                    } />

                    {/* Agent Portal Routes - Alias to Host/Owner */}
                    <Route path="/agent/login" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HostLogin />
                      </Suspense>
                    } />
                    <Route path="/agent/signup" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HostSignup />
                      </Suspense>
                    } />
                    <Route path="/agent/dashboard" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HostDashboard />
                      </Suspense>
                    } />
                    <Route path="/agent/day-picnic-setup/:propertyId" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <DayPicnicSetup />
                      </Suspense>
                    } />

                    {/* Owner Portal Routes - Lazy Loaded */}
                    <Route path="/owner/login" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <OwnerLogin />
                      </Suspense>
                    } />
                    <Route path="/owner/signup" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <HostSignup />
                      </Suspense>
                    } />
                    <Route path="/owner" element={
                      <Navigate to="/owner/view" replace />
                    } />
                    <Route path="/owner/dashboard" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <OwnerRoute><OwnerDashboard /></OwnerRoute>
                      </Suspense>
                    } />
                    <Route path="/owner/view" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <OwnerRoute><OwnerDashboard /></OwnerRoute>
                      </Suspense>
                    } />
                    <Route path="/owner/day-picnic-setup/:propertyId" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <DayPicnicSetup />
                      </Suspense>
                    } />

                    {/* Day Picnic Routes */}
                    <Route path="/day-picnic/:propertyId" element={<DayPicnicBooking />} />

                    {/* Booking & Payment Routes */}
                    <Route path="/booking/:propertyId/payment" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <BookingPayment />
                      </Suspense>
                    } />
                    <Route path="/payment/success" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <PaymentSuccess />
                      </Suspense>
                    } />
                    <Route path="/payment/callback" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <PaymentCallback />
                      </Suspense>
                    } />
                  </Routes>
                  <Toaster />
                </div>
              </BrowserRouter>
            </WishlistProvider>
          </PropertyCacheProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

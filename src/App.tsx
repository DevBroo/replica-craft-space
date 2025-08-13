import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Locations from "./pages/Locations";
import About from "./pages/About";
import Contact from "./pages/Contact";
import OwnerLogin from "./pages/owner/OwnerLogin";
import CustomerLogin from "./pages/CustomerLogin";
import BookingDetails from "./pages/BookingDetails";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResendVerification from "./pages/ResendVerification";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import CustomerDashboard from "./pages/CustomerDashboard";
import HowItWorks from "./pages/HowItWorks";
import SafetyGuidelines from "./pages/SafetyGuidelines";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import HelpCenter from "./pages/HelpCenter";
import BookingAssistance from "./pages/BookingAssistance";
import HostResources from "./pages/HostResources";
import TrustSafety from "./pages/TrustSafety";

// Admin Panel Imports
import ProtectedRoute from "./components/admin/ProtectedRoute";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import ModernAdminDashboard from "./pages/admin/ModernAdminDashboard";
import OwnerManagement from "./pages/admin/OwnerManagement";
import AgentManagement from "./pages/admin/AgentManagement";
import PropertyApproval from "./pages/admin/PropertyApproval";
import BookingManagement from "./pages/admin/BookingManagement";
import CommissionDisbursement from "./pages/admin/CommissionDisbursement";
import CMSManagement from "./pages/admin/CMSManagement";
import NotificationsManagement from "./pages/admin/NotificationsManagement";
import SupportTickets from "./pages/admin/SupportTickets";
import Settings from "./pages/admin/Settings";
import AdminLoginPage from "./pages/admin/LoginPage";

// Property Owner Portal Imports
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerDashboardView from "./pages/owner/OwnerDashboardView";

// Agent Portal Imports
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentLogin from "./pages/agent/AgentLogin";
import AgentSignup from "./pages/agent/AgentSignup";
import AddProperty from "./pages/agent/AddProperty";
import TestAgentLogin from "./pages/agent/TestAgentLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
          {/* Main App Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/booking-details" element={<BookingDetails />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/resend-verification" element={<ResendVerification />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/safety-guidelines" element={<SafetyGuidelines />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/booking-assistance" element={<BookingAssistance />} />
          <Route path="/host-resources" element={<HostResources />} />
          <Route path="/trust-safety" element={<TrustSafety />} />
          
          {/* Property Owner Portal Routes */}
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/signup" element={<Signup />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/view" element={<OwnerDashboardView />} />
          
          {/* Agent Portal Routes */}
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent/signup" element={<AgentSignup />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/agent/add-property" element={<AddProperty />} />
          <Route path="/agent/test" element={<TestAgentLogin />} />
          
          {/* Admin Panel Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<ModernAdminDashboard />} />
          <Route path="/admin/super-admin-dashboard" element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/owner-management" element={
            <ProtectedRoute>
              <OwnerManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/agent-management" element={
            <ProtectedRoute>
              <AgentManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/property-approval" element={
            <ProtectedRoute>
              <PropertyApproval />
            </ProtectedRoute>
          } />
          <Route path="/admin/booking-management" element={
            <ProtectedRoute>
              <BookingManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/commission-disbursement" element={
            <ProtectedRoute>
              <CommissionDisbursement />
            </ProtectedRoute>
          } />
          <Route path="/admin/cms-management" element={
            <ProtectedRoute>
              <CMSManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications-management" element={
            <ProtectedRoute>
              <NotificationsManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/support-tickets" element={
            <ProtectedRoute>
              <SupportTickets />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
        </TooltipProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

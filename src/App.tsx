import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Locations from "./pages/Locations";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import BookingDetails from "./pages/BookingDetails";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Admin Panel Imports
import ProtectedRoute from "./components/admin/ProtectedRoute";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
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

// Agent Portal Imports
import AgentDashboard from "./pages/agent/AgentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/login" element={<Login />} />
          <Route path="/booking-details" element={<BookingDetails />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Property Owner Portal Routes */}
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/login" element={<OwnerDashboard />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          
          {/* Agent Portal Routes */}
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/agent/login" element={<AgentDashboard />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          
          {/* Admin Panel Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
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
  </QueryClientProvider>
);

export default App;

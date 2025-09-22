import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import PropertiesNew from "../../components/owner/PropertiesNew";
import Bookings from "../../components/owner/Bookings";
import Earnings from "../../components/owner/Earnings";
import Reviews from "../../components/owner/Reviews";
import Messages from "../../components/owner/Messages";
import Profile from "../../components/owner/Profile";
import Settings from "../../components/owner/Settings";
import NotificationDropdown from "../../components/owner/NotificationDropdown";
import { OwnerService } from "@/lib/ownerService";
import { formatTime, getPaymentStatusColor, getStatusColor } from "@/lib/utils";
import { MessageService } from "@/lib/messageService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { supabase } from "@/integrations/supabase/client";

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Dashboard state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [threads, setThreads] = useState([]);
  const [analytics, setAnalytics] = useState({
    properties: 0,
    bookings: 0,
    revenue: 0,
  });
  const { toast } = useToast();

  // Handle tab query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  // Handle authentication state
  useEffect(() => {
    // Add a small delay to ensure auth state is fully loaded after page refresh
    const authCheckTimeout = setTimeout(() => {
      console.log("🔐 OwnerDashboard: Auth state check:", {
        loading,
        isAuthenticated,
        user: user ? { id: user.id, email: user.email, role: user.role } : null,
      });

      if (loading) {
        console.log("⏳ Auth loading, waiting...");
        return; // Wait for auth to load
      }

      if (!isAuthenticated || !user) {
        // User is not authenticated, redirect to owner login
        console.log("❌ User not authenticated, redirecting to owner login");
        navigate("/owner/login", { replace: true });
      } else if (!["property_owner", "owner"].includes(user.role)) {
        // User is authenticated but not a host, redirect to appropriate page
        console.log("⚠️ User not host, role:", user.role);
        console.log("🔍 User details:", {
          id: user.id,
          email: user.email,
          role: user.role,
        });

        if (user.role === "admin") {
          navigate("/admin/dashboard");
        } else if (user.role === "agent") {
          navigate("/agent/dashboard");
        } else {
          console.log("❌ User role is not host, redirecting to homepage");
          navigate("/"); // Other roles go to main page
        }
      } else {
        // User is authenticated owner, show dashboard
        console.log("✅ User authenticated owner, showing dashboard");
      }
    }, 500); // 500ms delay to ensure auth state is stable

    return () => clearTimeout(authCheckTimeout);
  }, [isAuthenticated, user, loading, navigate]);

  const setupAnalytics = async (ownerBookings) => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", user?.id)
      .order("created_at", { ascending: false });

    const currentMonth = new Date().getMonth(); // Current month (0-11)
    const currentYear = new Date().getFullYear(); // Current year (e.g., 2025)
    const bookingsThisMonth = ownerBookings.filter((booking) => {
      const bookingDate = new Date(booking.created_at); // Convert to Date object if needed
      const bookingMonth = bookingDate.getMonth();
      const bookingYear = bookingDate.getFullYear();
      return bookingMonth === currentMonth && bookingYear === currentYear;
    });

    // Calculate total amount for bookings this month
    const totalAmountThisMonth = bookingsThisMonth.reduce((total, booking) => {
      return total + (booking.total_amount || 0); // Ensure total_amount exists and default to 0 if undefined
    }, 0);

    const lytics = {
      properties: error ? 0 : data.length,
      bookings: bookingsThisMonth.length,
      revenue: totalAmountThisMonth,
    };
    setAnalytics(lytics);
  };

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setBookingLoading(true);
      const ownerBookings = await OwnerService.getOwnerBookings(user.id);
      await setupAnalytics(ownerBookings);
      setBookings(ownerBookings);
    } catch (error) {
      console.error("❌ Error loading bookings:", error);
    } finally {
      setBookingLoading(false);
    }
  }, [user?.id]);

  const loadThreads = useCallback(async () => {
    if (!user?.id) return;

    try {
      setThreadsLoading(true);
      const threadsData = await MessageService.getUserThreads(user.id);
      setThreads(threadsData);
    } catch (error) {
      console.error("Error loading threads:", error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setThreadsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBookings();
    loadThreads();
  }, [loadBookings, loadThreads]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/owner/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Menu items for sidebar
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { id: "properties", label: "My Properties", icon: "fas fa-home" },
    { id: "bookings", label: "Bookings", icon: "fas fa-calendar-check" },
    { id: "earnings", label: "Earnings", icon: "fas fa-dollar-sign" },
    { id: "reviews", label: "Reviews", icon: "fas fa-star" },
    { id: "messages", label: "Messages", icon: "fas fa-envelope" },
    { id: "profile", label: "Profile", icon: "fas fa-user" },
    { id: "settings", label: "Settings", icon: "fas fa-cog" },
  ];

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login redirect if not authenticated
  if (
    !isAuthenticated ||
    !user ||
    !["property_owner", "owner"].includes(user.role)
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "properties":
        console.log("🔧 Rendering PropertiesNew component for properties tab");
        return (
          <PropertiesNew
            onBack={() => setActiveTab("dashboard")}
            editProperty={null}
          />
        );
      case "bookings":
        return (
          <Bookings
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            embedded={true}
          />
        );
      case "earnings":
        return (
          <Earnings
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            embedded={true}
          />
        );
      case "reviews":
        return (
          <Reviews
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            embedded={true}
          />
        );
      case "messages":
        return (
          <Messages
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            embedded={true}
          />
        );
      case "profile":
        return (
          <Profile
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            embedded={true}
          />
        );
      case "settings":
        return (
          <Settings
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            embedded={true}
          />
        );
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {analytics.properties}
                    </p>
                    {analytics.properties === 0 && (
                      <p className="text-xs text-gray-500">
                        No properties listed yet
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-home text-blue-600 text-xl"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Bookings</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {analytics.bookings}
                    </p>
                    <p className="text-xs text-gray-500">{analytics.bookings === 0 ? 'No bookings yet' : 'this month'}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-check text-green-600 text-xl"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(analytics.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics.revenue === 0 ? 'Start listing to earn' : 'this month'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-yellow-600 text-xl"></i>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-800">-</p>
                    <p className="text-xs text-gray-500">No reviews yet</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-star text-purple-600 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Bookings
                </h3>
                <div className="space-y-4">
                  <table className="w-full">
                    {bookings.length > 0 && (
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                            Property
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                            Dates
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                            Status
                          </th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                            Payment
                          </th>
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {bookingLoading ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-gray-600">
                                Loading bookings...
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : bookings.length > 0 ? (
                        bookings.slice(0, 5).map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-4 px-6">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {booking.property_title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {booking.nights} nights
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-gray-900">
                                {booking.check_in_date
                                  ? new Date(
                                      booking.check_in_date
                                    ).toLocaleDateString()
                                  : "N/A"}{" "}
                                -{" "}
                                {booking.check_out_date
                                  ? new Date(
                                      booking.check_out_date
                                    ).toLocaleDateString()
                                  : ""}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  booking.status || "unknown"
                                )}`}
                              >
                                {(booking.status || "unknown")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (booking.status || "unknown").slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                                  "paid"
                                )}`}
                              >
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-16 text-center">
                            <div className="text-center py-8">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-calendar-plus text-gray-400 text-xl"></i>
                              </div>
                              <h4 className="text-lg font-medium text-gray-800 mb-2">
                                No bookings yet
                              </h4>
                              <p className="text-gray-600 mb-4">
                                Start by listing your first property to receive
                                bookings
                              </p>
                              <button
                                onClick={() => setActiveTab("properties")}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <i className="fas fa-plus mr-2"></i>
                                Add Your First Property
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {bookings.length > 0 && (
                    <div
                      onClick={() => setActiveTab("bookings")}
                      className="text-blue-500 underline cursor-pointer w-full flex items-center justify-center mt-4 mb-4"
                    >
                      View more bookings
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Messages
                </h3>
                <div className="space-y-4">
                  {threads.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-comments text-gray-400 text-xl"></i>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">
                        No messages yet
                      </h4>
                      <p className="text-gray-600 mb-4">
                        You'll receive messages from guests once you have
                        bookings
                      </p>
                    </div>
                  ) : (
                    <div className="gap-6">
                      {/* Threads List */}
                      <div className="lg:col-span-1">
                        <div className="p-0">
                          <div className="space-y-1">
                            {threads.slice(0, 5).map((thread) => (
                              <div
                                key={thread.id}
                                className={`p-4 transition-colors border-b`}
                              >
                                <div className="flex items-start space-x-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback>
                                      {thread.guest_name?.charAt(0) || "G"}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {thread.guest_name}
                                      </h4>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs text-gray-500">
                                          {formatTime(thread.last_message_at)}
                                        </span>
                                      </div>
                                    </div>

                                    <p className="text-sm text-gray-600 truncate">
                                      {thread.property_title}
                                    </p>

                                    <p className="text-xs text-gray-500 truncate mt-1">
                                      {thread.last_message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-comments text-gray-400 text-xl"></i>
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">
                      No messages yet
                    </h4>
                    <p className="text-gray-600 mb-4">
                      You'll receive messages from guests once you have bookings
                    </p>
                  </div> */}
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  // Always render the full dashboard layout with sidebar
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div
          className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <img
                  src="https://static.readdy.ai/image/15b9112da3f324084e8b4fa88fcbe450/72b18a0ae9a329ec72d4c44a4f7ac86d.png"
                  alt="Picnify Logo"
                  className="h-8 w-auto"
                />
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <i className="fas fa-bars text-gray-600"></i>
            </button>
          </div>
          <nav className="mt-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? "bg-blue-50 border-r-2 border-blue-600 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          {/* Header */}
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-800">
                  Host Dashboard
                </h1>
                <div className="text-sm text-gray-500">
                  <span>Welcome back, {user?.email || "Host"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationDropdown />
                <div className="flex items-center space-x-2 relative group">
                  {user?.avatar_url ? (
                    <img
                      key={user.avatar_url}
                      src={user.avatar_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.email?.charAt(0).toUpperCase() || "O"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user?.email || "Host"}
                  </span>
                  <i className="fas fa-chevron-down text-gray-400 text-xs"></i>

                  {/* Dropdown Menu */}
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="p-6">{renderContent()}</main>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default OwnerDashboard;

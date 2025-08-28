import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { Badge } from '@/components/admin/ui/badge';
import { TrendingUp, TrendingDown, Users, Home, CreditCard, Calendar, BarChart3, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnalyticsFilters from '@/components/admin/AnalyticsFilters';
import EnhancedAnalyticsChart from '@/components/admin/EnhancedAnalyticsChart';
import RevenueTable from '@/components/admin/RevenueTable';
import { useAnalyticsExport } from '@/hooks/useAnalyticsExport';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsData {
  properties: {
    total: number;
    approved: number;
    pending: number;
    thisMonth: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    thisMonth: number;
  };
  users: {
    total: number;
    active: number;
    owners: number;
    agents: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [revenueByProperty, setRevenueByProperty] = useState<any[]>([]);
  const [revenueByOwner, setRevenueByOwner] = useState<any[]>([]);
  const [revenueByAgent, setRevenueByAgent] = useState<any[]>([]);
  const [topProperties, setTopProperties] = useState<any[]>([]);
  const [highestRated, setHighestRated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [granularity, setGranularity] = useState('day');
  const [propertyType, setPropertyType] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { exportToCsv, exportToPdf } = useAnalyticsExport();

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadAdvancedAnalytics();
  }, [startDate, endDate, granularity, propertyType, sortBy, sortDir, currentPage]);

  const loadAnalytics = async () => {
    try {
      const [overviewRes, revenueRes] = await Promise.all([
        supabase.functions.invoke('admin-analytics/overview'),
        supabase.functions.invoke('admin-analytics/revenue')
      ]);

      if (overviewRes.data) setData(overviewRes.data);
      if (revenueRes.data) setRevenueData(revenueRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdvancedAnalytics = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        granularity,
        property_type: propertyType === 'all' ? '' : propertyType,
        sort_by: sortBy,
        sort_dir: sortDir,
        limit: '50',
        offset: ((currentPage - 1) * 50).toString()
      });

      const [
        timeSeriesRes,
        revenueByPropertyRes,
        revenueByOwnerRes,
        revenueByAgentRes,
        topPropertiesRes,
        highestRatedRes
      ] = await Promise.all([
        supabase.functions.invoke(`admin-analytics/time-series?${params}`),
        supabase.functions.invoke(`admin-analytics/revenue-by-property?${params}`),
        supabase.functions.invoke(`admin-analytics/revenue-by-owner?${params}`),
        supabase.functions.invoke(`admin-analytics/revenue-by-agent?${params}`),
        supabase.functions.invoke(`admin-analytics/top-properties?${params}`),
        supabase.functions.invoke(`admin-analytics/highest-rated?${params}`)
      ]);

      if (timeSeriesRes.data?.data) setTimeSeriesData(timeSeriesRes.data.data);
      if (revenueByPropertyRes.data?.data) setRevenueByProperty(revenueByPropertyRes.data.data);
      if (revenueByOwnerRes.data?.data) setRevenueByOwner(revenueByOwnerRes.data.data);
      if (revenueByAgentRes.data?.data) setRevenueByAgent(revenueByAgentRes.data.data);
      if (topPropertiesRes.data?.data) setTopProperties(topPropertiesRes.data.data);
      if (highestRatedRes.data?.data) setHighestRated(highestRatedRes.data.data);
      
      // Calculate total pages (assuming 50 items per page)
      const totalItems = revenueByPropertyRes.data?.data?.length || 0;
      setTotalPages(Math.max(1, Math.ceil(totalItems / 50)));
      
    } catch (error) {
      console.error('Error loading advanced analytics:', error);
    }
  }, [startDate, endDate, granularity, propertyType, sortBy, sortDir, currentPage]);

  const handleExport = (exportFormat: 'csv' | 'pdf') => {
    const exportData = {
      data: revenueByProperty,
      filename: `analytics-${format(new Date(), 'yyyy-MM-dd')}`,
      headers: ['property_title', 'owner_name', 'revenue', 'bookings_count', 'cancellations', 'refunds_total']
    };

    if (exportFormat === 'csv') {
      exportToCsv(exportData);
    } else {
      exportToPdf(exportData);
    }
  };

  const handleReset = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    setGranularity('day');
    setPropertyType('all');
    setSortBy('revenue');
    setSortDir('desc');
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div>Error loading analytics</div>;

  const overviewCards = [
    {
      title: 'Total Properties',
      value: data.properties.total,
      change: data.properties.thisMonth,
      icon: Home,
      color: 'text-blue-600',
      link: '/admin/property-approval'
    },
    {
      title: 'Total Bookings',
      value: data.bookings.total,
      change: data.bookings.thisMonth,
      icon: Calendar,
      color: 'text-green-600',
      link: '/admin/booking-management'
    },
    {
      title: 'Active Users',
      value: data.users.active,
      change: Math.round((data.users.active / data.users.total) * 100),
      icon: Users,
      color: 'text-purple-600',
      link: '/admin/owner-management'
    },
    {
      title: 'Total Revenue',
      value: `₹${data.revenue.total.toLocaleString()}`,
      change: data.revenue.thisMonth,
      icon: CreditCard,
      color: 'text-orange-600',
      link: '/admin/commission-disbursement'
    }
  ];

  const propertyStatusData = [
    { name: 'Approved', value: data.properties.approved },
    { name: 'Pending', value: data.properties.pending }
  ];

  const userRoleData = [
    { name: 'Users', value: data.users.total - data.users.owners - data.users.agents },
    { name: 'Owners', value: data.users.owners },
    { name: 'Agents', value: data.users.agents }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Badge variant="outline">Real-time Data</Badge>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        startDate={startDate}
        endDate={endDate}
        granularity={granularity}
        propertyType={propertyType}
        sortBy={sortBy}
        sortDir={sortDir}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onGranularityChange={setGranularity}
        onPropertyTypeChange={setPropertyType}
        onSortByChange={setSortBy}
        onSortDirChange={setSortDir}
        onExport={handleExport}
        onReset={handleReset}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(card.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{card.change} this month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Analytics Tabs */}
      <Tabs defaultValue="time-series" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="time-series">Time Series</TabsTrigger>
          <TabsTrigger value="revenue-property">By Property</TabsTrigger>
          <TabsTrigger value="revenue-owner">By Owner</TabsTrigger>
          <TabsTrigger value="revenue-agent">By Agent</TabsTrigger>
          <TabsTrigger value="top-properties">Top Properties</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Time Series Analytics */}
        <TabsContent value="time-series" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedAnalyticsChart
              title="Revenue Trends"
              description={`${granularity.charAt(0).toUpperCase() + granularity.slice(1)} revenue analysis`}
              data={timeSeriesData.map(item => ({
                name: format(new Date(item.period), granularity === 'day' ? 'MMM dd' : 'MMM yyyy'),
                revenue: Number(item.total_revenue),
                bookings: Number(item.total_bookings)
              }))}
              type="line"
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--primary))" },
                bookings: { label: "Bookings", color: "hsl(var(--secondary))" }
              }}
              xAxisKey="name"
            />

            <EnhancedAnalyticsChart
              title="Booking Status Distribution"
              description="Current period booking statuses"
              data={timeSeriesData.length > 0 ? Object.entries(timeSeriesData[0]?.bookings_by_status || {}).map(([status, count]) => ({
                name: status,
                value: count
              })) : []}
              type="pie"
              config={{}}
              dataKey="value"
            />
          </div>

          <EnhancedAnalyticsChart
            title="Cancellations & Refunds"
            description="Track cancellations and refund amounts over time"
            data={timeSeriesData.map(item => ({
              name: format(new Date(item.period), granularity === 'day' ? 'MMM dd' : 'MMM yyyy'),
              cancellations: Number(item.cancellations),
              refunds: Number(item.refunds_total)
            }))}
            type="composed"
            config={{
              cancellations: { label: "Cancellations", color: "hsl(var(--destructive))", type: "bar" },
              refunds: { label: "Refunds", color: "hsl(var(--warning))" }
            }}
            xAxisKey="name"
          />
        </TabsContent>

        {/* Revenue by Property */}
        <TabsContent value="revenue-property" className="space-y-4">
          <RevenueTable
            title="Revenue by Property"
            description="Property performance ranked by revenue"
            data={revenueByProperty}
            columns={[
              { key: 'property_title', label: 'Property', sortable: true },
              { key: 'owner_name', label: 'Owner', sortable: true },
              { key: 'revenue', label: 'Revenue', sortable: true },
              { key: 'bookings_count', label: 'Bookings', sortable: true },
              { key: 'cancellations', label: 'Cancellations', sortable: true },
              { key: 'refunds_total', label: 'Refunds', sortable: true }
            ]}
            sortBy={sortBy}
            sortDir={sortDir as 'asc' | 'desc'}
            currentPage={currentPage}
            totalPages={totalPages}
            onSort={handleSort}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </TabsContent>

        {/* Revenue by Owner */}
        <TabsContent value="revenue-owner" className="space-y-4">
          <RevenueTable
            title="Revenue by Owner"
            description="Owner performance metrics"
            data={revenueByOwner}
            columns={[
              { key: 'owner_name', label: 'Owner', sortable: true },
              { key: 'revenue', label: 'Revenue', sortable: true },
              { key: 'bookings_count', label: 'Bookings', sortable: true },
              { key: 'cancellations', label: 'Cancellations', sortable: true },
              { key: 'refunds_total', label: 'Refunds', sortable: true }
            ]}
            sortBy={sortBy}
            sortDir={sortDir as 'asc' | 'desc'}
            currentPage={currentPage}
            totalPages={totalPages}
            onSort={handleSort}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </TabsContent>

        {/* Revenue by Agent */}
        <TabsContent value="revenue-agent" className="space-y-4">
          <RevenueTable
            title="Revenue by Agent"
            description="Agent performance and commission tracking"
            data={revenueByAgent}
            columns={[
              { key: 'agent_name', label: 'Agent', sortable: true },
              { key: 'revenue', label: 'Revenue', sortable: true },
              { key: 'bookings_count', label: 'Bookings', sortable: true },
              { key: 'cancellations', label: 'Cancellations', sortable: true },
              { key: 'refunds_total', label: 'Refunds', sortable: true }
            ]}
            sortBy={sortBy}
            sortDir={sortDir as 'asc' | 'desc'}
            currentPage={currentPage}
            totalPages={totalPages}
            onSort={handleSort}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </TabsContent>

        {/* Top Properties */}
        <TabsContent value="top-properties" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Most Booked Properties
                </CardTitle>
                <CardDescription>Properties with highest booking volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProperties.slice(0, 5).map((property, index) => (
                    <div 
                      key={property.property_id} 
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                      onClick={() => navigate(`/property/${property.property_id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{property.property_title}</p>
                          <p className="text-sm text-muted-foreground">{property.bookings_count} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{Number(property.revenue).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Highest Rated Properties
                </CardTitle>
                <CardDescription>Properties with best customer ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {highestRated.slice(0, 5).map((property, index) => (
                    <div 
                      key={property.property_id} 
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                      onClick={() => navigate(`/property/${property.property_id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{property.property_title}</p>
                          <p className="text-sm text-muted-foreground">{property.review_count} reviews</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">⭐ {Number(property.rating).toFixed(1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights & Comparisons */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
                <CardDescription>Month over month comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{data ? Math.round(((data.revenue.thisMonth / (data.revenue.total - data.revenue.thisMonth)) * 100)) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">vs previous month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Conversion</CardTitle>
                <CardDescription>Confirmed vs total bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data ? Math.round((data.bookings.confirmed / data.bookings.total) * 100) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">confirmation rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Revenue</CardTitle>
                <CardDescription>Per property performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{data ? Math.round(data.revenue.total / data.properties.approved).toLocaleString() : 0}
                </div>
                <p className="text-sm text-muted-foreground">per approved property</p>
              </CardContent>
            </Card>
          </div>

          {revenueData && (
            <EnhancedAnalyticsChart
              title="Monthly Revenue Trends"
              description="Year-over-year revenue comparison"
              data={revenueData.monthlyRevenue}
              type="area"
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--primary))" }
              }}
              xAxisKey="month"
              height={300}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
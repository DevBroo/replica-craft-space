import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { Badge } from '@/components/admin/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/admin/ui/chart';
import { TrendingUp, TrendingDown, Users, Home, CreditCard, Calendar } from 'lucide-react';

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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

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
      color: 'text-blue-600'
    },
    {
      title: 'Total Bookings',
      value: data.bookings.total,
      change: data.bookings.thisMonth,
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Active Users',
      value: data.users.active,
      change: Math.round((data.users.active / data.users.total) * 100),
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Total Revenue',
      value: `₹${data.revenue.total.toLocaleString()}`,
      change: data.revenue.thisMonth,
      icon: CreditCard,
      color: 'text-orange-600'
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
          <Card key={index}>
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

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="properties">Property Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trends over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData && (
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    approved: {
                      label: "Approved",
                      color: "hsl(var(--primary))",
                    },
                    pending: {
                      label: "Pending",
                      color: "hsl(var(--secondary))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {propertyStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Approval Rate</span>
                  <span className="text-2xl font-bold text-green-600">
                    {Math.round((data.properties.approved / data.properties.total) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">New This Month</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {data.properties.thisMonth}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pending Review</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {data.properties.pending}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    users: {
                      label: "Users",
                      color: "hsl(var(--primary))",
                    },
                    owners: {
                      label: "Owners", 
                      color: "hsl(var(--secondary))",
                    },
                    agents: {
                      label: "Agents",
                      color: "hsl(var(--accent))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userRoleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Users</span>
                  <span className="text-2xl font-bold">{data.users.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Users</span>
                  <span className="text-2xl font-bold text-green-600">{data.users.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Property Owners</span>
                  <span className="text-2xl font-bold text-blue-600">{data.users.owners}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Agents</span>
                  <span className="text-2xl font-bold text-purple-600">{data.users.agents}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
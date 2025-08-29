import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Mail, MessageSquare, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  methodBreakdown: Array<{ method: string; count: number; rate: number }>;
  dailyStats: Array<{ date: string; sent: number; delivered: number; failed: number }>;
  recentDeliveries: Array<{
    id: string;
    recipient_type: string;
    delivery_method: string;
    status: string;
    sent_at: string;
    error_message?: string;
  }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function NotificationAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Get delivery statistics
      const { data: deliveries, error } = await supabase
        .from('notification_deliveries')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process analytics data
      const totalSent = deliveries?.length || 0;
      const totalDelivered = deliveries?.filter(d => d.status === 'delivered' || d.status === 'sent').length || 0;
      const totalFailed = deliveries?.filter(d => d.status === 'failed').length || 0;
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

      // Method breakdown
      const methodCounts = deliveries?.reduce((acc, delivery) => {
        acc[delivery.delivery_method] = (acc[delivery.delivery_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const methodDelivered = deliveries?.filter(d => d.status === 'delivered' || d.status === 'sent')
        .reduce((acc, delivery) => {
          acc[delivery.delivery_method] = (acc[delivery.delivery_method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      const methodBreakdown = Object.entries(methodCounts).map(([method, count]) => ({
        method,
        count,
        rate: count > 0 ? ((methodDelivered[method] || 0) / count) * 100 : 0
      }));

      // Daily stats for chart
      const dailyStats = [];
      for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayDeliveries = deliveries?.filter(d => 
          d.created_at.startsWith(dateStr)
        ) || [];

        dailyStats.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sent: dayDeliveries.length,
          delivered: dayDeliveries.filter(d => d.status === 'delivered' || d.status === 'sent').length,
          failed: dayDeliveries.filter(d => d.status === 'failed').length,
        });
      }

      setAnalytics({
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate,
        methodBreakdown,
        dailyStats,
        recentDeliveries: deliveries?.slice(0, 10) || []
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    if (!analytics) return;

    try {
      const csvData = [
        ['Metric', 'Value'],
        ['Total Sent', analytics.totalSent],
        ['Total Delivered', analytics.totalDelivered],
        ['Total Failed', analytics.totalFailed],
        ['Delivery Rate (%)', analytics.deliveryRate.toFixed(2)],
        [''],
        ['Method', 'Count', 'Success Rate (%)'],
        ...analytics.methodBreakdown.map(m => [m.method, m.count, m.rate.toFixed(2)]),
        [''],
        ['Date', 'Sent', 'Delivered', 'Failed'],
        ...analytics.dailyStats.map(d => [d.date, d.sent, d.delivered, d.failed])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notification-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Analytics exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export analytics');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportAnalytics} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.totalDelivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.totalFailed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.deliveryRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Delivery Trends</CardTitle>
            <CardDescription>Notification delivery statistics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="delivered" fill="hsl(var(--primary))" name="Delivered" />
                <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Methods</CardTitle>
            <CardDescription>Breakdown by delivery channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.methodBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {analytics.methodBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {analytics.methodBreakdown.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="capitalize">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{method.count}</div>
                    <div className="text-sm text-muted-foreground">{method.rate.toFixed(1)}% success</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
          <CardDescription>Latest notification delivery attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentDeliveries.map((delivery) => (
              <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium capitalize">{delivery.delivery_method}</div>
                    <div className="text-sm text-muted-foreground">
                      To {delivery.recipient_type} • {new Date(delivery.sent_at).toLocaleString()}
                    </div>
                    {delivery.error_message && (
                      <div className="text-sm text-red-600 mt-1">{delivery.error_message}</div>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={delivery.status === 'sent' || delivery.status === 'delivered' ? 'default' : 
                          delivery.status === 'failed' ? 'destructive' : 'secondary'}
                >
                  {delivery.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
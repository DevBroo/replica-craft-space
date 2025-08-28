import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: authData } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    let result;

    switch (endpoint) {
      case 'overview':
        result = await getOverviewStats();
        break;
      case 'revenue':
        result = await getRevenueData();
        break;
      case 'bookings':
        result = await getBookingAnalytics();
        break;
      case 'properties':
        result = await getPropertyAnalytics();
        break;
      case 'users':
        result = await getUserAnalytics();
        break;
      default:
        result = { error: 'Invalid endpoint' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-analytics function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getOverviewStats() {
  const [propertiesResult, bookingsResult, usersResult, revenueResult] = await Promise.all([
    supabase.from('properties').select('id, status, created_at'),
    supabase.from('bookings').select('id, status, total_amount, created_at'),
    supabase.from('profiles').select('id, role, is_active, created_at'),
    supabase.from('bookings').select('total_amount, created_at').eq('status', 'confirmed')
  ]);

  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

  return {
    properties: {
      total: propertiesResult.data?.length || 0,
      approved: propertiesResult.data?.filter(p => p.status === 'approved').length || 0,
      pending: propertiesResult.data?.filter(p => p.status === 'pending').length || 0,
      thisMonth: propertiesResult.data?.filter(p => new Date(p.created_at) >= lastMonth).length || 0
    },
    bookings: {
      total: bookingsResult.data?.length || 0,
      confirmed: bookingsResult.data?.filter(b => b.status === 'confirmed').length || 0,
      pending: bookingsResult.data?.filter(b => b.status === 'pending').length || 0,
      thisMonth: bookingsResult.data?.filter(b => new Date(b.created_at) >= lastMonth).length || 0
    },
    users: {
      total: usersResult.data?.length || 0,
      active: usersResult.data?.filter(u => u.is_active).length || 0,
      owners: usersResult.data?.filter(u => u.role === 'property_owner').length || 0,
      agents: usersResult.data?.filter(u => u.role === 'agent').length || 0
    },
    revenue: {
      total: revenueResult.data?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0,
      thisMonth: revenueResult.data?.filter(b => new Date(b.created_at) >= lastMonth)
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0
    }
  };
}

async function getRevenueData() {
  const { data } = await supabase
    .from('bookings')
    .select('total_amount, created_at, status')
    .eq('status', 'confirmed')
    .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en-US', { month: 'short' }),
    revenue: 0
  }));

  data?.forEach(booking => {
    const month = new Date(booking.created_at).getMonth();
    monthlyRevenue[month].revenue += Number(booking.total_amount);
  });

  return { monthlyRevenue };
}

async function getBookingAnalytics() {
  const { data } = await supabase
    .from('bookings')
    .select('status, created_at, total_amount')
    .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

  const statusCounts = data?.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    statusCounts,
    totalBookings: data?.length || 0,
    averageValue: data?.length ? 
      data.reduce((sum, b) => sum + Number(b.total_amount), 0) / data.length : 0
  };
}

async function getPropertyAnalytics() {
  const { data } = await supabase
    .from('properties')
    .select('property_type, status, created_at');

  const typeDistribution = data?.reduce((acc, property) => {
    acc[property.property_type] = (acc[property.property_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    typeDistribution,
    totalProperties: data?.length || 0,
    approvalRate: data?.length ? 
      (data.filter(p => p.status === 'approved').length / data.length) * 100 : 0
  };
}

async function getUserAnalytics() {
  const { data } = await supabase
    .from('profiles')
    .select('role, is_active, created_at');

  const roleDistribution = data?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    roleDistribution,
    totalUsers: data?.length || 0,
    activeUsers: data?.filter(u => u.is_active).length || 0
  };
}
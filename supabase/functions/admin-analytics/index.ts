import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Create service role client for admin checks
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
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
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    
    // Create user-scoped client for RPC calls
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    });

    const { data: authData } = await supabaseAdmin.auth.getUser(authToken);

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using service role client
    const { data: profile } = await supabaseAdmin
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
    const searchParams = url.searchParams;

    let result;

    switch (endpoint) {
      case 'overview':
        result = await getOverviewStats();
        break;
      case 'revenue':
        result = await getRevenueData();
        break;
      case 'time-series':
        result = await getTimeSeriesAnalytics(supabase, searchParams);
        break;
      case 'revenue-by-property':
        result = await getRevenueByProperty(supabase, searchParams);
        break;
      case 'revenue-by-owner':
        result = await getRevenueByOwner(supabase, searchParams);
        break;
      case 'revenue-by-agent':
        result = await getRevenueByAgent(supabase, searchParams);
        break;
      case 'top-properties':
        result = await getTopProperties(supabase, searchParams);
        break;
      case 'highest-rated':
        result = await getHighestRatedProperties(supabase, searchParams);
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
    supabaseAdmin.from('properties').select('id, status, created_at'),
    supabaseAdmin.from('bookings').select('id, status, total_amount, created_at'),
    supabaseAdmin.from('profiles').select('id, role, is_active, created_at'),
    supabaseAdmin.from('bookings').select('total_amount, created_at').eq('status', 'confirmed')
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
  const { data } = await supabaseAdmin
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
  const { data } = await supabaseAdmin
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
  const { data } = await supabaseAdmin
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

// New analytics functions using the SQL functions

async function getTimeSeriesAnalytics(supabase: any, searchParams: URLSearchParams) {
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
  const granularity = searchParams.get('granularity') || 'day';
  const ownerId = searchParams.get('owner_id') || null;
  const agentId = searchParams.get('agent_id') || null;
  const propertyType = searchParams.get('property_type') || null;

  const { data, error } = await supabase.rpc('get_time_series_analytics', {
    start_date: startDate,
    end_date: endDate,
    granularity,
    v_owner_id: ownerId,
    v_agent_id: agentId,
    v_property_type: propertyType
  });

  if (error) {
    console.error('Error in getTimeSeriesAnalytics:', error);
    throw error;
  }
  return { data };
}

async function getRevenueByProperty(supabase: any, searchParams: URLSearchParams) {
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
  const ownerFilter = searchParams.get('owner_filter') || null;
  const agentFilter = searchParams.get('agent_filter') || null;
  const propertyTypeFilter = searchParams.get('property_type_filter') || null;
  const limitCount = parseInt(searchParams.get('limit') || '50');
  const offsetCount = parseInt(searchParams.get('offset') || '0');
  const sortBy = searchParams.get('sort_by') || 'revenue';
  const sortDir = searchParams.get('sort_dir') || 'desc';

  const { data, error } = await supabase.rpc('get_revenue_by_property', {
    start_date: startDate,
    end_date: endDate,
    v_owner_filter: ownerFilter,
    v_agent_filter: agentFilter,
    v_property_type_filter: propertyTypeFilter,
    limit_count: limitCount,
    offset_count: offsetCount,
    sort_by: sortBy,
    sort_dir: sortDir
  });

  if (error) {
    console.error('Error in getRevenueByProperty:', error);
    throw error;
  }
  return { data };
}

async function getRevenueByOwner(supabase: any, searchParams: URLSearchParams) {
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
  const agentFilter = searchParams.get('agent_filter') || null;
  const propertyTypeFilter = searchParams.get('property_type_filter') || null;
  const limitCount = parseInt(searchParams.get('limit') || '50');
  const offsetCount = parseInt(searchParams.get('offset') || '0');
  const sortBy = searchParams.get('sort_by') || 'revenue';
  const sortDir = searchParams.get('sort_dir') || 'desc';

  const { data, error } = await supabase.rpc('get_revenue_by_owner', {
    start_date: startDate,
    end_date: endDate,
    v_agent_filter: agentFilter,
    v_property_type_filter: propertyTypeFilter,
    limit_count: limitCount,
    offset_count: offsetCount,
    sort_by: sortBy,
    sort_dir: sortDir
  });

  if (error) {
    console.error('Error in getRevenueByOwner:', error);
    throw error;
  }
  return { data };
}

async function getRevenueByAgent(supabase: any, searchParams: URLSearchParams) {
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
  const ownerFilter = searchParams.get('owner_filter') || null;
  const propertyTypeFilter = searchParams.get('property_type_filter') || null;
  const limitCount = parseInt(searchParams.get('limit') || '50');
  const offsetCount = parseInt(searchParams.get('offset') || '0');
  const sortBy = searchParams.get('sort_by') || 'revenue';
  const sortDir = searchParams.get('sort_dir') || 'desc';

  const { data, error } = await supabase.rpc('get_revenue_by_agent', {
    start_date: startDate,
    end_date: endDate,
    v_owner_filter: ownerFilter,
    v_property_type_filter: propertyTypeFilter,
    limit_count: limitCount,
    offset_count: offsetCount,
    sort_by: sortBy,
    sort_dir: sortDir
  });

  if (error) {
    console.error('Error in getRevenueByAgent:', error);
    throw error;
  }
  return { data };
}

async function getTopProperties(supabase: any, searchParams: URLSearchParams) {
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
  const limitCount = parseInt(searchParams.get('limit') || '10');

  const { data, error } = await supabase.rpc('get_top_properties', {
    start_date: startDate,
    end_date: endDate,
    limit_count: limitCount
  });

  if (error) throw error;
  return { data };
}

async function getHighestRatedProperties(supabase: any, searchParams: URLSearchParams) {
  const limitCount = parseInt(searchParams.get('limit') || '10');
  const minReviews = parseInt(searchParams.get('min_reviews') || '5');

  const { data, error } = await supabase.rpc('get_highest_rated_properties', {
    limit_count: limitCount,
    min_reviews: minReviews
  });

  if (error) throw error;
  return { data };
}

async function getUserAnalytics() {
  const { data } = await supabaseAdmin
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
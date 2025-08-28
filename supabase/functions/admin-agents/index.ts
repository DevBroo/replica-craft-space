
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Access denied. Admin role required.');
    }

    const { action, ...body } = await req.json();

    switch (action) {
      case 'list':
        return await listAgents(supabaseClient, body.filters);
      
      case 'invite':
        return await inviteAgent(supabaseClient, body, user.id);
      
      case 'update_status':
        return await updateAgentStatus(supabaseClient, body.agent_id, body.status, user.id);
      
      case 'insights':
        return await getAgentInsights(supabaseClient, body.agent_id);
      
      case 'get_details':
        return await getAgentDetails(supabaseClient, body.agent_id);
      
      case 'update_profile':
        return await updateAgentProfile(supabaseClient, body.agent_id, body.profile_data, user.id);
      
      case 'reset_password':
        return await resetAgentPassword(supabaseClient, body.agent_id, user.id);
      
      case 'delete':
        return await deleteAgent(supabaseClient, body.agent_id, user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function listAgents(supabase: any, filters: any = {}) {
  console.log('📋 Listing agents with filters:', filters);
  
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      phone,
      role,
      avatar_url,
      created_at,
      updated_at,
      is_active,
      commission_rate,
      created_by
    `)
    .eq('role', 'agent')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters.status === 'inactive') {
      query = query.eq('is_active', false);
    }
  }

  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data: agents, error } = await query;

  if (error) throw error;

  // Get property assignment counts for each agent
  const agentsWithCounts = await Promise.all(
    (agents || []).map(async (agent: any) => {
      try {
        // Try to get assignment count, but don't fail if table doesn't exist yet
        const { count } = await supabase
          .from('agent_property_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id)
          .eq('status', 'active');
        
        return {
          ...agent,
          properties_count: count || 0
        };
      } catch (error) {
        console.log('Note: agent_property_assignments table not available yet');
        return {
          ...agent,
          properties_count: 0
        };
      }
    })
  );

  return new Response(
    JSON.stringify({ agents: agentsWithCounts }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function inviteAgent(supabase: any, agentData: any, adminId: string) {
  console.log('👤 Inviting new agent:', agentData.email);

  // Check if agent already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', agentData.email)
    .single();

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create a temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

  // Create user in auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: agentData.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: agentData.full_name,
      role: 'agent'
    }
  });

  if (authError) throw authError;

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      email: agentData.email,
      full_name: agentData.full_name,
      phone: agentData.phone,
      role: 'agent',
      commission_rate: agentData.commission_rate || 0.10,
      created_by: adminId,
      is_active: true
    });

  if (profileError) throw profileError;

  // Create extended agent profile if coverage area is provided
  if (agentData.coverage_area) {
    try {
      await supabase
        .from('agent_profiles')
        .insert({
          user_id: authUser.user.id,
          coverage_area: agentData.coverage_area,
          joining_date: new Date().toISOString().split('T')[0],
          status: 'active'
        });
    } catch (error) {
      console.log('Note: Extended profile creation skipped - table may not exist yet');
    }
  }

  // Log activity
  try {
    await supabase.rpc('log_agent_activity_fn', {
      p_agent_id: authUser.user.id,
      p_action: 'agent_invited',
      p_actor_id: adminId,
      p_actor_type: 'admin',
      p_metadata: {
        email: agentData.email,
        temp_password_sent: true
      }
    });
  } catch (error) {
    console.log('Note: Activity logging skipped - function may not exist yet');
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Agent invited successfully',
      temp_password: tempPassword
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateAgentStatus(supabase: any, agentId: string, status: string, adminId: string) {
  console.log('🔄 Updating agent status:', { agentId, status });

  const isActive = status === 'active';

  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId)
    .eq('role', 'agent');

  if (error) throw error;

  // Log activity
  try {
    await supabase.rpc('log_agent_activity_fn', {
      p_agent_id: agentId,
      p_action: 'status_updated',
      p_actor_id: adminId,
      p_actor_type: 'admin',
      p_metadata: {
        new_status: status,
        is_active: isActive
      }
    });
  } catch (error) {
    console.log('Note: Activity logging skipped - function may not exist yet');
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAgentInsights(supabase: any, agentId: string) {
  console.log('📊 Getting agent insights for:', agentId);

  // Get basic agent info
  const { data: agent, error: agentError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', agentId)
    .eq('role', 'agent')
    .single();

  if (agentError) throw agentError;

  // Get booking insights
  const { data: bookings } = await supabase
    .from('bookings')
    .select('total_amount, status, created_at')
    .eq('agent_id', agentId);

  const totalBookings = bookings?.length || 0;
  const totalRevenue = bookings?.reduce((sum: number, booking: any) => sum + (booking.total_amount || 0), 0) || 0;
  const confirmedBookings = bookings?.filter((b: any) => b.status === 'confirmed').length || 0;

  const insights = {
    agent,
    stats: {
      total_bookings: totalBookings,
      confirmed_bookings: confirmedBookings,
      total_revenue: totalRevenue,
      commission_earned: totalRevenue * (agent.commission_rate || 0.10),
      properties_assigned: 0 // Will be calculated when assignments table is available
    },
    recent_activity: [] // Will be populated when activity logs are available
  };

  return new Response(
    JSON.stringify({ insights }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAgentDetails(supabase: any, agentId: string) {
  console.log('🔍 Getting agent details for:', agentId);

  // Get basic profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', agentId)
    .eq('role', 'agent')
    .single();

  if (profileError) throw profileError;

  let agentProfile = null;
  let bankDetails = null;

  // Try to get extended profile
  try {
    const { data: extendedProfile } = await supabase
      .from('agent_profiles')
      .select('*')
      .eq('user_id', agentId)
      .single();
    
    agentProfile = extendedProfile;
  } catch (error) {
    console.log('Note: Extended profile not available yet');
  }

  // Try to get bank details
  try {
    const { data: bankData } = await supabase
      .from('agent_bank_details')
      .select('*')
      .eq('agent_id', agentId)
      .single();
    
    bankDetails = bankData;
  } catch (error) {
    console.log('Note: Bank details not available yet');
  }

  const agentDetails = {
    ...profile,
    agent_profile: agentProfile,
    bank_details: bankDetails,
    assignments: [],
    properties_count: 0,
    activity_logs: []
  };

  return new Response(
    JSON.stringify({ agent: agentDetails }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateAgentProfile(supabase: any, agentId: string, profileData: any, adminId: string) {
  console.log('📝 Updating agent profile:', agentId);

  // Update basic profile if provided
  if (profileData.basic) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        ...profileData.basic,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (profileError) throw profileError;
  }

  // Update extended profile if provided
  if (profileData.extended) {
    try {
      const { error: extendedError } = await supabase
        .from('agent_profiles')
        .upsert({
          user_id: agentId,
          ...profileData.extended,
          updated_at: new Date().toISOString()
        });

      if (extendedError) throw extendedError;
    } catch (error) {
      console.log('Note: Extended profile update skipped - table may not exist yet');
    }
  }

  // Update bank details if provided
  if (profileData.bank && profileData.bank.account_holder_name) {
    try {
      const { error: bankError } = await supabase
        .from('agent_bank_details')
        .upsert({
          agent_id: agentId,
          ...profileData.bank
        });

      if (bankError) throw bankError;
    } catch (error) {
      console.log('Note: Bank details update skipped - table may not exist yet');
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function resetAgentPassword(supabase: any, agentId: string, adminId: string) {
  console.log('🔑 Resetting password for agent:', agentId);

  // Generate new temporary password
  const newPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

  // Update password
  const { error } = await supabase.auth.admin.updateUserById(agentId, {
    password: newPassword
  });

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true,
      temp_password: newPassword,
      message: 'Password reset successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deleteAgent(supabase: any, agentId: string, adminId: string) {
  console.log('🗑️ Deleting agent:', agentId);

  // Check for active assignments first
  try {
    const { count: assignmentsCount } = await supabase
      .from('agent_property_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'active');

    if (assignmentsCount && assignmentsCount > 0) {
      throw new Error(`Cannot delete agent with ${assignmentsCount} active property assignments. Please reassign properties first.`);
    }
  } catch (error) {
    if (!error.message.includes('active property assignments')) {
      console.log('Note: Assignment check skipped - table may not exist yet');
    } else {
      throw error;
    }
  }

  // Delete the agent profile (this will cascade to related tables)
  const { error } = await supabase.auth.admin.deleteUser(agentId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-action, x-picnify-action, x-agent-email, x-agent-name, x-agent-phone, x-agent-coverage',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Admin Agents Function called')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No authorization header')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      console.error('❌ User is not an admin')
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await req.json()
    const { action } = body

    console.log('📋 Action requested:', action)

    switch (action) {
      case 'list':
        return await handleListAgents(supabaseClient, body.filters || {})
      
      case 'invite':
        return await handleInviteAgent(supabaseClient, body, user.id)
      
      case 'update_status':
        return await handleUpdateAgentStatus(supabaseClient, body, user.id)
      
      case 'insights':
        return await handleAgentInsights(supabaseClient, body.agent_id)
      
      case 'reset_password':
        return await handleResetAgentPassword(supabaseClient, body.agent_id, user.id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }

  } catch (error) {
    console.error('💥 Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handleListAgents(supabaseClient: any, filters: any) {
  try {
    console.log('📝 Listing agents with filters:', filters)
    
    let query = supabaseClient
      .from('profiles')
      .select(`
        *,
        agent_profiles!inner(
          coverage_area,
          aadhar_number,
          pan_number,
          joining_date,
          status,
          notes,
          commission_config
        ),
        created_by_profile:profiles!profiles_created_by_fkey(full_name)
      `)
      .eq('role', 'agent')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        query = query.eq('is_active', true)
      } else if (filters.status === 'inactive') {
        query = query.eq('is_active', false)
      } else if (filters.status === 'blocked') {
        query = query.eq('agent_profiles.status', 'blocked')
      }
    }

    if (filters.startDate && filters.endDate) {
      query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate + 'T23:59:59')
    }

    if (filters.coverageArea) {
      query = query.eq('agent_profiles.coverage_area', filters.coverageArea)
    }

    const { data: agents, error } = await query

    if (error) {
      console.error('❌ Error fetching agents:', error)
      throw error
    }

    // Get property assignment counts for each agent
    const agentsWithCounts = await Promise.all(
      agents.map(async (agent: any) => {
        const { count: propertiesCount } = await supabaseClient
          .from('agent_property_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id)
          .eq('status', 'active')

        return {
          ...agent,
          properties_count: propertiesCount || 0
        }
      })
    )

    console.log('✅ Agents fetched successfully:', agentsWithCounts.length)

    return new Response(
      JSON.stringify({ 
        success: true, 
        agents: agentsWithCounts 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('💥 Error in handleListAgents:', error)
    throw error
  }
}

async function handleInviteAgent(supabaseClient: any, agentData: any, adminId: string) {
  try {
    console.log('👤 Inviting new agent:', agentData.email)

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('id, role')
      .eq('email', agentData.email.toLowerCase())
      .single()

    if (existingUser) {
      if (existingUser.role === 'agent') {
        throw new Error('This email is already registered as an agent.')
      } else {
        throw new Error('This email is already registered with a different role.')
      }
    }

    // Create user via admin API
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email: agentData.email,
      password: generateRandomPassword(),
      email_confirm: true,
      user_metadata: {
        full_name: agentData.full_name,
        role: 'agent'
      }
    })

    if (createError) {
      console.error('❌ Error creating user:', createError)
      throw createError
    }

    // Create agent profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: agentData.email,
        full_name: agentData.full_name,
        phone: agentData.phone,
        role: 'agent',
        commission_rate: agentData.commission_rate || 0.05,
        created_by: adminId,
        is_active: true
      })

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
      throw profileError
    }

    // Create extended agent profile
    const { error: agentProfileError } = await supabaseClient
      .from('agent_profiles')
      .insert({
        user_id: newUser.user.id,
        coverage_area: agentData.coverage_area || '',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'active',
        commission_config: {
          type: 'percentage',
          rate: agentData.commission_rate || 5
        }
      })

    if (agentProfileError) {
      console.error('❌ Error creating agent profile:', agentProfileError)
      throw agentProfileError
    }

    // Log activity
    await supabaseClient.rpc('log_agent_activity_fn', {
      p_agent_id: newUser.user.id,
      p_action: 'agent_invited',
      p_actor_id: adminId,
      p_actor_type: 'admin',
      p_metadata: {
        invited_email: agentData.email,
        coverage_area: agentData.coverage_area
      }
    })

    console.log('✅ Agent invited successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agent invited successfully',
        agent_id: newUser.user.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('💥 Error in handleInviteAgent:', error)
    throw error
  }
}

async function handleUpdateAgentStatus(supabaseClient: any, data: any, adminId: string) {
  try {
    console.log('🔄 Updating agent status:', data)

    // Update basic profile status
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        is_active: data.status === 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.agent_id)
      .eq('role', 'agent')

    if (profileError) {
      console.error('❌ Error updating profile status:', profileError)
      throw profileError
    }

    // Update extended profile status
    const { error: agentProfileError } = await supabaseClient
      .from('agent_profiles')
      .update({ 
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', data.agent_id)

    if (agentProfileError) {
      console.error('❌ Error updating agent profile status:', agentProfileError)
      throw agentProfileError
    }

    // Log activity
    await supabaseClient.rpc('log_agent_activity_fn', {
      p_agent_id: data.agent_id,
      p_action: 'status_updated',
      p_actor_id: adminId,
      p_actor_type: 'admin',
      p_metadata: {
        old_status: 'unknown',
        new_status: data.status
      }
    })

    console.log('✅ Agent status updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agent status updated successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('💥 Error in handleUpdateAgentStatus:', error)
    throw error
  }
}

async function handleAgentInsights(supabaseClient: any, agentId: string) {
  try {
    console.log('📊 Fetching agent insights for:', agentId)

    // Get basic stats
    const { count: totalBookings } = await supabaseClient
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)

    const { count: activeAssignments } = await supabaseClient
      .from('agent_property_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'active')

    // Get revenue data
    const { data: bookingsData } = await supabaseClient
      .from('bookings')
      .select('total_amount, status, created_at')
      .eq('agent_id', agentId)
      .eq('status', 'confirmed')

    const totalRevenue = bookingsData?.reduce((sum: number, booking: any) => sum + (booking.total_amount || 0), 0) || 0

    // Get recent activity
    const { data: recentActivity } = await supabaseClient
      .from('agent_activity_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get commission data
    const { data: payouts } = await supabaseClient
      .from('agent_payouts')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    const totalCommissionEarned = payouts?.reduce((sum: number, payout: any) => sum + (payout.commission_amount || 0), 0) || 0
    const totalCommissionPaid = payouts?.filter((p: any) => p.status === 'paid').reduce((sum: number, payout: any) => sum + (payout.payout_amount || 0), 0) || 0

    const insights = {
      statistics: {
        total_bookings: totalBookings || 0,
        active_assignments: activeAssignments || 0,
        total_revenue: totalRevenue,
        commission_earned: totalCommissionEarned,
        commission_paid: totalCommissionPaid,
        commission_pending: totalCommissionEarned - totalCommissionPaid
      },
      recent_activity: recentActivity || [],
      payouts: payouts || []
    }

    console.log('✅ Agent insights fetched successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('💥 Error in handleAgentInsights:', error)
    throw error
  }
}

async function handleResetAgentPassword(supabaseClient: any, agentId: string, adminId: string) {
  try {
    console.log('🔑 Resetting password for agent:', agentId)

    // Get agent details
    const { data: agent } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', agentId)
      .eq('role', 'agent')
      .single()

    if (!agent) {
      throw new Error('Agent not found')
    }

    // Generate new password
    const newPassword = generateRandomPassword()

    // Update user password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      agentId, 
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      throw updateError
    }

    // Log activity
    await supabaseClient.rpc('log_agent_activity_fn', {
      p_agent_id: agentId,
      p_action: 'password_reset',
      p_actor_id: adminId,
      p_actor_type: 'admin',
      p_metadata: {
        reset_by_admin: true
      }
    })

    console.log('✅ Agent password reset successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully',
        new_password: newPassword
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('💥 Error in handleResetAgentPassword:', error)
    throw error
  }
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

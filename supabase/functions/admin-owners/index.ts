
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-action, x-picnify-action, x-owner-email, x-owner-name, x-owner-phone',
};

interface InviteOwnerRequest {
  email: string;
  full_name: string;
  phone?: string;
}

interface FilterOwnerRequest {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get Supabase admin client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authenticated user from the regular client
    const authHeader = req.headers.get('Authorization') || 
                      req.headers.get('authorization') || 
                      req.headers.get('x-supabase-authorization') || 
                      req.headers.get('X-Supabase-Authorization');
                      
    console.log('🔐 Auth header check:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('❌ No authorization header found');
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        message: 'Authorization header is missing. Please log in as an admin.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user is an admin using the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        message: 'Invalid or expired token. Please log in again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User authenticated:', user.id);

    // Check if user is admin using admin client (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      console.error('❌ Admin access denied:', profileError, 'user role:', profile?.role);
      return new Response(JSON.stringify({ 
        error: 'Access denied',
        message: 'Admin privileges required to perform this action.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Admin access verified for user:', user.id);

    // Safely parse request body with fallbacks
    let requestBody: any = {};
    let action = 'list'; // Default action
    
    try {
      const bodyText = await req.text();
      console.log('📦 Request body length:', bodyText.length);
      
      if (bodyText && bodyText.trim()) {
        requestBody = JSON.parse(bodyText);
        action = requestBody.action || 'list';
        console.log('✅ Parsed JSON body:', { action, hasEmail: !!requestBody.email });
      } else {
        console.log('⚠️ Empty request body, checking headers...');
      }
    } catch (jsonError) {
      console.log('⚠️ Failed to parse JSON body, checking headers...', jsonError.message);
    }

    // Fallback to headers if JSON parsing failed
    if (!requestBody.action) {
      action = req.headers.get('x-action') || 
              req.headers.get('x-picnify-action') ||
              req.headers.get('X-Action') || 
              req.headers.get('X-Picnify-Action') || 
              'list';
      
      // Get owner data from headers if invite action
      if (action === 'invite') {
        requestBody = {
          action: 'invite',
          email: req.headers.get('x-owner-email') || req.headers.get('X-Owner-Email'),
          full_name: req.headers.get('x-owner-name') || req.headers.get('X-Owner-Name'),
          phone: req.headers.get('x-owner-phone') || req.headers.get('X-Owner-Phone')
        };
        console.log('📋 Using headers for invite:', { email: requestBody.email, name: requestBody.full_name });
      }
    }

    console.log(`🎯 Processing action: ${action}`);

    if (action === 'invite') {
      const { email, full_name, phone }: InviteOwnerRequest = requestBody;

      // Validate input
      if (!email || !full_name) {
        return new Response(JSON.stringify({ 
          success: false, 
          code: 'validation_error',
          message: 'Email and full name are required' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`📧 Inviting new property owner: ${email}`);

      // Check if email already exists in profiles
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('role, email')
        .eq('email', email.toLowerCase())
        .single();

      if (!profileCheckError && existingProfile) {
        if (existingProfile.role === 'property_owner') {
          return new Response(JSON.stringify({
            success: false,
            code: 'email_exists',
            message: 'This email is already a property owner.'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            code: 'email_exists',
            message: `This email already has an account (role: ${existingProfile.role}). Please use a different email.`
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Use admin client to invite user and create profile
      try {
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name,
            phone,
            role: 'property_owner'
          },
          redirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}/owner/login`
        });

        if (inviteError) {
          console.error('❌ Error inviting user:', inviteError);
          
          // Handle GoTrue email_exists error gracefully
          if (inviteError.message?.includes('already been registered') || inviteError.code === 'email_exists') {
            return new Response(JSON.stringify({
              success: false,
              code: 'email_exists',
              message: 'This email is already registered. Please use a different email.'
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({
            success: false,
            code: 'invite_error',
            message: inviteError.message
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`✅ User invited successfully: ${authData.user?.id}`);

        // Create profile using admin client (bypasses RLS)
        if (authData.user) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email,
              full_name,
              phone: phone || null,
              role: 'property_owner',
              is_active: true,
              created_by: user.id, // Track who created this owner
              commission_rate: 0.10, // Default 10%
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('❌ Error creating profile:', profileError);
            // Don't fail the request if profile creation fails, the trigger should handle it
          } else {
            console.log('✅ Profile created successfully');
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Property owner invited successfully',
          user_id: authData.user?.id 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (inviteErr) {
        console.error('❌ Unexpected error during invite:', inviteErr);
        return new Response(JSON.stringify({
          success: false,
          code: 'unexpected_error',
          message: 'An unexpected error occurred while inviting the property owner.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'list') {
      console.log('📋 Fetching all property owners...');
      
      const filters: FilterOwnerRequest = requestBody.filters || {};
      
      // First, get all unique owner IDs from properties table
      const { data: propertyOwners, error: propOwnersError } = await supabaseAdmin
        .from('properties')
        .select('owner_id, created_at')
        .order('created_at', { ascending: false });

      if (propOwnersError) {
        console.error('❌ Error fetching property owners:', propOwnersError);
        return new Response(JSON.stringify({ error: propOwnersError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get unique owner IDs
      const uniqueOwnerIds = [...new Set(propertyOwners?.map(p => p.owner_id) || [])];
      console.log(`📊 Found ${uniqueOwnerIds.length} unique property owners`);

      if (uniqueOwnerIds.length === 0) {
        return new Response(JSON.stringify({ owners: [] }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Build query to get profiles for all property owners
      let query = supabaseAdmin
        .from('profiles')
        .select(`
          *,
          created_by_profile:created_by(full_name)
        `)
        .in('id', uniqueOwnerIds);

      // Apply search filter
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        const isActive = filters.status === 'active';
        query = query.eq('is_active', isActive);
      }

      // Apply date range filter
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }

      // Apply created_by filter
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }

      const { data: owners, error: ownersError } = await query.order('created_at', { ascending: false });

      if (ownersError) {
        console.error('❌ Error fetching owners:', ownersError);
        return new Response(JSON.stringify({ error: ownersError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get property counts for each owner
      const ownersWithCounts = await Promise.all(
        (owners || []).map(async (owner) => {
          const { count } = await supabaseAdmin
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', owner.id);

          return {
            ...owner,
            properties_count: count || 0,
            // Ensure property_owner role is set if they own properties
            role: owner.role || 'property_owner'
          };
        })
      );

      // Handle missing profiles by creating basic owner records
      const ownerIds = new Set(owners?.map(o => o.id) || []);
      const missingOwnerIds = uniqueOwnerIds.filter(id => !ownerIds.has(id));
      
      const missingOwners = await Promise.all(
        missingOwnerIds.map(async (ownerId) => {
          const { count } = await supabaseAdmin
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', ownerId);

          // Try to get basic info from auth.users if possible
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(ownerId);
          
          return {
            id: ownerId,
            email: authUser?.user?.email || `owner-${ownerId.slice(0, 8)}@unknown.com`,
            full_name: authUser?.user?.user_metadata?.full_name || 
                      authUser?.user?.user_metadata?.first_name + ' ' + authUser?.user?.user_metadata?.last_name ||
                      `Property Owner (${ownerId.slice(0, 8)})`,
            role: 'property_owner',
            phone: authUser?.user?.user_metadata?.phone || null,
            avatar_url: null,
            created_at: authUser?.user?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            created_by: null,
            commission_rate: 0.1,
            created_by_profile: null,
            properties_count: count || 0
          };
        })
      );

      const allOwners = [...ownersWithCounts, ...missingOwners];
      console.log(`✅ Found ${allOwners.length} total property owners (${ownersWithCounts.length} with profiles, ${missingOwners.length} missing profiles)`);

      return new Response(JSON.stringify({ owners: allOwners }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'insights') {
      const { owner_id } = requestBody;
      
      if (!owner_id) {
        return new Response(JSON.stringify({ error: 'Owner ID is required for insights' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`📊 Fetching insights for owner: ${owner_id}`);

      // Get owner's properties
      const { data: properties, error: propertiesError } = await supabaseAdmin
        .from('properties')
        .select('id, title, status, created_at')
        .eq('owner_id', owner_id);

      if (propertiesError) {
        return new Response(JSON.stringify({ error: propertiesError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const propertyIds = properties?.map(p => p.id) || [];

      // Get bookings for owner's properties
      const { data: bookings, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select('id, total_amount, status, created_at, check_in_date, check_out_date, property_id')
        .in('property_id', propertyIds);

      if (bookingsError) {
        return new Response(JSON.stringify({ error: bookingsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Calculate insights
      const totalRevenue = bookings?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
      const totalBookings = bookings?.length || 0;
      const activeBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const pendingProperties = properties?.filter(p => p.status === 'pending').length || 0;
      const approvedProperties = properties?.filter(p => p.status === 'approved').length || 0;

      // Get commission rate for this owner
      const { data: ownerProfile } = await supabaseAdmin
        .from('profiles')
        .select('commission_rate')
        .eq('id', owner_id)
        .single();

      const commissionRate = ownerProfile?.commission_rate || 0.10;
      const totalCommission = totalRevenue * commissionRate;

      const insights = {
        properties: {
          total: properties?.length || 0,
          approved: approvedProperties,
          pending: pendingProperties,
          rejected: properties?.filter(p => p.status === 'rejected').length || 0
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          completed: bookings?.filter(b => b.status === 'completed').length || 0,
          cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0
        },
        revenue: {
          total: totalRevenue,
          commission: totalCommission,
          commission_rate: commissionRate
        },
        recent_properties: properties?.slice(0, 5) || [],
        recent_bookings: bookings?.slice(0, 10) || []
      };

      return new Response(JSON.stringify({ insights }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update_status') {
      const { owner_id, is_active } = requestBody;
      
      if (!owner_id || typeof is_active !== 'boolean') {
        return new Response(JSON.stringify({ error: 'Owner ID and status are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`🔄 Updating owner status: ${owner_id} -> ${is_active ? 'active' : 'inactive'}`);

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', owner_id)
        .eq('role', 'property_owner');

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Log the action
      await supabaseAdmin
        .from('owner_admin_actions')
        .insert({
          owner_id,
          admin_id: user.id,
          action: is_active ? 'activate' : 'deactivate',
          metadata: { previous_status: !is_active, new_status: is_active }
        });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Owner ${is_active ? 'activated' : 'deactivated'} successfully` 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Error in admin-owners function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

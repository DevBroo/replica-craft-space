import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteOwnerRequest {
  email: string;
  full_name: string;
  phone?: string;
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

    // Parse request body
    const requestBody = await req.json();
    const { action } = requestBody;

    if (action === 'invite') {
      const { email, full_name, phone }: InviteOwnerRequest = requestBody;

      // Validate input
      if (!email || !full_name) {
        return new Response(JSON.stringify({ error: 'Email and full name are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`📧 Inviting new property owner: ${email}`);

      // Use admin client to invite user and create profile
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
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
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
    }

    if (action === 'list') {
      console.log('📋 Fetching all property owners...');

      // Get all property owners using admin client
      const { data: owners, error: ownersError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'property_owner')
        .order('created_at', { ascending: false });

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
            properties_count: count || 0
          };
        })
      );

      console.log(`✅ Found ${ownersWithCounts.length} property owners`);

      return new Response(JSON.stringify({ owners: ownersWithCounts }), {
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
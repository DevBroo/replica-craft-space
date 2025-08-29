import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phone, otp, user_id } = await req.json()

    if (!phone || !otp || !user_id) {
      throw new Error('Phone number, OTP, and user ID are required')
    }

    // Hash the provided OTP
    const encoder = new TextEncoder()
    const data = encoder.encode(otp)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const code_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Find matching OTP record
    const { data: codeRecord, error: fetchError } = await supabaseClient
      .from('phone_verification_codes')
      .select('*')
      .eq('user_id', user_id)
      .eq('phone', phone)
      .eq('code_hash', code_hash)
      .eq('consumed', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (fetchError || !codeRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mark OTP as consumed
    await supabaseClient
      .from('phone_verification_codes')
      .update({ consumed: true })
      .eq('id', codeRecord.id)

    // Update user security settings
    await supabaseClient
      .from('user_security_settings')
      .upsert({
        user_id,
        phone_verified: true
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Phone number verified successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error verifying OTP:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
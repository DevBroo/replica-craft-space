
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phone, otp, user_id } = await req.json()

    if (!phone || !otp || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Phone number, OTP, and user ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash the provided OTP for comparison
    const encoder = new TextEncoder()
    const data = encoder.encode(otp)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Find the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from('phone_verification_codes')
      .select('*')
      .eq('user_id', user_id)
      .eq('phone', phone)
      .eq('code_hash', codeHash)
      .is('consumed_at', null)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark OTP as consumed
    const { error: updateError } = await supabase
      .from('phone_verification_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', otpRecord.id)

    if (updateError) {
      console.error('Error updating OTP record:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to consume OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user security settings to mark phone as verified
    const { error: securityError } = await supabase
      .from('user_security_settings')
      .upsert({
        user_id,
        phone_verified: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (securityError) {
      console.error('Error updating security settings:', securityError)
      // Don't fail the verification, just log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Phone number verified successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

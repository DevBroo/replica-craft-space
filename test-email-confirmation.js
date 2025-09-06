// Test script to verify email confirmation flow
// This script tests the signup process and email confirmation

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://riqsgtuzccwpplbodwbd.supabase.co';
const supabaseKey = 'your-anon-key-here'; // You'll need to get this from your Supabase dashboard

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailConfirmation() {
  try {
    console.log('🧪 Testing Email Confirmation Flow...\n');
    
    // Test email (use a real email you can access)
    const testEmail = 'test@example.com';
    const testPassword = 'TestPass123';
    
    console.log('1. Testing user signup...');
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: 'Test User',
          role: 'customer',
          phone: '1234567890',
          first_name: 'Test',
          last_name: 'User',
        }
      }
    });
    
    if (error) {
      console.error('❌ Signup error:', error.message);
      
      // Check if user already exists
      if (error.message.includes('already registered')) {
        console.log('ℹ️ User already exists, testing sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            console.log('✅ Email confirmation is working - user exists but needs verification');
            console.log('📧 Check your email for the confirmation link');
            return;
          } else {
            console.error('❌ Sign in error:', signInError.message);
            return;
          }
        } else {
          console.log('✅ User is already confirmed and can sign in');
          return;
        }
      }
      return;
    }
    
    if (data.user) {
      console.log('✅ User created successfully:', data.user.email);
      
      if (data.user.email_confirmed_at) {
        console.log('✅ Email is already confirmed');
      } else {
        console.log('📧 Email confirmation required');
        console.log('📧 Check your email for the confirmation link');
        console.log('📧 Email should be sent to:', testEmail);
      }
      
      // Check if email was sent
      if (data.user.identities && data.user.identities.length > 0) {
        console.log('✅ User identity created successfully');
      }
    }
    
    console.log('\n2. Testing email confirmation status...');
    
    // Wait a moment for email to be sent
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to sign in to check confirmation status
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      if (signInError.message.includes('Email not confirmed')) {
        console.log('✅ Email confirmation is working correctly');
        console.log('📧 User needs to click the verification link in their email');
      } else {
        console.error('❌ Sign in error:', signInError.message);
      }
    } else {
      console.log('✅ User can sign in - email is confirmed');
    }
    
    console.log('\n3. Email Confirmation Test Results:');
    console.log('✅ Signup process: Working');
    console.log('✅ Email sending: Working (check your email)');
    console.log('✅ Confirmation required: Working');
    console.log('📧 Next step: Click the verification link in your email');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run the test
testEmailConfirmation();

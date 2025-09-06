#!/usr/bin/env node

/**
 * Email Configuration Test Script for Picnify
 * This script helps test if email notifications are working properly
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://riqsgtuzccwpplbodwbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXNndHV6Y2N3cHBsYm9kd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTY2NTUsImV4cCI6MjA2OTg3MjY1NX0.qkSVWoVi8cStB1WZdqtapc8O6jc_aAiYEm0Y5Lqp1-s';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration for Picnify\n');
  
  // Test 1: Check if we can connect to Supabase
  console.log('📡 Test 1: Checking Supabase connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
    return false;
  }

  // Test 2: Test email resend functionality
  console.log('\n📧 Test 2: Testing email resend functionality...');
  const testEmail = 'test@example.com'; // Replace with your email
  
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
      options: {
        emailRedirectTo: 'http://localhost:8080/auth/callback'
      }
    });
    
    if (error) {
      console.log('❌ Email resend failed:', error.message);
      console.log('💡 This might indicate email service is not configured');
      return false;
    }
    
    console.log('✅ Email resend successful');
    console.log('📧 Check your email inbox for the verification email');
  } catch (error) {
    console.log('❌ Email resend error:', error.message);
    return false;
  }

  return true;
}

async function provideConfigurationGuide() {
  console.log('\n🔧 Email Configuration Guide:');
  console.log('=====================================');
  
  console.log('\n📝 Step 1: Access Supabase Dashboard');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Sign in with your credentials');
  console.log('3. Select project: riqsgtuzccwpplbodwbd');
  
  console.log('\n📝 Step 2: Configure Email Service');
  console.log('1. Navigate to: Authentication → Settings');
  console.log('2. Find "Email" section');
  console.log('3. Enable "Enable email confirmations"');
  console.log('4. Set Site URL to: http://localhost:8080');
  console.log('5. Add Redirect URLs:');
  console.log('   - http://localhost:8080/auth/callback');
  console.log('   - http://localhost:8080/confirm-email');
  
  console.log('\n📝 Step 3: Configure SMTP (Optional)');
  console.log('1. In Authentication → Settings');
  console.log('2. Find "SMTP Settings" section');
  console.log('3. Enable "Enable custom SMTP"');
  console.log('4. Configure with your email provider');
  
  console.log('\n📝 Step 4: Test Configuration');
  console.log('1. Save all settings');
  console.log('2. Wait 2-3 minutes for changes to propagate');
  console.log('3. Run this test script again');
  console.log('4. Create a new account to test email delivery');
  
  console.log('\n📝 Step 5: Check Email Templates');
  console.log('1. Go to: Authentication → Email Templates');
  console.log('2. Select "Confirm signup" template');
  console.log('3. Customize the template if needed');
  console.log('4. Save the template');
}

async function main() {
  console.log('🚀 Picnify Email Configuration Test\n');
  
  const success = await testEmailConfiguration();
  
  if (!success) {
    console.log('\n⚠️  Email configuration needs attention');
    await provideConfigurationGuide();
  } else {
    console.log('\n✅ Email configuration appears to be working!');
    console.log('📧 Check your email inbox for the test email');
  }
  
  console.log('\n📚 For more detailed instructions, see: SUPABASE_EMAIL_SETUP_GUIDE.md');
}

// Run the test
main().catch(console.error);

// Test Email Configuration After Supabase Dashboard Setup
import { createClient } from '@supabase/supabase-js';

console.log('📧 Testing Email Configuration After Dashboard Setup...\n');

// Supabase configuration
const SUPABASE_URL = 'https://riqsgtuzccwpplbodwbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXNndHV6Y2N3cHBsYm9kd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTY2NTUsImV4cCI6MjA2OTg3MjY1NX0.qkSVWoVi8cStB1WZdqtapc8O6jc_aAiYEm0Y5Lqp1-s';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEmailSending() {
  console.log('📧 Testing Email Sending...');
  
  try {
    // Test resending confirmation email
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: 'mahinstlucia@gmail.com'
    });
    
    if (error) {
      console.log('❌ Email sending failed:', error.message);
      return false;
    }
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Check your email inbox and spam folder');
    return true;
  } catch (error) {
    console.log('❌ Email test failed:', error.message);
    return false;
  }
}

async function testRegistrationFlow() {
  console.log('\n🔐 Testing Registration Flow...');
  
  try {
    // Test registration (this will fail if email already exists, which is expected)
    const { data, error } = await supabase.auth.signUp({
      email: 'mahinstlucia@gmail.com',
      password: 'TestPassword123!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          role: 'customer'
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already in use')) {
        console.log('✅ Registration test completed (email already exists - expected)');
        console.log('📧 If email confirmations are enabled, you should receive an email');
        return true;
      } else {
        console.log('❌ Registration error:', error.message);
        return false;
      }
    }
    
    console.log('✅ Registration successful!');
    console.log('📧 Confirmation email should be sent');
    return true;
  } catch (error) {
    console.log('❌ Registration test failed:', error.message);
    return false;
  }
}

async function provideDashboardConfigurationGuide() {
  console.log('\n🚀 Supabase Dashboard Configuration Guide:');
  
  console.log('\n📝 Step 1: Access Supabase Dashboard');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Sign in with your credentials');
  console.log('3. Select project: riqsgtuzccwpplbodwbd');
  
  console.log('\n📝 Step 2: Enable Email Confirmations');
  console.log('1. Navigate to: Authentication → Settings');
  console.log('2. Find "Enable email confirmations"');
  console.log('3. Toggle it ON');
  console.log('4. Set "Site URL" to: http://localhost:8080');
  console.log('5. Add "Redirect URLs": http://localhost:8080/confirm-email');
  console.log('6. Click "Save"');
  
  console.log('\n📝 Step 3: Configure Email Template (Optional)');
  console.log('1. Go to: Authentication → Email Templates');
  console.log('2. Select "Confirm signup" template');
  console.log('3. Customize the email content if desired');
  console.log('4. Click "Save"');
  
  console.log('\n📝 Step 4: Test Configuration');
  console.log('1. Run this script again after configuration');
  console.log('2. Check email inbox and spam folder');
  console.log('3. Verify email confirmation works');
  
  return true;
}

async function runEmailTest() {
  console.log('🎯 Email Configuration Test for mahinstlucia@gmail.com');
  console.log('=' .repeat(60));
  
  const results = {
    emailSending: await testEmailSending(),
    registration: await testRegistrationFlow(),
    guide: await provideDashboardConfigurationGuide()
  };
  
  console.log('\n📊 Test Results:');
  console.log(`  Email Sending: ${results.emailSending ? '✅' : '❌'}`);
  console.log(`  Registration Flow: ${results.registration ? '✅' : '❌'}`);
  console.log(`  Configuration Guide: ${results.guide ? '✅' : '❌'}`);
  
  console.log('\n📧 Email Status:');
  if (results.emailSending) {
    console.log('  ✅ Email sending is working');
    console.log('  📧 Check mahinstlucia@gmail.com inbox and spam folder');
  } else {
    console.log('  ❌ Email sending needs configuration');
    console.log('  🔧 Follow the dashboard configuration guide above');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('  1. 🔧 Configure Supabase dashboard settings');
  console.log('  2. 🔧 Enable email confirmations');
  console.log('  3. 🔧 Set redirect URLs');
  console.log('  4. 🔧 Run this test again');
  console.log('  5. 🔧 Check email delivery');
  
  console.log('\n🎉 Ready for Dashboard Configuration!');
  console.log('  Follow the guide above to enable email confirmations.');
  console.log('  Once configured, run this script again to test.');
}

runEmailTest().catch(console.error);

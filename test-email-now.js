// Quick test to check email confirmation
// Run this in your browser console on the signup page

async function testEmailConfirmation() {
  console.log('🧪 Testing Email Confirmation...');
  
  // Get Supabase client (this should work if you're on the signup page)
  const { createClient } = window.supabase || {};
  
  if (!createClient) {
    console.error('❌ Supabase client not found. Make sure you\'re on the signup page.');
    return;
  }
  
  const supabase = createClient(
    'https://riqsgtuzccwpplbodwbd.supabase.co',
    'your-anon-key' // You'll need to get this from your Supabase dashboard
  );
  
  try {
    // Test with a real email address
    const testEmail = prompt('Enter your email address for testing:');
    const testPassword = 'TestPass123';
    
    if (!testEmail) {
      console.log('❌ No email provided');
      return;
    }
    
    console.log('📧 Testing signup with email:', testEmail);
    
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
      
      if (error.message.includes('already registered')) {
        console.log('ℹ️ User already exists. Checking confirmation status...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            console.log('✅ Email confirmation is working - user needs to verify email');
            console.log('📧 Check your email for the confirmation link');
          } else {
            console.error('❌ Sign in error:', signInError.message);
          }
        } else {
          console.log('✅ User is already confirmed and can sign in');
        }
      }
    } else {
      console.log('✅ User created successfully:', data.user?.email);
      
      if (data.user?.email_confirmed_at) {
        console.log('✅ Email is already confirmed');
      } else {
        console.log('📧 Email confirmation required');
        console.log('📧 Check your email for the confirmation link');
        console.log('📧 Email should be sent to:', testEmail);
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run the test
testEmailConfirmation();

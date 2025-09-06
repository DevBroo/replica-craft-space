// Test script to manually add bio data to a user profile
// This is for testing purposes only

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://riqsgtuzccwpplbodwbd.supabase.co';
const supabaseKey = 'your-anon-key-here'; // You'll need to get this from your Supabase dashboard

const supabase = createClient(supabaseUrl, supabaseKey);

async function addBioData() {
  try {
    // Replace with the actual user ID from the error message
    const userId = '6ceca7f2-9014-470d-a4ac-3cf81cfd771b';
    
    // First, let's try to add the bio fields to the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update({
        about: 'This is a test bio to verify the bio display functionality is working correctly.',
        location: 'Test Location',
        languages: ['English', 'Hindi', 'Spanish']
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating profile:', error);
      
      // If the fields don't exist, let's try to add them first
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('Bio fields do not exist in the database. Please run the migration first.');
        console.log('You can run: npx supabase db push');
      }
    } else {
      console.log('Bio data added successfully:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

addBioData();

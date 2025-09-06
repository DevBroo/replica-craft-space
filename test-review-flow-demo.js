// Test Review Flow Demo Script
// This script creates test data to demonstrate the complete review flow

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://riqsgtuzccwpplbodwbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXNndHV6Y2N3cHBsYm9kd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzQ4NzEsImV4cCI6MjA0OTY1MDg3MX0.riqsgtuzccwpplbodwbd';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestReviewFlow() {
  console.log('🚀 Creating test review flow data...');

  try {
    // Step 1: Create a test property owner
    console.log('📝 Step 1: Creating test property owner...');
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .insert({
        id: 'test-owner-123',
        email: 'owner@test.com',
        full_name: 'Test Property Owner',
        role: 'owner',
        phone: '+91 9876543210'
      })
      .select()
      .single();

    if (ownerError && !ownerError.message.includes('duplicate')) {
      console.error('❌ Error creating owner:', ownerError);
    } else {
      console.log('✅ Test property owner created');
    }

    // Step 2: Create a test property
    console.log('📝 Step 2: Creating test property...');
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert({
        id: 'test-property-123',
        title: 'Test Beach Villa',
        description: 'A beautiful beach villa for testing reviews',
        property_type: 'Villa',
        address: 'Goa, India',
        price_per_night: 5000,
        owner_id: 'test-owner-123',
        images: ['https://via.placeholder.com/400x300'],
        amenities: ['WiFi', 'Pool', 'Beach Access'],
        status: 'active'
      })
      .select()
      .single();

    if (propertyError && !propertyError.message.includes('duplicate')) {
      console.error('❌ Error creating property:', propertyError);
    } else {
      console.log('✅ Test property created');
    }

    // Step 3: Create a test customer
    console.log('📝 Step 3: Creating test customer...');
    const { data: customerProfile, error: customerError } = await supabase
      .from('profiles')
      .insert({
        id: 'test-customer-123',
        email: 'customer@test.com',
        full_name: 'Test Customer',
        role: 'customer',
        phone: '+91 9876543211'
      })
      .select()
      .single();

    if (customerError && !customerError.message.includes('duplicate')) {
      console.error('❌ Error creating customer:', customerError);
    } else {
      console.log('✅ Test customer created');
    }

    // Step 4: Create a completed booking
    console.log('📝 Step 4: Creating completed booking...');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: 'test-booking-123',
        property_id: 'test-property-123',
        user_id: 'test-customer-123',
        check_in_date: '2024-01-15',
        check_out_date: '2024-01-17',
        guests: 2,
        total_amount: 10000,
        status: 'completed',
        guest_name: 'Test Customer',
        guest_email: 'customer@test.com',
        guest_phone: '+91 9876543211'
      })
      .select()
      .single();

    if (bookingError && !bookingError.message.includes('duplicate')) {
      console.error('❌ Error creating booking:', bookingError);
    } else {
      console.log('✅ Completed booking created');
    }

    // Step 5: Create a test review
    console.log('📝 Step 5: Creating test review...');
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        id: 'test-review-123',
        booking_id: 'test-booking-123',
        property_id: 'test-property-123',
        user_id: 'test-customer-123',
        rating: 5,
        comment: 'Amazing property! Great location and amenities. Will definitely book again.',
        reviewer_name: 'Test Customer'
      })
      .select()
      .single();

    if (reviewError && !reviewError.message.includes('duplicate')) {
      console.error('❌ Error creating review:', reviewError);
    } else {
      console.log('✅ Test review created');
    }

    console.log('🎉 Test review flow data created successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log('- Property Owner: test-owner-123 (owner@test.com)');
    console.log('- Property: test-property-123 (Test Beach Villa)');
    console.log('- Customer: test-customer-123 (customer@test.com)');
    console.log('- Booking: test-booking-123 (completed)');
    console.log('- Review: test-review-123 (5 stars)');

    console.log('\n🧪 Testing Steps:');
    console.log('1. Login as customer@test.com');
    console.log('2. Go to Customer Dashboard > Reviews tab');
    console.log('3. You should see the completed booking eligible for review');
    console.log('4. Submit a review');
    console.log('5. Login as owner@test.com');
    console.log('6. Go to Owner Dashboard > Reviews section');
    console.log('7. You should see the review appear in real-time');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Run the test
createTestReviewFlow();

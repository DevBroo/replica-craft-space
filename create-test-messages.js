// Test Messages Creation Script
// This script creates test message data to demonstrate the messaging system

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://riqsgtuzccwpplbodwbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXNndHV6Y2N3cHBsYm9kd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzQ4NzEsImV4cCI6MjA0OTY1MDg3MX0.riqsgtuzccwpplbodwbd';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestMessages() {
  console.log('🚀 Creating test messages data...');

  try {
    // Step 1: Create test message thread
    console.log('📝 Step 1: Creating test message thread...');
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .insert({
        id: 'test-thread-123',
        booking_id: 'test-booking-123',
        property_id: 'test-property-123',
        guest_id: 'test-customer-123',
        owner_id: 'test-owner-123',
        subject: 'Messages for Test Beach Villa',
        is_active: true
      })
      .select()
      .single();

    if (threadError && !threadError.message.includes('duplicate')) {
      console.error('❌ Error creating message thread:', threadError);
    } else {
      console.log('✅ Test message thread created');
    }

    // Step 2: Create test messages
    console.log('📝 Step 2: Creating test messages...');
    
    const messages = [
      {
        id: 'test-message-1',
        booking_id: 'test-booking-123',
        property_id: 'test-property-123',
        sender_id: 'test-customer-123',
        receiver_id: 'test-owner-123',
        message: 'Hi! I\'m excited about my upcoming stay at your beach villa. Could you tell me more about the check-in process?',
        message_type: 'text',
        is_read: false
      },
      {
        id: 'test-message-2',
        booking_id: 'test-booking-123',
        property_id: 'test-property-123',
        sender_id: 'test-owner-123',
        receiver_id: 'test-customer-123',
        message: 'Hello! Welcome to our beach villa. Check-in is at 3 PM. I\'ll send you the key code closer to your arrival date.',
        message_type: 'text',
        is_read: true
      },
      {
        id: 'test-message-3',
        booking_id: 'test-booking-123',
        property_id: 'test-property-123',
        sender_id: 'test-customer-123',
        receiver_id: 'test-owner-123',
        message: 'Perfect! Also, is there a grocery store nearby? We\'d like to cook some meals during our stay.',
        message_type: 'text',
        is_read: false
      },
      {
        id: 'test-message-4',
        booking_id: 'test-booking-123',
        property_id: 'test-property-123',
        sender_id: 'test-owner-123',
        receiver_id: 'test-customer-123',
        message: 'Yes! There\'s a supermarket just 5 minutes away by car. I can send you the exact location if you\'d like.',
        message_type: 'text',
        is_read: true
      }
    ];

    for (const messageData of messages) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError && !messageError.message.includes('duplicate')) {
        console.error('❌ Error creating message:', messageError);
      } else {
        console.log('✅ Test message created:', messageData.id);
      }
    }

    console.log('🎉 Test messages data created successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log('- Message Thread: test-thread-123');
    console.log('- Messages: 4 sample messages between guest and owner');
    console.log('- Guest: test-customer-123 (customer@test.com)');
    console.log('- Owner: test-owner-123 (owner@test.com)');
    console.log('- Property: test-property-123 (Test Beach Villa)');

    console.log('\n🧪 Testing Steps:');
    console.log('1. Login as owner@test.com');
    console.log('2. Go to Owner Dashboard > Messages');
    console.log('3. You should see the conversation with the guest');
    console.log('4. Click on the conversation to view messages');
    console.log('5. Send a reply message');
    console.log('6. Login as customer@test.com to see the reply');

  } catch (error) {
    console.error('❌ Error creating test messages:', error);
  }
}

// Run the test
createTestMessages();

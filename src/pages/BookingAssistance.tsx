import React, { useState } from 'react';
import { Book, CreditCard, Calendar, Users, MapPin, CheckCircle, Phone, Mail, MessageCircle } from 'lucide-react';
import { AIChatModal } from '@/components/support/AIChatModal';

const BookingAssistance = () => {
  const [openChatModal, setOpenChatModal] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Book className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Booking Assistance</h1>
          <p className="text-xl opacity-90">Get help with your bookings every step of the way</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Booking Process Guide */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How to Book in 4 Easy Steps</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Search Properties</h3>
              <p className="text-muted-foreground">Enter your destination, dates, and group size to find available properties</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Select Dates</h3>
              <p className="text-muted-foreground">Choose your check-in and check-out dates based on availability</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Add Guests</h3>
              <p className="text-muted-foreground">Specify the number of guests to ensure the property can accommodate your group</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">4. Complete Payment</h3>
              <p className="text-muted-foreground">Make secure payment and receive instant booking confirmation</p>
            </div>
          </div>
        </section>

        {/* Payment Help */}
        <section className="mb-20 bg-muted/30 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-primary mr-3" />
            Payment Options & Security
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Accepted Payment Methods</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Credit Cards (Visa, MasterCard, American Express)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Debit Cards (All major banks)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  UPI (GPay, PhonePe, Paytm, BHIM)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Net Banking (All major banks)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Digital Wallets (Paytm, PhonePe, MobiKwik)
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Payment Security</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                  256-bit SSL encryption
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                  PCI DSS compliance
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                  3D Secure authentication
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                  No card details stored
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                  Instant payment confirmation
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Booking Help Topics */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Common Booking Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Can I book for someone else?</h3>
                <p className="text-muted-foreground">Yes, you can book for family or friends. Just provide their contact details during booking and ensure they have the booking confirmation.</p>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">What if my payment fails?</h3>
                <p className="text-muted-foreground">If payment fails, try a different payment method or contact your bank. The booking will be held for 15 minutes while you complete payment.</p>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Can I book multiple properties?</h3>
                <p className="text-muted-foreground">Yes, you can book multiple properties for the same or different dates. Each booking is processed separately.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">How do I know my booking is confirmed?</h3>
                <p className="text-muted-foreground">You'll receive an instant email confirmation with booking details and property contact information once payment is successful.</p>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Can I modify my booking?</h3>
                <p className="text-muted-foreground">Yes, modifications are possible up to 24 hours before check-in, subject to availability. Changes may incur additional charges.</p>
              </div>
              
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">What about booking for groups?</h3>
                <p className="text-muted-foreground">For groups over 15 people, contact our group booking specialists for special rates and arrangements.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cancellation & Refunds */}
        <section className="mb-20 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Cancellation & Refund Policy</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Free Cancellation</h3>
              <p className="text-sm text-muted-foreground">Cancel up to 24 hours before check-in for full refund</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2">Partial Refund</h3>
              <p className="text-sm text-muted-foreground">50% refund for cancellations 24-48 hours before check-in</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold mb-2">No Refund</h3>
              <p className="text-sm text-muted-foreground">No refund for cancellations within 24 hours of check-in</p>
            </div>
          </div>
        </section>

        {/* Get Help */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Personal Assistance?</h2>
          <p className="text-muted-foreground mb-8">Our booking specialists are here to help you find the perfect property</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Call Us</h3>
              <p className="text-sm text-muted-foreground mb-3">Speak with a booking expert</p>
              <p className="font-semibold mb-3">+91 80 1234 5678</p>
              <button 
                onClick={() => window.open('tel:+918012345678', '_self')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Call Now
              </button>
            </div>
            
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-3">Get instant help online</p>
              <button 
                onClick={() => setOpenChatModal(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Start Chat
              </button>
            </div>
            
            <div className="text-center">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email Us</h3>
              <p className="text-sm text-muted-foreground mb-3">Send us your questions</p>
              <p className="font-semibold">bookings@picnify.com</p>
            </div>
          </div>
        </section>
      </main>

      {/* AI Chat Modal */}
      <AIChatModal open={openChatModal} onOpenChange={setOpenChatModal} />
    </div>
  );
};

export default BookingAssistance;
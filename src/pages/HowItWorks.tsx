import { ArrowRight, Search, Calendar, MapPin, Shield, Star, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How Picnify Works</h1>
          <p className="text-xl opacity-90">Your perfect getaway is just a few clicks away</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* For Guests */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">For Guests</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Search & Discover</h3>
              <p className="text-muted-foreground">Browse through thousands of verified properties including villas, farmhouses, and picnic spots across India.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Book Instantly</h3>
              <p className="text-muted-foreground">Select your dates, choose group size, and book instantly with secure payment options and instant confirmation.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Enjoy Your Stay</h3>
              <p className="text-muted-foreground">Arrive at your destination and enjoy a memorable experience with 24/7 customer support available.</p>
            </div>
          </div>
        </section>

        {/* For Hosts */}
        <section className="mb-20 bg-muted/30 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-center mb-12">For Hosts</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. List Your Property</h3>
              <p className="text-muted-foreground">Create a detailed listing with photos, amenities, and pricing. Our verification team ensures quality standards.</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Manage Bookings</h3>
              <p className="text-muted-foreground">Use our dashboard to manage reservations, communicate with guests, and optimize your pricing.</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Earn Revenue</h3>
              <p className="text-muted-foreground">Receive payments securely and on time. Track your earnings and grow your hospitality business.</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose Picnify?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border rounded-lg">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Verified Properties</h3>
              <p className="text-sm text-muted-foreground">All properties are verified for safety and quality</p>
            </div>
            <div className="p-6 border rounded-lg">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Instant Booking</h3>
              <p className="text-sm text-muted-foreground">Book instantly without waiting for approval</p>
            </div>
            <div className="p-6 border rounded-lg">
              <Star className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">Customer support available round the clock</p>
            </div>
            <div className="p-6 border rounded-lg">
              <ArrowRight className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Best Prices</h3>
              <p className="text-sm text-muted-foreground">Competitive pricing with no hidden fees</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HowItWorks;
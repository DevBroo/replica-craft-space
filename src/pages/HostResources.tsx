import { Home, DollarSign, Star, Users, Camera, Shield, TrendingUp, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const HostResources = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-secondary to-primary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Home className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Host Resources</h1>
          <p className="text-xl opacity-90">Everything you need to become a successful property host</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Getting Started */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Start Your Hosting Journey</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 border rounded-lg">
              <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Create Your Listing</h3>
              <p className="text-muted-foreground mb-4">Upload high-quality photos and write compelling descriptions</p>
              <button className="text-primary font-semibold hover:underline">
                Listing Guide →
              </button>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Set Competitive Pricing</h3>
              <p className="text-muted-foreground mb-4">Use our pricing tools to maximize your earnings</p>
              <button className="text-primary font-semibold hover:underline">
                Pricing Strategy →
              </button>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Welcome Guests</h3>
              <p className="text-muted-foreground mb-4">Learn best practices for guest communication</p>
              <button className="text-primary font-semibold hover:underline">
                Host Tips →
              </button>
            </div>
          </div>
        </section>

        {/* Listing Optimization */}
        <section className="mb-20 bg-muted/30 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Optimize Your Listing</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <Camera className="w-6 h-6 text-primary mr-3" />
                Photography Tips
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Shoot in natural daylight for best results</li>
                <li>• Capture wide-angle shots of each room</li>
                <li>• Highlight unique features and amenities</li>
                <li>• Include outdoor spaces and views</li>
                <li>• Use a smartphone with good camera quality</li>
                <li>• Take 15-20 photos minimum for comprehensive coverage</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <BookOpen className="w-6 h-6 text-primary mr-3" />
                Writing Descriptions
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Start with an engaging headline</li>
                <li>• Mention unique selling points first</li>
                <li>• Include specific amenities and features</li>
                <li>• Describe the neighborhood and attractions</li>
                <li>• Use keywords guests search for</li>
                <li>• Keep it concise but informative</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing Strategy */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-primary mr-3" />
            Pricing Strategy
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-xl font-semibold mb-4">Dynamic Pricing</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Adjust prices based on demand</li>
                <li>• Higher rates for peak seasons</li>
                <li>• Weekend vs weekday pricing</li>
                <li>• Festival and event premiums</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-semibold mb-4">Competitive Analysis</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Research similar properties</li>
                <li>• Compare amenities and pricing</li>
                <li>• Monitor market trends</li>
                <li>• Position competitively</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-xl font-semibold mb-4">Revenue Optimization</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Minimum stay requirements</li>
                <li>• Early bird discounts</li>
                <li>• Last-minute pricing</li>
                <li>• Package deals and add-ons</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Guest Communication */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Excellent Guest Communication</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Before Check-in</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Welcome Message</h4>
                  <p className="text-sm text-muted-foreground">Send a warm welcome with check-in instructions</p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Property Details</h4>
                  <p className="text-sm text-muted-foreground">Share WiFi password, house rules, and local tips</p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Contact Information</h4>
                  <p className="text-sm text-muted-foreground">Provide your contact details for emergencies</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">During Stay</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-secondary pl-4">
                  <h4 className="font-semibold">Quick Response</h4>
                  <p className="text-sm text-muted-foreground">Respond to guest messages within 1 hour</p>
                </div>
                <div className="border-l-4 border-secondary pl-4">
                  <h4 className="font-semibold">Proactive Support</h4>
                  <p className="text-sm text-muted-foreground">Check in periodically without being intrusive</p>
                </div>
                <div className="border-l-4 border-secondary pl-4">
                  <h4 className="font-semibold">Local Recommendations</h4>
                  <p className="text-sm text-muted-foreground">Share favorite restaurants and attractions</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Legal & Safety */}
        <section className="mb-20 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Shield className="w-6 h-6 text-orange-600 mr-3" />
            Legal Requirements & Safety
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Legal Compliance</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Obtain necessary permits and licenses</li>
                <li>• Register with local authorities if required</li>
                <li>• Understand tax obligations</li>
                <li>• Maintain proper insurance coverage</li>
                <li>• Follow zoning regulations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Safety Standards</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Install smoke and carbon monoxide detectors</li>
                <li>• Provide fire extinguisher and first aid kit</li>
                <li>• Ensure proper lighting and secure locks</li>
                <li>• Regular maintenance and safety checks</li>
                <li>• Clear emergency exit information</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Track Your Success</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <Star className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Guest Reviews</h3>
              <p className="text-sm text-muted-foreground">Aim for 4.5+ star rating</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-lg">
              <TrendingUp className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Occupancy Rate</h3>
              <p className="text-sm text-muted-foreground">Target 70%+ occupancy</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg">
              <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Revenue Growth</h3>
              <p className="text-sm text-muted-foreground">Monthly revenue tracking</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">Under 1 hour average</p>
            </div>
          </div>
        </section>

        {/* Host Support */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Host Support?</h2>
          <p className="text-muted-foreground mb-8">Our host success team is here to help you maximize your earnings</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact#contact-form" className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-center">
              Contact Host Support
            </Link>
            <Link to="/trust-safety#community" className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors text-center">
              Join Host Community
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HostResources;
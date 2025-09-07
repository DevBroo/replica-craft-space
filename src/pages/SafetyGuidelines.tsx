import { Shield, CheckCircle, AlertTriangle, Phone, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const SafetyGuidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Safety Guidelines</h1>
          <p className="text-xl opacity-90">Your safety is our top priority</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Health & Safety */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <CheckCircle className="w-8 h-8 text-primary mr-3" />
            Health & Safety Protocols
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">For Guests</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  Follow all property-specific safety rules and guidelines
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  Maintain cleanliness and hygiene standards
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  Report any safety concerns immediately
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  Respect maximum occupancy limits
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  Use amenities responsibly and safely
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">For Hosts</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                  Regular safety inspections and maintenance
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                  Provide clear safety instructions and emergency contacts
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                  Install necessary safety equipment (fire extinguishers, first aid)
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                  Maintain accurate property descriptions and photos
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                  Respond promptly to guest safety concerns
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Emergency Procedures */}
        <section className="mb-20 bg-muted/30 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
            Emergency Procedures
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Emergency Contacts</h3>
              <p className="text-muted-foreground mb-4">Always have these numbers readily available:</p>
              <ul className="text-sm space-y-1">
                <li>Police: 100</li>
                <li>Fire: 101</li>
                <li>Medical: 102</li>
                <li>Picnify Support: 1800-XXX-XXXX</li>
              </ul>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Medical Emergencies</h3>
              <ul className="text-muted-foreground text-sm space-y-2">
                <li>• Contact local emergency services immediately</li>
                <li>• Notify host and Picnify support</li>
                <li>• Provide first aid if trained to do so</li>
                <li>• Follow local hospital directions</li>
              </ul>
            </div>
            <div className="text-center">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Incident Reporting</h3>
              <ul className="text-muted-foreground text-sm space-y-2">
                <li>• Document the incident with photos if safe</li>
                <li>• Report to Picnify within 24 hours</li>
                <li>• Cooperate with local authorities</li>
                <li>• Provide detailed incident reports</li>
              </ul>
            </div>
          </div>
        </section>

        {/* COVID-19 Guidelines */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8">COVID-19 Safety Guidelines</h2>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Current Protocols</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  Enhanced cleaning between bookings
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  Contactless check-in/check-out when possible
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  Sanitization stations available
                </li>
              </ul>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  Follow local government guidelines
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  Maintain social distancing where required
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  Report symptoms immediately
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center bg-primary/5 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Need Help with Safety Concerns?</h2>
          <p className="text-muted-foreground mb-6">Our safety team is available 24/7 to assist you</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/contact" 
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-center"
              aria-label="Contact our safety team"
            >
              Contact Safety Team
            </Link>
            <Link 
              to="/contact#contact-form" 
              className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors text-center"
              aria-label="Report a safety issue via contact form"
            >
              Report an Issue
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SafetyGuidelines;
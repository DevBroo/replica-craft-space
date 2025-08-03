import React, { useState, useEffect } from 'react';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';

// Scroll animation hook
const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.fade-in-up, .fade-in');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);
};

const Contact: React.FC = () => {
  // Initialize scroll animations
  useScrollAnimation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });

  const [activeTab, setActiveTab] = useState('contact');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const contactMethods = [
    {
      icon: 'fas fa-phone',
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      contact: '+91 80 1234 5678',
      availability: 'Mon-Fri 9AM-6PM IST',
      action: 'Call Now'
    },
    {
      icon: 'fas fa-envelope',
      title: 'Email Support',
      description: 'Send us your questions anytime',
      contact: 'support@picknify.in',
      availability: 'Response within 24 hours',
      action: 'Send Email'
    },
    {
      icon: 'fas fa-comments',
      title: 'Live Chat',
      description: 'Get instant help from our team',
      contact: 'Chat Available',
      availability: 'Online now',
      action: 'Start Chat'
    }
  ];

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'booking', label: 'Booking Support' },
    { value: 'property', label: 'Property Listing' },
    { value: 'payment', label: 'Payment Issues' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'partnership', label: 'Partnership' }
  ];

  const faqs = [
    {
      category: 'Booking',
      question: 'How do I make a booking on Picknify?',
      answer: 'Simply search for your destination, select your preferred property, choose your dates, and complete the secure payment process. You\'ll receive instant confirmation via email.'
    },
    {
      category: 'Payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. All payments are processed securely through our encrypted payment gateway.'
    },
    {
      category: 'Cancellation',
      question: 'What is your cancellation policy?',
      answer: 'Cancellation policies vary by property. Most offer free cancellation up to 24-48 hours before check-in. Please check the specific policy for each property before booking.'
    },
    {
      category: 'Safety',
      question: 'How do you ensure property safety and quality?',
      answer: 'All properties are verified through our rigorous inspection process. We conduct background checks on hosts and maintain 24/7 customer support for any issues.'
    },
    {
      category: 'Support',
      question: 'How can I contact customer support?',
      answer: 'You can reach us via phone (+91 80 1234 5678), email (support@picknify.in), or live chat. Our support team is available Monday to Friday, 9 AM to 6 PM IST.'
    },
    {
      category: 'Host',
      question: 'How can I list my property on Picknify?',
      answer: 'Click on "List Your Property" in the navigation menu, fill out the property details form, upload photos, and our team will review and approve your listing within 24-48 hours.'
    }
  ];

  const officeLocations = [
    {
      city: 'Bangalore',
      address: 'Tech Hub, Koramangala, Bangalore, Karnataka 560034',
      phone: '+91 80 1234 5678',
      hours: 'Mon-Fri: 9:00 AM - 6:00 PM IST',
      isHeadquarters: true
    },
    {
      city: 'Mumbai',
      address: 'Business Center, Andheri East, Mumbai, Maharashtra 400069',
      phone: '+91 22 9876 5432',
      hours: 'Mon-Fri: 9:00 AM - 6:00 PM IST',
      isHeadquarters: false
    },
    {
      city: 'Delhi',
      address: 'Corporate Plaza, Connaught Place, New Delhi 110001',
      phone: '+91 11 5555 4444',
      hours: 'Mon-Fri: 9:00 AM - 6:00 PM IST',
      isHeadquarters: false
    }
  ];

  return (
    <div className="min-h-screen bg-background font-poppins">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <img src={picnifyLogo} alt="Picnify.in Logo" className="h-12" />
              </a>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">Home</a>
              <a href="/properties" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">Properties</a>
              <a href="/locations" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">Locations</a>
              <a href="/about" className="text-foreground hover:text-brand-orange font-medium transition-colors duration-200 cursor-pointer">About</a>
              <a href="/contact" className="text-brand-orange font-medium cursor-pointer">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap rounded-button px-6 py-3">
                <i className="fas fa-user mr-2"></i>Login
              </button>
              <button className="bg-gradient-to-r from-brand-orange to-brand-red text-white px-6 py-3 hover:from-orange-600 hover:to-red-600 transition-all duration-300 cursor-pointer whitespace-nowrap rounded-button font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                <i className="fas fa-arrow-right-to-bracket mr-2"></i>Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 to-orange-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20customer%20service%20office%20with%20friendly%20support%20team%20working%20at%20computers%20bright%20welcoming%20atmosphere%20professional%20help%20desk%20environment%20clean%20contemporary%20design%20natural%20lighting&width=1440&height=600&seq=contact-hero1&orientation=landscape')`,
          backgroundBlendMode: 'overlay',
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 to-white/60"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 font-poppins mb-6 text-shadow">
              Contact <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Picnify</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              We're here to help you with any questions, concerns, or support you need. Our dedicated team is ready to assist you 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105">
                <i className="fas fa-phone text-xl"></i>
                <span>Call Us Now</span>
              </button>
              <button className="inline-flex items-center gap-3 bg-white text-red-600 px-8 py-4 rounded-xl border-2 border-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold text-lg shadow-xl hover:shadow-2xl">
                <i className="fas fa-comments text-xl"></i>
                <span>Start Live Chat</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-white fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-poppins mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600">Choose your preferred way to reach us</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <div key={index} className="relative group cursor-pointer fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift border border-gray-100">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <i className={`${method.icon} text-white text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{method.title}</h3>
                  <p className="text-gray-600 text-center mb-4">{method.description}</p>
                  <div className="text-center mb-4">
                    <div className="font-semibold text-gray-900 mb-1">{method.contact}</div>
                    <div className="text-sm text-gray-500">{method.availability}</div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-semibold">
                    {method.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Office Locations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-poppins mb-8">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Inquiry Type *</label>
                    <div className="relative">
                      <select
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm appearance-none cursor-pointer"
                        required
                      >
                        {inquiryTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    placeholder="What is this regarding?"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm resize-none"
                    required
                  ></textarea>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="privacy" className="w-5 h-5 text-red-600 cursor-pointer" required />
                  <label htmlFor="privacy" className="text-sm text-gray-600 cursor-pointer">
                    I agree to the <a href="#" className="text-red-600 hover:underline">Privacy Policy</a> and <a href="#" className="text-red-600 hover:underline">Terms of Service</a>
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-4 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  <i className="fas fa-paper-plane mr-3"></i>
                  Send Message
                </button>
              </form>
            </div>

            {/* Office Locations */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-poppins mb-8">Our Offices</h2>
              <div className="space-y-6 mb-8">
                {officeLocations.map((office, index) => (
                  <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{office.city}</h3>
                      {office.isHeadquarters && (
                        <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Headquarters
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-map-marker-alt text-red-600"></i>
                        <span className="text-gray-600">{office.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <i className="fas fa-phone text-red-600"></i>
                        <span className="text-gray-600">{office.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <i className="fas fa-clock text-red-600"></i>
                        <span className="text-gray-600">{office.hours}</span>
                      </div>
                    </div>
                    <button className="mt-4 w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer whitespace-nowrap !rounded-button font-medium">
                      <i className="fas fa-directions mr-2"></i>
                      Get Directions
                    </button>
                  </div>
                ))}
              </div>
              {/* Map Placeholder */}
              <div className="bg-gray-200 rounded-2xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-map text-4xl text-gray-400 mb-4"></i>
                  <div className="text-gray-600 font-semibold">Interactive Map</div>
                  <div className="text-sm text-gray-500">Office Locations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white fade-in-up">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-poppins mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Find quick answers to common questions</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item border border-gray-200 rounded-2xl overflow-hidden ${openFaq === index ? 'active' : ''}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <div>
                    <span className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold mr-3">
                      {faq.category}
                    </span>
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                  </div>
                  <i className={`fas fa-chevron-${openFaq === index ? 'up' : 'down'} text-gray-400 transition-transform duration-200`}></i>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <button className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-3 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-semibold">
              <i className="fas fa-envelope mr-2"></i>
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Social Media & Support Hours */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Social Media */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 font-poppins mb-8">Connect With Us</h2>
              <p className="text-xl text-gray-600 mb-8">Follow us on social media for updates, tips, and travel inspiration</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <a href="#" className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover-lift">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                    <i className="fab fa-facebook text-white text-xl"></i>
                  </div>
                  <span className="font-semibold text-gray-900">Facebook</span>
                  <span className="text-sm text-gray-500">50K+ followers</span>
                </a>
                <a href="#" className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover-lift">
                  <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center mb-3">
                    <i className="fab fa-instagram text-white text-xl"></i>
                  </div>
                  <span className="font-semibold text-gray-900">Instagram</span>
                  <span className="text-sm text-gray-500">75K+ followers</span>
                </a>
                <a href="#" className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover-lift">
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-3">
                    <i className="fab fa-twitter text-white text-xl"></i>
                  </div>
                  <span className="font-semibold text-gray-900">Twitter</span>
                  <span className="text-sm text-gray-500">25K+ followers</span>
                </a>
                <a href="#" className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover-lift">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-3">
                    <i className="fab fa-youtube text-white text-xl"></i>
                  </div>
                  <span className="font-semibold text-gray-900">YouTube</span>
                  <span className="text-sm text-gray-500">30K+ subscribers</span>
                </a>
              </div>
            </div>

            {/* Support Hours */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-poppins mb-8">Customer Support Hours</h2>
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900">Phone Support</span>
                    <span className="text-gray-600">Mon-Fri 9AM-6PM IST</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900">Live Chat</span>
                    <span className="text-green-600 font-medium">24/7 Available</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900">Email Support</span>
                    <span className="text-gray-600">24 hours response</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="font-semibold text-gray-900">Emergency Support</span>
                    <span className="text-red-600 font-medium">24/7 Available</span>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="fas fa-info-circle text-red-600"></i>
                    <span className="font-semibold text-gray-900">Current Status</span>
                  </div>
                  <p className="text-gray-600">All support channels are currently operational. Average response time: 2 minutes for chat, 4 hours for email.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-brand-red to-brand-orange rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-brand-orange to-yellow-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="mb-6">
                <img src={picnifyLogo} alt="Picnify.in Logo" className="h-12" />
              </div>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
                Picnify is your one-stop platform to discover and book day picnic spots, villas, farmhouses, and unique getaways, making your time with loved ones hassle-free and memorable
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="https://facebook.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                  <i className="fab fa-facebook-f text-xl group-hover:animate-bounce"></i>
                </a>
                <a href="https://instagram.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                  <i className="fab fa-instagram text-xl group-hover:animate-bounce"></i>
                </a>
                <a href="https://twitter.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                  <i className="fab fa-twitter text-xl group-hover:animate-bounce"></i>
                </a>
                <a href="https://youtube.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                  <i className="fab fa-youtube text-xl group-hover:animate-bounce"></i>
                </a>
                <a href="https://linkedin.com/company/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                  <i className="fab fa-linkedin-in text-xl group-hover:animate-bounce"></i>
                </a>
                <a href="https://wa.me/+919876543210" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                  <i className="fab fa-whatsapp text-xl group-hover:animate-bounce"></i>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>About Picknify</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>How It Works</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Safety Guidelines</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Support & Help</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>24/7 Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Contact Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Booking Assistance</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Host Resources</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Trust & Safety</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-12">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
              <div className="text-center lg:text-left">
                <p className="text-gray-400 text-lg">
                  © 2025 Picnify.in - Crafted with ❤️ in India. All rights reserved.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Connecting travelers with extraordinary experiences since 2024
                </p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.9★</div>
                  <div className="text-xs text-gray-400">App Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
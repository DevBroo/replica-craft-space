import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// Scroll animation hook
const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver(entries => {
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
const picnifyLogo = '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';
const About: React.FC = () => {
  // Initialize scroll animations
  useScrollAnimation();
  const [activeSection, setActiveSection] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    properties: 0,
    travelers: 0,
    cities: 0,
    satisfaction: 0
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  // Animate statistics on component mount
  useEffect(() => {
    const animateStats = () => {
      const targetStats = {
        properties: 1250,
        travelers: 75000,
        cities: 45,
        satisfaction: 98
      };
      
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setStats({
          properties: Math.floor(targetStats.properties * progress),
          travelers: Math.floor(targetStats.travelers * progress),
          cities: Math.floor(targetStats.cities * progress),
          satisfaction: Math.floor(targetStats.satisfaction * progress)
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, stepDuration);
    };
    
    animateStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you for your message! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const teamMembers = [{
    id: 1,
    name: 'Rajesh Kumar',
    position: 'Founder & CEO',
    bio: 'Visionary leader with 15+ years in hospitality and technology, passionate about transforming travel experiences.',
    image: 'https://readdy.ai/api/search-image?query=professional%20indian%20business%20executive%20ceo%20in%20modern%20office%20setting%20confident%20smile%20wearing%20business%20suit%20clean%20background%20corporate%20headshot%20style&width=300&height=300&seq=ceo1&orientation=squarish',
    social: {
      linkedin: '#',
      twitter: '#'
    }
  }, {
    id: 2,
    name: 'Priya Sharma',
    position: 'Head of Operations',
    bio: 'Operations expert ensuring seamless experiences for both travelers and hosts across India.',
    image: 'https://readdy.ai/api/search-image?query=professional%20indian%20businesswoman%20operations%20manager%20in%20modern%20office%20confident%20professional%20attire%20clean%20background%20corporate%20headshot%20style&width=300&height=300&seq=ops1&orientation=squarish',
    social: {
      linkedin: '#',
      twitter: '#'
    }
  }, {
    id: 3,
    name: 'Amit Patel',
    position: 'Head of Technology',
    bio: 'Tech innovator building cutting-edge solutions to make vacation rentals accessible and secure for everyone.',
    image: 'https://readdy.ai/api/search-image?query=professional%20indian%20technology%20executive%20software%20engineer%20in%20modern%20tech%20office%20casual%20professional%20attire%20clean%20background%20corporate%20headshot%20style&width=300&height=300&seq=tech1&orientation=squarish',
    social: {
      linkedin: '#',
      github: '#'
    }
  }, {
    id: 4,
    name: 'Sneha Gupta',
    position: 'Head of Customer Success',
    bio: 'Customer advocate dedicated to ensuring every traveler has an exceptional experience with Picnify.',
    image: 'https://readdy.ai/api/search-image?query=professional%20indian%20customer%20success%20manager%20businesswoman%20in%20modern%20office%20friendly%20smile%20professional%20attire%20clean%20background%20corporate%20headshot%20style&width=300&height=300&seq=cs1&orientation=squarish',
    social: {
      linkedin: '#',
      twitter: '#'
    }
  }];
  const milestones = [{
    year: '2024',
    title: 'Picnify.in Founded',
    description: 'Started with a vision to revolutionize vacation rentals in India, connecting travelers with authentic local experiences.'
  }, {
    year: '2024',
    title: '1000+ Properties Listed',
    description: 'Rapidly expanded our inventory across major tourist destinations in India, from beaches to mountains.'
  }, {
    year: '2024',
    title: '50,000+ Happy Travelers',
    description: 'Achieved significant milestone in customer satisfaction with thousands of successful bookings.'
  }, {
    year: '2024',
    title: 'Pan-India Expansion',
    description: 'Extended our services to cover all major states and union territories across India.'
  }];
  const values = [{
    icon: 'fas fa-heart',
    title: 'Trust & Safety',
    description: 'We prioritize the safety and security of our travelers and hosts through verified listings and secure transactions.'
  }, {
    icon: 'fas fa-star',
    title: 'Excellence',
    description: 'We strive for excellence in every interaction, ensuring exceptional experiences that exceed expectations.'
  }, {
    icon: 'fas fa-handshake',
    title: 'Community',
    description: 'We build strong communities by connecting people and creating meaningful relationships through travel.'
  }, {
    icon: 'fas fa-leaf',
    title: 'Sustainability',
    description: 'We promote responsible tourism that benefits local communities and preserves India\'s natural beauty.'
  }];
  const partners = [{
    name: 'Tourism Board',
    icon: 'fas fa-building'
  }, {
    name: 'Hotel Association',
    icon: 'fas fa-hotel'
  }, {
    name: 'Travel Agents',
    icon: 'fas fa-plane'
  }, {
    name: 'Local Guides',
    icon: 'fas fa-map-marked-alt'
  }, {
    name: 'Payment Partners',
    icon: 'fas fa-credit-card'
  }, {
    name: 'Insurance Partners',
    icon: 'fas fa-shield-alt'
  }];

  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      location: 'Mumbai, Maharashtra',
      rating: 5,
      text: 'Picnify has completely transformed how I travel in India. The properties are authentic, well-maintained, and the booking process is seamless. I\'ve had amazing experiences!',
      image: 'https://readdy.ai/api/search-image?query=happy%20indian%20woman%20traveler%20smiling%20in%20beautiful%20vacation%20rental%20setting%20positive%20review%20testimonial%20style&width=100&height=100&seq=test1&orientation=squarish'
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      location: 'Delhi, NCR',
      rating: 5,
      text: 'As a host, Picnify has helped me reach more travelers and increase my bookings by 300%. The platform is user-friendly and the support team is excellent.',
      image: 'https://readdy.ai/api/search-image?query=professional%20indian%20man%20property%20owner%20smiling%20confident%20business%20owner%20testimonial%20style&width=100&height=100&seq=test2&orientation=squarish'
    },
    {
      id: 3,
      name: 'Anita Patel',
      location: 'Bangalore, Karnataka',
      rating: 5,
      text: 'The customer service is outstanding! When I had an issue with my booking, they resolved it within hours. I highly recommend Picnify for anyone looking for quality vacation rentals.',
      image: 'https://readdy.ai/api/search-image?query=happy%20indian%20woman%20customer%20service%20satisfied%20smiling%20testimonial%20style&width=100&height=100&seq=test3&orientation=squarish'
    },
    {
      id: 4,
      name: 'Vikram Singh',
      location: 'Goa',
      rating: 5,
      text: 'I\'ve been using Picnify for family vacations for over a year now. The properties are exactly as described, and the owners are friendly and helpful. Great platform!',
      image: 'https://readdy.ai/api/search-image?query=happy%20indian%20man%20family%20traveler%20vacation%20smiling%20testimonial%20style&width=100&height=100&seq=test4&orientation=squarish'
    }
  ];

  return <div className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        .!rounded-button {
          border-radius: 12px;
        }
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-8px);
        }
        .gradient-border {
          background: linear-gradient(45deg, #f97316, #dc2626);
          padding: 2px;
          border-radius: 16px;
        }
        .gradient-border-inner {
          background: white;
          border-radius: 14px;
        }
        .text-shadow {
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .timeline-line {
          background: linear-gradient(to bottom, #ef4444, #f97316);
        }
        .milestone-dot {
          background: linear-gradient(45deg, #ef4444, #f97316);
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>



      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 to-orange-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20indian%20office%20workspace%20with%20diverse%20team%20collaboration%20bright%20natural%20lighting%20contemporary%20design%20professional%20atmosphere%20technology%20startup%20environment%20clean%20minimalist%20background&width=1440&height=600&seq=about-hero1&orientation=landscape')`,
        backgroundBlendMode: 'overlay'
      }}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 to-white/60"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 font-poppins mb-6 text-shadow">
              About <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Picnify.in</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              We're revolutionizing vacation rentals in India by connecting travelers with authentic experiences and empowering hosts to maximize their potential.
            </p>
            <a href="/" className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105">
              <i className="fas fa-arrow-left text-xl"></i>
              <span>Back to Home</span>
            </a>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-poppins mb-4">Our Impact in Numbers</h2>
            <p className="text-xl text-red-100">Growing every day to serve you better</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-4xl sm:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                {stats.properties.toLocaleString()}+
              </div>
              <div className="text-lg text-red-100 font-semibold">Properties</div>
              <div className="text-sm text-red-200 mt-1">Verified Listings</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl sm:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                {stats.travelers.toLocaleString()}+
              </div>
              <div className="text-lg text-red-100 font-semibold">Happy Travelers</div>
              <div className="text-sm text-red-200 mt-1">Satisfied Customers</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl sm:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                {stats.cities}+
              </div>
              <div className="text-lg text-red-100 font-semibold">Cities</div>
              <div className="text-sm text-red-200 mt-1">Across India</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl sm:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                {stats.satisfaction}%
              </div>
              <div className="text-lg text-red-100 font-semibold">Satisfaction</div>
              <div className="text-sm text-red-200 mt-1">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-20 bg-white fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-bullseye text-white text-2xl"></i>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-poppins">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                To democratize travel in India by making authentic, safe, and affordable vacation rentals accessible to everyone while empowering local hosts to build sustainable businesses.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe that travel should be transformative, connecting people with local cultures, communities, and experiences that create lasting memories and meaningful relationships.
              </p>
            </div>
            <div className="relative">
              <img src="https://readdy.ai/api/search-image?query=diverse%20group%20of%20indian%20travelers%20and%20property%20owners%20shaking%20hands%20in%20beautiful%20vacation%20rental%20setting%20warm%20welcoming%20atmosphere%20cultural%20exchange%20authentic%20experience&width=600&height=400&seq=mission1&orientation=landscape" alt="Our Mission" className="w-full h-96 object-cover object-top rounded-2xl shadow-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>

          {/* Core Values */}
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-poppins mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => <div key={index} className="text-center group cursor-pointer fade-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <i className={`${value.icon} text-white text-2xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors duration-300">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-gray-50 fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-poppins mb-4">Our Story</h2>
            <p className="text-xl text-gray-600">The journey that brought us here</p>
          </div>
          <div className="relative">
            {/* Timeline line - hidden on mobile */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full timeline-line rounded-full hidden md:block"></div>
            <div className="space-y-8 md:space-y-16">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex flex-col md:flex-row md:items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'} text-left`}>
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 hover-lift">
                      <div className="text-xl md:text-2xl font-bold text-red-600 mb-2">{milestone.year}</div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">{milestone.title}</h3>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                  {/* Timeline dot - hidden on mobile */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 milestone-dot rounded-full border-4 border-white shadow-lg hidden md:block"></div>
                  <div className="hidden md:block md:w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-poppins mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The passionate people behind Picnify.in</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map(member => <div key={member.id} className="text-center group cursor-pointer">
                <div className="relative mb-6 hover-lift">
                  <img src={member.image} alt={member.name} className="w-full h-64 object-cover object-top rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  <div className="absolute bottom-4 left-4 right-4 transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex justify-center gap-3">
                      {Object.entries(member.social).map(([platform, url]) => <a key={platform} href={url} className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                          <i className={`fab fa-${platform} text-gray-700`}></i>
                        </a>)}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">{member.name}</h3>
                <div className="text-red-600 font-semibold mb-4">{member.position}</div>
                <p className="text-gray-600 leading-relaxed">{member.bio}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-poppins mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Real stories from real people</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 hover-lift">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400 text-sm"></i>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-poppins mb-4">How Picnify Works</h2>
            <p className="text-xl text-gray-600">Simple steps to your perfect vacation rental</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group cursor-pointer">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <span className="text-white text-3xl font-bold">1</span>
                </div>
                <div className="absolute top-12 left-full w-full h-1 bg-gradient-to-r from-red-600 to-orange-500 hidden md:block transform -translate-y-1/2"></div>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-search text-blue-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors duration-300">Search & Discover</h3>
              <p className="text-gray-600 leading-relaxed">Browse through thousands of verified properties across India. Use our smart filters to find the perfect match for your needs.</p>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <span className="text-white text-3xl font-bold">2</span>
                </div>
                <div className="absolute top-12 left-full w-full h-1 bg-gradient-to-r from-red-600 to-orange-500 hidden md:block transform -translate-y-1/2"></div>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-calendar-check text-green-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors duration-300">Book Securely</h3>
              <p className="text-gray-600 leading-relaxed">Make secure payments through our platform. Get instant confirmation and connect directly with hosts.</p>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <span className="text-white text-3xl font-bold">3</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-heart text-purple-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors duration-300">Enjoy & Experience</h3>
              <p className="text-gray-600 leading-relaxed">Experience authentic local hospitality. Create memories that last a lifetime with our 24/7 customer support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-poppins mb-4">Our Partners</h2>
            <p className="text-xl text-gray-600">Working together to enhance your travel experience</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
            {partners.map((partner, index) => <div key={index} className="text-center group cursor-pointer">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors duration-300 hover-lift">
                  <i className={`${partner.icon} text-gray-600 text-2xl group-hover:text-red-600 transition-colors duration-300`}></i>
                </div>
                <div className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition-colors duration-300">{partner.name}</div>
              </div>)}
          </div>
          <div className="text-center">
            <Link to="/owner/signup">
              <button className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105">
                <i className="fas fa-handshake mr-3"></i>
                Become a Partner
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-poppins mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600">We'd love to hear from you</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h3>
              <div className="space-y-6 mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-map-marker-alt text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Office Address</div>
                    <div className="text-gray-600">Tech Hub, Bangalore, Karnataka 560001, India</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-phone text-orange-600 text-xl"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Phone Number</div>
                    <div className="text-gray-600">+91 80 1234 5678</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-envelope text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Email Address</div>
                    <div className="text-gray-600">hello@picnify.in</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-clock text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Business Hours</div>
                    <div className="text-gray-600">Mon - Fri: 9:00 AM - 6:00 PM IST</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-200 rounded-2xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-map text-4xl text-gray-400 mb-4"></i>
                  <div className="text-gray-600">Interactive Map</div>
                  <div className="text-sm text-gray-500">Office Location</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Send us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Your full name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="your.email@example.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Subject</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleFormChange} placeholder="What is this regarding?" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm" required />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Message</label>
                  <textarea name="message" value={formData.message} onChange={handleFormChange} placeholder="Tell us more about your inquiry..." rows={6} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm resize-none" required></textarea>
                </div>
                                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-4 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-3"></i>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-3"></i>
                        Send Message
                      </>
                    )}
                  </button>
              </form>
            </div>
          </div>
        </div>
      </section>



      {/* Back to Top Button */}
      <button onClick={() => window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })} className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full flex items-center justify-center hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl transform hover:scale-110 z-40">
        <i className="fas fa-arrow-up text-xl"></i>
      </button>
    </div>;
};
export default About;
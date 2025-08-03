import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('day-picnic');

  const topPicks = [
    {
      id: 1,
      name: 'Sunset Villa Resort',
      location: 'Goa',
      rating: 4.8,
      price: 2500,
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&h=300'
    },
    {
      id: 2,
      name: 'Mountain View Cottage',
      location: 'Manali',
      rating: 4.6,
      price: 1800,
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&h=300'
    },
    {
      id: 3,
      name: 'Beachside Paradise',
      location: 'Kerala',
      rating: 4.9,
      price: 3200,
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&h=300'
    },
    {
      id: 4,
      name: 'Garden Estate',
      location: 'Udaipur',
      rating: 4.7,
      price: 2200,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&h=300'
    }
  ];

  const featuredProperties = [
    {
      id: 1,
      name: 'Royal Heritage Villa',
      location: 'Jaipur',
      amenities: ['Pool', 'Garden', 'WiFi', 'Parking'],
      price: 4500,
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=400&h=280'
    },
    {
      id: 2,
      name: 'Lakeside Retreat',
      location: 'Nainital',
      amenities: ['Lake View', 'Fireplace', 'Kitchen', 'Balcony'],
      price: 2800,
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&h=280'
    },
    {
      id: 3,
      name: 'Farm House Bliss',
      location: 'Lonavala',
      amenities: ['Farm', 'BBQ', 'Games', 'Nature'],
      price: 1900,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&h=280'
    }
  ];

  const categories = [
    { name: 'Farm Houses', icon: 'fas fa-tractor' },
    { name: 'Beach Properties', icon: 'fas fa-umbrella-beach' },
    { name: 'Mountain Retreats', icon: 'fas fa-mountain' },
    { name: 'Garden Venues', icon: 'fas fa-leaf' },
    { name: 'Pool Villas', icon: 'fas fa-swimming-pool' }
  ];

  const propertyTypes = [
    { icon: 'fas fa-sun', label: 'Day Picnic', value: 'day-picnic' },
    { icon: 'fas fa-hotel', label: 'Resorts', value: 'resort' },
    { icon: 'fas fa-home', label: 'Villas', value: 'villa' },
    { icon: 'fas fa-warehouse', label: 'Farmhouse', value: 'farmhouse' },
    { icon: 'fas fa-house-user', label: 'Homestay', value: 'homestay' },
    { icon: 'fas fa-landmark', label: 'Heritage Palace', value: 'heritage' },
  ];

  return (
    <div className="min-h-screen bg-background font-poppins">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-r from-brand-orange to-brand-red rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  P
                </div>
                <span className="ml-3 text-2xl font-bold text-foreground">Picnify</span>
              </a>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-muted-foreground hover:text-brand-orange font-medium transition-colors duration-200">Home</a>
              <a href="/properties" className="text-muted-foreground hover:text-brand-orange font-medium transition-colors duration-200">Properties</a>
              <a href="/locations" className="text-muted-foreground hover:text-brand-orange font-medium transition-colors duration-200">Locations</a>
              <a href="/about" className="text-muted-foreground hover:text-brand-orange font-medium transition-colors duration-200">About</a>
              <a href="/contact" className="text-muted-foreground hover:text-brand-orange font-medium transition-colors duration-200">Contact</a>
              <div className="h-6 w-px bg-border mx-4"></div>
              <a href="/host" className="text-muted-foreground hover:text-brand-orange font-medium transition-colors duration-200 flex items-center gap-2">
                <i className="fas fa-plus-circle"></i>
                Become a Host
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="font-medium">
                <i className="fas fa-user mr-2"></i>Login
              </Button>
              <Button className="bg-gradient-to-r from-brand-orange to-brand-red hover:from-orange-600 hover:to-red-600 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <i className="fas fa-arrow-right-to-bracket mr-2"></i>Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(249, 115, 22, 0.6) 50%, rgba(0,0,0,0.4) 100%), url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1440&h=900')`
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob [animation-delay:2s]"></div>
        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob [animation-delay:4s]"></div>
        
        <div className="text-center text-white max-w-6xl mx-auto px-4 relative z-10">
          <div className="mb-8">
            <span className="inline-block px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/30 mb-4">
              ✨ India's Premier Vacation Rental Platform
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-8 tracking-tight leading-tight">
            Discover Perfect <br />
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent animate-pulse">Getaways</span> Near You
          </h1>
          <p className="text-xl md:text-3xl mb-12 opacity-95 font-light max-w-4xl mx-auto leading-relaxed">
            Where you create beautiful memories with your loved ones
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 mb-16">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <i className="fas fa-map-marked-alt text-green-400"></i>
              <span className="text-lg font-medium">500+ Premium Locations</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <i className="fas fa-star text-yellow-400"></i>
              <span className="text-lg font-medium">4.9/5 Customer Rating</span>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <Card className="bg-white/95 backdrop-blur-md border-white/20 shadow-xl max-w-7xl mx-auto transform hover:scale-[1.02] transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 mb-6 border-b border-border pb-4">
                {propertyTypes.map((category, index) => (
                  <Button
                    key={index}
                    variant={selectedPropertyType === category.value ? "default" : "outline"}
                    onClick={() => setSelectedPropertyType(category.value)}
                    className={`flex items-center gap-2 ${
                      selectedPropertyType === category.value
                        ? 'bg-gradient-to-r from-brand-red to-brand-orange text-white shadow-lg'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <i className={`${category.icon} text-lg`}></i>
                    <span className="font-medium whitespace-nowrap">{category.label}</span>
                  </Button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-center">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-map-marker-alt text-red-500 text-lg"></i>
                    </div>
                    <input
                      type="text"
                      placeholder="Where would you like to go?"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-foreground placeholder-muted-foreground border-2 border-border rounded-xl outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-base bg-background"
                    />
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-calendar-alt text-orange-500 text-lg"></i>
                    </div>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-foreground border-2 border-border rounded-xl outline-none focus:border-brand-orange focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 text-base bg-background"
                      style={{ minWidth: '180px' }}
                    />
                  </div>
                </div>
                
                <div className="lg:col-span-2 flex gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-users text-blue-500 text-lg"></i>
                    </div>
                    <select
                      className="w-full pl-12 pr-12 py-4 text-foreground border-2 border-border rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-base appearance-none cursor-pointer bg-background"
                      onChange={(e) => setGroupSize(e.target.value)}
                    >
                      <option value="">Select group size</option>
                      {[...Array(15)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} Guest{i !== 0 ? 's' : ''}</option>
                      ))}
                      <option value="custom">15+ Guests</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <i className="fas fa-chevron-down text-muted-foreground"></i>
                    </div>
                  </div>
                  
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-rupee-sign text-green-500 text-lg"></i>
                    </div>
                    <select className="w-full pl-12 pr-12 py-4 text-foreground border-2 border-border rounded-xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 text-base appearance-none cursor-pointer bg-background">
                      <option value="">Price per person</option>
                      <option value="0-500">Below ₹500</option>
                      <option value="500-1000">₹500 - ₹1,000</option>
                      <option value="1000-2000">₹1,000 - ₹2,000</option>
                      <option value="2000+">Above ₹2,000</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <i className="fas fa-chevron-down text-muted-foreground"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button className="bg-gradient-to-r from-brand-red to-brand-orange hover:from-red-700 hover:to-orange-700 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 h-14 w-full max-w-md">
                  <i className="fas fa-search text-xl"></i>
                  <span>Search</span>
                </Button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-muted-foreground font-medium">Popular:</span>
                  {['Goa Beach Villas', 'Himalayan Retreats', 'Rajasthan Palaces', 'Kerala Backwaters'].map((search, index) => (
                    <Button key={index} variant="outline" size="sm" className="text-sm font-medium">
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Top Picks Section */}
      <section className="py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-orange-200 to-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-red-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob [animation-delay:2s]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-block">
              <span className="text-brand-orange font-bold text-lg mb-4 block uppercase tracking-wider">Handpicked Excellence</span>
              <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6">
                Top Picks for You
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-brand-red to-brand-orange mx-auto rounded-full"></div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mt-6 leading-relaxed">
              Curated collection of the most stunning and luxurious properties that promise unforgettable experiences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {topPicks.map((property, index) => (
              <Card key={property.id} className="group cursor-pointer overflow-hidden border-2 border-transparent hover:border-gradient-to-r hover:from-brand-red hover:to-brand-orange transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-foreground shadow-lg">
                      <i className="fas fa-map-marker-alt text-red-500 mr-1"></i>
                      {property.location}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      <i className="fas fa-star mr-1"></i>
                      {property.rating}
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <Button className="w-full bg-white text-foreground hover:bg-muted">
                      View Details
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-brand-red transition-colors duration-300">{property.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-black text-foreground">
                      ₹{property.price.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground ml-1">per day</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`fas fa-star text-sm ${i < Math.floor(property.rating) ? 'text-yellow-400' : 'text-muted'}`}></i>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button className="bg-gradient-to-r from-brand-red to-brand-orange hover:from-red-700 hover:to-orange-600 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              Explore All Properties
              <i className="fas fa-arrow-right ml-3"></i>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent font-bold text-lg mb-4 block uppercase tracking-wider">Find Your Perfect Match</span>
            <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6">
              Explore by Category
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-brand-red to-brand-orange mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Choose from our meticulously curated categories to discover destinations that match your dream getaway perfectly
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="group cursor-pointer text-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-background via-orange-50 to-red-50 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:-rotate-3 border-2 border-border">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-red to-brand-orange rounded-3xl opacity-0 group-hover:opacity-90 transition-opacity duration-500"></div>
                    <i className={`${category.icon} text-4xl text-brand-red group-hover:text-white transition-colors duration-500 relative z-10`}></i>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-brand-red transition-colors duration-300 whitespace-nowrap">
                  {category.name}
                </h3>
                <div className="w-0 group-hover:w-16 h-0.5 bg-gradient-to-r from-brand-red to-brand-orange mx-auto mt-2 transition-all duration-500 rounded-full"></div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button variant="outline" className="font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2">
              View All Categories
              <i className="fas fa-grid-3x3 ml-3"></i>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Properties Grid */}
      <section className="py-32 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent font-bold text-lg mb-4 block uppercase tracking-wider">Premium Collection</span>
            <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6">
              Featured Properties
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-brand-red to-brand-orange mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredProperties.map((property, index) => (
              <Card key={property.id} className="group cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1 border">
                <div className="relative overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-4 right-4">
                    <Button size="icon" variant="outline" className="w-12 h-12 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-brand-red hover:text-white transition-all duration-300">
                      <i className="fas fa-heart"></i>
                    </Button>
                  </div>
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <Button className="bg-white text-foreground hover:bg-muted shadow-lg">
                      Quick View
                    </Button>
                  </div>
                </div>
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-brand-red transition-colors duration-300">{property.name}</h3>
                      <div className="flex items-center text-muted-foreground">
                        <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
                        <span className="font-medium">{property.location}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-foreground">₹{property.price.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">per day</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {property.amenities.map((amenity, amenityIndex) => (
                      <span key={amenityIndex} className="bg-gradient-to-r from-red-50 to-orange-50 text-red-700 px-4 py-2 rounded-full text-sm font-medium border border-red-100">
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <Button className="w-full bg-gradient-to-r from-brand-red to-brand-orange hover:from-red-700 hover:to-orange-600 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    Book Now
                    <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button variant="outline" className="font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2">
              View All Featured Properties
              <i className="fas fa-building ml-3"></i>
            </Button>
          </div>
        </div>
      </section>

      {/* Host CTA Section */}
      <section className="py-32 relative overflow-hidden bg-gradient-to-r from-brand-orange to-brand-red">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white/10 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/10 rounded-full filter blur-3xl animate-blob [animation-delay:2s]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white/5 rounded-full filter blur-3xl animate-blob [animation-delay:4s]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <div className="mb-8">
                <span className="inline-block bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-sm font-bold border border-white/30 mb-6">
                  🏡 Become a Host
                </span>
                <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                  Turn Your Property Into Gold
                </h2>
                <p className="text-xl opacity-90 leading-relaxed mb-8">
                  Join thousands of successful hosts who are earning premium income by listing their properties on India's fastest-growing vacation rental platform
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-rocket text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Lightning Fast Setup</h3>
                    <p className="opacity-90 text-sm">Get your property listed in under 10 minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-shield-alt text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">100% Secure</h3>
                    <p className="opacity-90 text-sm">Advanced payment protection & insurance</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-chart-line text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Smart Analytics</h3>
                    <p className="opacity-90 text-sm">Real-time insights to maximize earnings</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-headset text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">24/7 Support</h3>
                    <p className="opacity-90 text-sm">Dedicated host success manager</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-white text-foreground font-bold text-lg hover:bg-gray-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3">
                  <i className="fas fa-plus-circle"></i>
                  List Your Property
                </Button>
                <Button variant="outline" className="border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-foreground transition-all duration-300 flex items-center justify-center gap-3">
                  <i className="fas fa-play-circle"></i>
                  Watch Demo
                </Button>
              </div>
              
              <div className="mt-8 flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-black">₹50K+</div>
                  <div className="text-sm opacity-80">Avg Monthly Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black">15K+</div>
                  <div className="text-sm opacity-80">Active Hosts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black">98%</div>
                  <div className="text-sm opacity-80">Satisfaction Rate</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Card className="border-2 border-gradient-to-r from-yellow-400 to-orange-400 p-2">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=500"
                  alt="Successful Property Host"
                  className="w-full h-96 lg:h-[500px] object-cover object-top rounded-2xl"
                />
              </Card>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <i className="fas fa-crown text-2xl text-white"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-red-500 to-orange-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center">
                <div className="h-12 w-12 bg-gradient-to-r from-brand-orange to-brand-red rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  P
                </div>
                <span className="ml-3 text-2xl font-bold">Picnify</span>
              </div>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
                Picnify is your one-stop platform to discover and book day picnic spots, villas, farmhouses, and unique getaways, making your time with loved ones hassle-free and memorable
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: 'fab fa-facebook-f', href: 'https://facebook.com/picnify' },
                  { icon: 'fab fa-instagram', href: 'https://instagram.com/picnify' },
                  { icon: 'fab fa-twitter', href: 'https://twitter.com/picnify' },
                  { icon: 'fab fa-youtube', href: 'https://youtube.com/picnify' },
                  { icon: 'fab fa-linkedin-in', href: 'https://linkedin.com/company/picnify' },
                  { icon: 'fab fa-whatsapp', href: 'https://wa.me/+919876543210' },
                ].map((social, index) => (
                  <a key={index} href={social.href} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                    <i className={`${social.icon} text-xl group-hover:animate-bounce`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
              <ul className="space-y-4">
                {['About Picnify', 'How It Works', 'Safety Guidelines', 'Privacy Policy', 'Terms of Service'].map((link, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2">
                      <i className="fas fa-chevron-right text-xs text-red-400"></i>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Support & Help</h3>
              <ul className="space-y-4">
                {['24/7 Help Center', 'Contact Support', 'Booking Assistance', 'Host Resources', 'Trust & Safety'].map((link, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2">
                      <i className="fas fa-chevron-right text-xs text-red-400"></i>
                      {link}
                    </a>
                  </li>
                ))}
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

export default Index;
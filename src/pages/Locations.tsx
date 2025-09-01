import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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

const Locations: React.FC = () => {
  // Initialize scroll animations
  useScrollAnimation();
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const destinations = [
    {
      id: 1,
      name: 'Goa',
      state: 'Goa',
      region: 'West',
      category: 'beach',
      properties: 245,
      startingPrice: 1500,
      image: 'https://readdy.ai/api/search-image?query=beautiful%20goa%20beach%20destination%20with%20golden%20sand%20palm%20trees%20and%20turquoise%20ocean%20waves%20tropical%20paradise%20vacation%20spot%20with%20clear%20blue%20sky%20and%20peaceful%20atmosphere&width=400&height=300&seq=goa1&orientation=landscape',
      description: 'Experience pristine beaches, vibrant nightlife, and Portuguese heritage in India\'s premier beach destination.',
      featured: true,
      trending: true
    },
    {
      id: 2,
      name: 'Manali',
      state: 'Himachal Pradesh',
      region: 'North',
      category: 'hill',
      properties: 189,
      startingPrice: 1200,
      image: 'https://readdy.ai/api/search-image?query=scenic%20manali%20hill%20station%20with%20snow%20capped%20mountains%20pine%20forests%20and%20valley%20views%20beautiful%20himalayan%20landscape%20with%20clear%20mountain%20air%20and%20peaceful%20environment&width=400&height=300&seq=manali1&orientation=landscape',
      description: 'Discover snow-capped peaks, adventure sports, and serene valleys in this popular Himalayan hill station.',
      featured: true,
      trending: false
    },
    {
      id: 3,
      name: 'Jaipur',
      state: 'Rajasthan',
      region: 'North',
      category: 'heritage',
      properties: 156,
      startingPrice: 1800,
      image: 'https://readdy.ai/api/search-image?query=magnificent%20jaipur%20pink%20city%20with%20traditional%20rajasthani%20architecture%20royal%20palaces%20and%20historic%20forts%20beautiful%20heritage%20destination%20with%20ornate%20details%20and%20cultural%20richness&width=400&height=300&seq=jaipur1&orientation=landscape',
      description: 'Explore royal palaces, magnificent forts, and vibrant bazaars in the enchanting Pink City of India.',
      featured: false,
      trending: true
    },
    {
      id: 4,
      name: 'Kerala Backwaters',
      state: 'Kerala',
      region: 'South',
      category: 'nature',
      properties: 198,
      startingPrice: 2200,
      image: 'https://readdy.ai/api/search-image?query=serene%20kerala%20backwaters%20with%20traditional%20houseboat%20floating%20on%20calm%20green%20waters%20surrounded%20by%20coconut%20palm%20trees%20and%20lush%20tropical%20vegetation%20peaceful%20nature%20destination&width=400&height=300&seq=kerala1&orientation=landscape',
      description: 'Cruise through tranquil backwaters, stay in houseboats, and experience God\'s Own Country.',
      featured: true,
      trending: false
    },
    {
      id: 5,
      name: 'Rishikesh',
      state: 'Uttarakhand',
      region: 'North',
      category: 'spiritual',
      properties: 134,
      startingPrice: 1000,
      image: 'https://readdy.ai/api/search-image?query=spiritual%20rishikesh%20with%20ganges%20river%20flowing%20through%20mountains%20ancient%20temples%20and%20yoga%20ashrams%20peaceful%20spiritual%20destination%20with%20sacred%20atmosphere%20and%20natural%20beauty&width=400&height=300&seq=rishikesh1&orientation=landscape',
      description: 'Find spiritual peace, practice yoga, and enjoy adventure sports in the Yoga Capital of the World.',
      featured: false,
      trending: true
    },
    {
      id: 6,
      name: 'Shimla',
      state: 'Himachal Pradesh',
      region: 'North',
      category: 'hill',
      properties: 167,
      startingPrice: 1400,
      image: 'https://readdy.ai/api/search-image?query=charming%20shimla%20hill%20station%20with%20colonial%20architecture%20surrounded%20by%20dense%20green%20forests%20and%20mountain%20peaks%20beautiful%20himalayan%20destination%20with%20pleasant%20weather&width=400&height=300&seq=shimla1&orientation=landscape',
      description: 'Experience colonial charm, toy train rides, and pleasant weather in the Queen of Hills.',
      featured: false,
      trending: false
    },
    {
      id: 7,
      name: 'Udaipur',
      state: 'Rajasthan',
      region: 'North',
      category: 'heritage',
      properties: 123,
      startingPrice: 2500,
      image: 'https://readdy.ai/api/search-image?query=romantic%20udaipur%20city%20of%20lakes%20with%20beautiful%20palace%20architecture%20reflecting%20in%20calm%20lake%20waters%20surrounded%20by%20hills%20magnificent%20heritage%20destination%20with%20royal%20grandeur&width=400&height=300&seq=udaipur1&orientation=landscape',
      description: 'Discover the City of Lakes with stunning palaces, romantic boat rides, and royal heritage.',
      featured: true,
      trending: false
    },
    {
      id: 8,
      name: 'Darjeeling',
      state: 'West Bengal',
      region: 'East',
      category: 'hill',
      properties: 145,
      startingPrice: 1300,
      image: 'https://readdy.ai/api/search-image?query=picturesque%20darjeeling%20hill%20station%20with%20tea%20plantations%20covering%20rolling%20hills%20and%20himalayan%20mountain%20views%20beautiful%20green%20landscape%20with%20peaceful%20atmosphere%20and%20colonial%20charm&width=400&height=300&seq=darjeeling1&orientation=landscape',
      description: 'Enjoy tea gardens, mountain railways, and breathtaking views of Kanchenjunga peak.',
      featured: false,
      trending: true
    },
    {
      id: 9,
      name: 'Andaman Islands',
      state: 'Andaman & Nicobar',
      region: 'South',
      category: 'beach',
      properties: 89,
      startingPrice: 3500,
      image: 'https://readdy.ai/api/search-image?query=pristine%20andaman%20islands%20with%20crystal%20clear%20turquoise%20water%20white%20sand%20beaches%20and%20tropical%20palm%20trees%20untouched%20paradise%20destination%20with%20coral%20reefs%20and%20marine%20life&width=400&height=300&seq=andaman1&orientation=landscape',
      description: 'Explore pristine beaches, coral reefs, and crystal-clear waters in this tropical paradise.',
      featured: true,
      trending: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All Destinations', icon: 'fas fa-globe-asia' },
    { id: 'hill', name: 'Hill Stations', icon: 'fas fa-mountain' },
    { id: 'beach', name: 'Beach Destinations', icon: 'fas fa-umbrella-beach' },
    { id: 'heritage', name: 'Heritage Cities', icon: 'fas fa-landmark' },
    { id: 'spiritual', name: 'Spiritual Places', icon: 'fas fa-om' },
    { id: 'nature', name: 'Nature & Wildlife', icon: 'fas fa-leaf' }
  ];

  const regions = ['North', 'South', 'East', 'West'];
  const states = ['Goa', 'Himachal Pradesh', 'Rajasthan', 'Kerala', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar'];

  const filteredDestinations = destinations.filter(destination => {
    const matchesCategory = activeCategory === 'all' || destination.category === activeCategory;
    const matchesRegion = !selectedRegion || destination.region === selectedRegion;
    const matchesState = !selectedState || destination.state === selectedState;
    const matchesSearch = !searchLocation || destination.name.toLowerCase().includes(searchLocation.toLowerCase()) || destination.state.toLowerCase().includes(searchLocation.toLowerCase());
    return matchesCategory && matchesRegion && matchesState && matchesSearch;
  });

  const featuredDestinations = destinations.filter(dest => dest.featured);
  const trendingDestinations = destinations.filter(dest => dest.trending);

  return (
    <div className="min-h-screen bg-background font-poppins">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 to-orange-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20luxury%20travel%20destination%20background%20with%20soft%20gradient%20abstract%20shapes%20and%20warm%20tones%20perfect%20for%20hero%20section%20elegant%20minimalist%20design%20with%20subtle%20patterns%20and%20gentle%20lighting%20effects&width=1440&height=600&seq=hero1&orientation=landscape')`,
          backgroundBlendMode: 'overlay',
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/40"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 font-poppins mb-6 text-shadow">
              Explore Amazing <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Destinations</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Discover incredible locations across India for your perfect vacation rental experience
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-3xl p-8 shadow-xl max-w-5xl mx-auto border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Search Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-search text-red-500 text-lg"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="City, state or region..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-gray-800 placeholder-gray-500 border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Region</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-compass text-orange-500 text-lg"></i>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </div>
                  <button
                    onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                    className="w-full pl-12 pr-12 py-4 text-left text-gray-800 border-2 border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 text-sm font-medium cursor-pointer"
                  >
                    {selectedRegion || 'All Regions'}
                  </button>
                  {showRegionDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                      <button
                        onClick={() => {
                          setSelectedRegion('');
                          setShowRegionDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        All Regions
                      </button>
                      {regions.map((region) => (
                        <button
                          key={region}
                          onClick={() => {
                            setSelectedRegion(region);
                            setShowRegionDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer text-sm"
                        >
                          {region} India
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-gray-700 font-semibold text-sm uppercase tracking-wide">State</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-map text-blue-500 text-lg"></i>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </div>
                  <button
                    onClick={() => setShowStateDropdown(!showStateDropdown)}
                    className="w-full pl-12 pr-12 py-4 text-left text-gray-800 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-sm font-medium cursor-pointer"
                  >
                    {selectedState || 'All States'}
                  </button>
                  {showStateDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedState('');
                          setShowStateDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        All States
                      </button>
                      {states.map((state) => (
                        <button
                          key={state}
                          onClick={() => {
                            setSelectedState(state);
                            setShowStateDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer text-sm"
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button className="bg-red-600 text-white px-8 py-4 rounded-xl hover:bg-red-700 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3">
                <i className="fas fa-search text-xl"></i>
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button ${
                  activeCategory === category.id
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className={`${category.icon} text-lg`}></i>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 bg-gray-50 fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-poppins mb-4">Featured Destinations</h2>
            <p className="text-xl text-gray-600">Handpicked locations for unforgettable experiences</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDestinations.slice(0, 6).map((destination, index) => (
              <div key={destination.id} className="group cursor-pointer fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="gradient-border hover-lift">
                  <div className="gradient-border-inner overflow-hidden">
                    <div className="relative overflow-hidden">
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          <i className="fas fa-star mr-1"></i>
                          Featured
                        </span>
                      </div>
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-64 object-cover object-top transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors duration-300">{destination.name}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
                            <span className="font-medium">{destination.state}</span>
                          </div>
                        </div>
                        {destination.trending && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">
                            <i className="fas fa-fire mr-1"></i>
                            Trending
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">{destination.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <i className="fas fa-home text-blue-500"></i>
                            <span>{destination.properties} properties</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">From ₹{destination.startingPrice.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">per night</div>
                        </div>
                      </div>
                      <a href="/properties" className="block">
                        <button className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold shadow-lg hover:shadow-xl transform hover:scale-105">
                          View Properties
                          <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="py-16 bg-white fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 font-poppins mb-4">Trending Now</h2>
              <p className="text-xl text-gray-600">Popular destinations this season</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200 cursor-pointer">
                <i className="fas fa-chevron-left text-gray-600"></i>
              </button>
              <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200 cursor-pointer">
                <i className="fas fa-chevron-right text-gray-600"></i>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingDestinations.map((destination) => (
              <div key={destination.id} className="group cursor-pointer">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 border border-gray-100 hover-lift">
                  <div className="relative overflow-hidden">
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                        <i className="fas fa-fire mr-1"></i>
                        Hot
                      </span>
                    </div>
                    <img
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-48 object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors duration-300">{destination.name}</h3>
                    <div className="flex items-center text-gray-600 mb-3">
                      <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
                      <span className="text-sm font-medium">{destination.state}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <i className="fas fa-home text-blue-500 mr-1"></i>
                        {destination.properties} properties
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">₹{destination.startingPrice.toLocaleString()}+</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Destinations Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 font-poppins mb-4">All Destinations</h2>
            <p className="text-xl text-gray-600">
              {filteredDestinations.length} amazing locations waiting for you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDestinations.map((destination) => (
              <div key={destination.id} className="group cursor-pointer">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 border border-gray-100 hover-lift">
                  <div className="relative overflow-hidden">
                    {destination.featured && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          <i className="fas fa-star mr-1"></i>
                          Featured
                        </span>
                      </div>
                    )}
                    {destination.trending && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                          <i className="fas fa-fire mr-1"></i>
                          Trending
                        </span>
                      </div>
                    )}
                    <img
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-64 object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-4 left-4 right-4 transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <button className="w-full bg-white text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors duration-200 !rounded-button cursor-pointer whitespace-nowrap">
                        Explore Now
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors duration-300">{destination.name}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
                          <span className="font-medium">{destination.state}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                            {destination.region} India
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{destination.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <i className="fas fa-home text-blue-500"></i>
                          <span>{destination.properties} properties</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">From ₹{destination.startingPrice.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">per night</div>
                      </div>
                    </div>
                    <a href="/properties" className="block">
                      <button className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl hover:from-red-700 hover:to-orange-600 transition-all duration-300 cursor-pointer whitespace-nowrap !rounded-button font-bold shadow-lg hover:shadow-xl transform hover:scale-105">
                        View Properties
                        <i className="fas fa-arrow-right ml-2"></i>
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
};

export default Locations;
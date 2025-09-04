import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bannerService, HomepageBanner } from "@/lib/bannerService";
import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  overlay?: React.ReactNode;
}

const HeroBanner = ({ overlay }: HeroBannerProps) => {
  const [banner, setBanner] = useState<HomepageBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroBanner = async () => {
      try {
        const banners = await bannerService.getBannersByPosition('hero');
        if (banners.length > 0) {
          setBanner(banners[0]);
        }
      } catch (error) {
        console.error('Error fetching hero banner:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroBanner();
  }, []);

  if (loading) {
    return (
      <section className="relative bg-gradient-to-br from-primary/20 to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded-lg mx-auto mb-6 max-w-md"></div>
            <div className="h-6 bg-muted rounded-lg mx-auto mb-8 max-w-lg"></div>
            <div className="h-10 bg-muted rounded-lg mx-auto max-w-32"></div>
          </div>
        </div>
      </section>
    );
  }

  // If no banner is configured, show default content
  if (!banner) {
    return (
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-float"
          style={{ backgroundImage: "url('/src/assets/hero-background.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full animate-blob"></div>
          <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-r from-blue-500/30 to-blue-400/30 rounded-full animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/40 to-blue-500/40 rounded-full animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10 max-w-5xl">
          {overlay ? (
            overlay
          ) : (
            <>
              {/* Enhanced Title */}
              <div className="mb-8 animate-fade-in">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-none">
                  <span className="bg-gradient-to-r from-white via-yellow-100 to-orange-200 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
                    Discover Perfect Getaways Near You
                  </span>
                </h1>
                <div className="w-32 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full shadow-lg animate-scale-in"></div>
              </div>

              {/* Enhanced Subtitle */}
              <div className="mb-12 animate-fade-in animation-delay-500">
                <p className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium">
                  <span className="drop-shadow-lg">
                    From Day Picnic to weekend retreats, find unique properties and experiences across India
                  </span>
                </p>
              </div>

              {/* Enhanced CTA Button */}
              <div className="animate-fade-in animation-delay-1000">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-xl px-12 py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-orange-500/50 transform hover:scale-110 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm"
                >
                  <Link to="/properties" className="flex items-center gap-3">
                    Start Exploring
                    <i className="fas fa-arrow-right text-lg animate-bounce"></i>
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      {banner.background_image && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-float"
            style={{ backgroundImage: `url(${banner.background_image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
        </>
      )}
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full animate-blob"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-r from-blue-500/30 to-blue-400/30 rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/40 to-blue-500/40 rounded-full animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10 max-w-5xl">
        {overlay ? (
          overlay
        ) : (
          <>
            {/* Enhanced Title with Multiple Effects */}
            <div className="mb-8 animate-fade-in">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-none">
                <span className="bg-gradient-to-r from-white via-yellow-100 to-orange-200 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
                  {banner.title}
                </span>
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full shadow-lg animate-scale-in"></div>
            </div>

            {/* Enhanced Subtitle */}
            {banner.subtitle && (
              <div className="mb-12 animate-fade-in animation-delay-500">
                <p className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium">
                  <span className="drop-shadow-lg">
                    {banner.subtitle}
                  </span>
                </p>
              </div>
            )}

            {/* Enhanced CTA Button */}
            {banner.cta_text && banner.cta_link && (
              <div className="animate-fade-in animation-delay-1000">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-xl px-12 py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-orange-500/50 transform hover:scale-110 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm"
                >
                  <Link to={banner.cta_link} className="flex items-center gap-3">
                    {banner.cta_text}
                    <i className="fas fa-arrow-right text-lg animate-bounce"></i>
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
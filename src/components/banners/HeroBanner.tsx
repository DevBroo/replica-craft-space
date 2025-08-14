import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bannerService, HomepageBanner } from "@/lib/bannerService";
import { Button } from "@/components/ui/button";

const HeroBanner = () => {
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
      <section className="relative bg-gradient-to-br from-primary/20 to-primary/5 py-20">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: "url('/src/assets/hero-background.jpg')" }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Discover Perfect Getaways Near You
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            From day picnics to weekend retreats, find unique properties and experiences across India
          </p>
          <Button asChild size="lg" className="text-lg">
            <Link to="/properties">Start Exploring</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-br from-primary/20 to-primary/5 py-20">
      {banner.background_image && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${banner.background_image})` }}
        />
      )}
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          {banner.title}
        </h1>
        {banner.subtitle && (
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {banner.subtitle}
          </p>
        )}
        {banner.cta_text && banner.cta_link && (
          <Button asChild size="lg" className="text-lg">
            <Link to={banner.cta_link}>{banner.cta_text}</Link>
          </Button>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;
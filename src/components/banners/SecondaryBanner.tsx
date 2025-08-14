import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bannerService, HomepageBanner } from "@/lib/bannerService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SecondaryBanner = () => {
  const [banner, setBanner] = useState<HomepageBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecondaryBanner = async () => {
      try {
        const banners = await bannerService.getBannersByPosition('secondary');
        if (banners.length > 0) {
          setBanner(banners[0]);
        }
      } catch (error) {
        console.error('Error fetching secondary banner:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecondaryBanner();
  }, []);

  if (loading || !banner) {
    return null;
  }

  return (
    <section className="py-16 bg-secondary/5">
      <div className="container mx-auto px-4">
        <Card className="overflow-hidden bg-gradient-to-r from-secondary/20 to-accent/20 border-none">
          {banner.background_image && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
              style={{ backgroundImage: `url(${banner.background_image})` }}
            />
          )}
          <CardContent className="relative z-10 p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
                {banner.subtitle}
              </p>
            )}
            {banner.cta_text && banner.cta_link && (
              <Button asChild size="lg" variant="secondary">
                <Link to={banner.cta_link}>{banner.cta_text}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SecondaryBanner;
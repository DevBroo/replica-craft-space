import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bannerService, HomepageBanner } from "@/lib/bannerService";
import { Button } from "@/components/ui/button";

const FooterBanner = () => {
  const [banner, setBanner] = useState<HomepageBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFooterBanner = async () => {
      try {
        const banners = await bannerService.getBannersByPosition('footer');
        if (banners.length > 0) {
          setBanner(banners[0]);
        }
      } catch (error) {
        console.error('Error fetching footer banner:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterBanner();
  }, []);

  if (loading || !banner) {
    return null;
  }

  return (
    <section className="py-12 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="text-lg text-muted-foreground mb-6">
              {banner.subtitle}
            </p>
          )}
          {banner.cta_text && banner.cta_link && (
            <Button asChild size="lg" variant="outline">
              <Link to={banner.cta_link}>{banner.cta_text}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FooterBanner;
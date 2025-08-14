-- Fix malformed CTA links in homepage_banners table
UPDATE homepage_banners 
SET cta_link = '/properties' 
WHERE cta_link = ' properties' OR cta_link = 'properties';

-- Update other malformed links to proper format
UPDATE homepage_banners 
SET cta_link = '/properties' 
WHERE cta_link NOT LIKE '/%' AND cta_link NOT LIKE 'http%' AND cta_link IS NOT NULL;
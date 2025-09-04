
-- Add 4 properties for owner venteskraft@gmail.com (id: 6ceca7f2-9014-470d-a4ac-3cf81cfd771b)

-- 1) Villa Sunrise (villa)
INSERT INTO public.properties (
  owner_id, title, property_type, address, location, status, images, description,
  amenities, pricing, bedrooms, bathrooms, minimum_stay, check_in_time, check_out_time, max_guests
) VALUES (
  '6ceca7f2-9014-470d-a4ac-3cf81cfd771b',
  'Villa Sunrise',
  'villa',
  '123 Beach Lane, Candolim, North Goa, 403515',
  '{"city":"North Goa","state":"Goa","region":"West India"}'::jsonb,
  'approved',
  ARRAY[
    'https://images.unsplash.com/photo-1505691723518-36a5ac3b2d95?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop'
  ]::text[],
  'A bright sea-facing villa with private pool and modern interiors.',
  ARRAY['pool','parking','wifi','air-conditioning','kitchen']::text[],
  '{"currency":"INR","daily_rate":9500,"weekend_rate":11000,"cleaning_fee":800}'::jsonb,
  4,
  3,
  2,
  '15:00',
  '11:00',
  8
);

-- 2) Seaside Retreat (resort)
INSERT INTO public.properties (
  owner_id, title, property_type, address, location, status, images, description,
  amenities, pricing, bedrooms, bathrooms, minimum_stay, check_in_time, check_out_time, max_guests
) VALUES (
  '6ceca7f2-9014-470d-a4ac-3cf81cfd771b',
  'Seaside Retreat',
  'resort',
  '45 ECR Road, Injambakkam, Chennai, Tamil Nadu, 600115',
  '{"city":"Chennai","state":"Tamil Nadu","region":"South India"}'::jsonb,
  'approved',
  ARRAY[
    'https://images.unsplash.com/photo-1501117716987-c8e2aeea0f0a?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?q=80&w=1200&auto=format&fit=crop'
  ]::text[],
  'Beachfront resort with spacious rooms, spa, and all-day dining.',
  ARRAY['spa','gym','restaurant','wifi','beach-access']::text[],
  '{"currency":"INR","daily_rate":7000,"weekend_rate":8500,"taxes":{"gst":0.12}}'::jsonb,
  20,
  20,
  1,
  '14:00',
  '12:00',
  60
);

-- 3) Greenfield Farmstay (farmhouse)
INSERT INTO public.properties (
  owner_id, title, property_type, address, location, status, images, description,
  amenities, pricing, bedrooms, bathrooms, minimum_stay, check_in_time, check_out_time, max_guests
) VALUES (
  '6ceca7f2-9014-470d-a4ac-3cf81cfd771b',
  'Greenfield Farmstay',
  'farmhouse',
  'Plot 27, Mulshi Road, Pune, Maharashtra, 412108',
  '{"city":"Pune","state":"Maharashtra","region":"West India"}'::jsonb,
  'approved',
  ARRAY[
    'https://images.unsplash.com/photo-1505692794403-34d4982fd1c0?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1200&auto=format&fit=crop'
  ]::text[],
  'Rustic farmhouse amidst greenery, ideal for family getaways.',
  ARRAY['garden','bbq','pet-friendly','parking','board-games']::text[],
  '{"currency":"INR","daily_rate":5500,"weekend_rate":6500,"weekly_discount":0.10}'::jsonb,
  3,
  3,
  1,
  '13:00',
  '10:00',
  10
);

-- 4) City Day Picnic Park (day-picnic)
INSERT INTO public.properties (
  owner_id, title, property_type, address, location, status, images, description,
  amenities, pricing, day_picnic_capacity, day_picnic_duration_category, meal_plans, max_guests
) VALUES (
  '6ceca7f2-9014-470d-a4ac-3cf81cfd771b',
  'City Day Picnic Park',
  'day-picnic',
  'NH 44, Devanahalli, Bengaluru, Karnataka, 562110',
  '{"city":"Bengaluru","state":"Karnataka","region":"South India"}'::jsonb,
  'approved',
  ARRAY[
    'https://images.unsplash.com/photo-1493815793585-6f3f9a5a0dfc?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=1200&auto=format&fit=crop'
  ]::text[],
  'Open-air lawns and picnic zones perfect for groups and corporate outings.',
  ARRAY['lawn','kids-play-area','outdoor-games','parking','snack-counters']::text[],
  '{"currency":"INR","per_person_rate":999,"group_package":{"20pax":17999,"50pax":39999}}'::jsonb,
  120,
  'full-day',
  ARRAY['breakfast','lunch','hi-tea']::text[],
  120
);

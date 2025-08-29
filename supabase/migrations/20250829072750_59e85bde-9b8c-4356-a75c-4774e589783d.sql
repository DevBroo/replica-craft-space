-- Fix booking_action_logs foreign key relationships
ALTER TABLE public.booking_action_logs 
ADD CONSTRAINT booking_action_logs_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.booking_action_logs 
ADD CONSTRAINT booking_action_logs_actor_id_fkey 
FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
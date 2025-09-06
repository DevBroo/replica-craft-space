-- Add missing foreign key constraints for messages table
-- These were referenced in the RLS policies but not actually created

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_property_id_fkey 
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_booking_id_fkey 
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
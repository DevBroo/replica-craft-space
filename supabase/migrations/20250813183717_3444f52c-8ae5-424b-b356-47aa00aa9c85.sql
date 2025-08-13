-- Add foreign key constraint to establish relationship between user_saved_properties and properties
ALTER TABLE user_saved_properties 
ADD CONSTRAINT fk_user_saved_properties_property_id 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
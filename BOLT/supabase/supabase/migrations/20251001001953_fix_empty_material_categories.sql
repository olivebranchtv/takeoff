/*
  # Fix Empty Material Categories
  
  Updates all materials with empty categories to have proper category names
  based on their descriptions. This enables proper pricing lookups.
  
  Categories assigned:
  - Devices: Dimmers, switches, receptacles, outlets
  - wire: Wire, THHN, cable conductors
  - Connectors: Wire nuts, connectors, fittings
  - Plates: Cover plates
  - Boxes: Junction boxes, device boxes
  - Other materials as appropriate
*/

-- Update Dimmers
UPDATE material_pricing 
SET category = 'Devices'
WHERE category = '' AND description ILIKE '%dimmer%';

-- Update Switches
UPDATE material_pricing 
SET category = 'Devices'
WHERE category = '' AND description ILIKE '%switch%';

-- Update Receptacles/Outlets
UPDATE material_pricing 
SET category = 'Devices'
WHERE category = '' AND (description ILIKE '%receptacle%' OR description ILIKE '%duplex%' OR description ILIKE '%outlet%');

-- Update Wire/Cable
UPDATE material_pricing 
SET category = 'wire'
WHERE category = '' AND (description ILIKE '%wire%' OR description ILIKE '%thhn%' OR description ILIKE '%cable%' OR description ILIKE '%conductor%');

-- Update Wire Connectors
UPDATE material_pricing 
SET category = 'Connectors'
WHERE category = '' AND (description ILIKE '%wire nut%' OR description ILIKE '%wirenut%' OR description ILIKE '%connector%');

-- Update Plates
UPDATE material_pricing 
SET category = 'Plates'
WHERE category = '' AND (description ILIKE '%plate%' OR description ILIKE '%cover%');

-- Update Boxes
UPDATE material_pricing 
SET category = 'Boxes'
WHERE category = '' AND description ILIKE '%box%';

-- Update EMT/Conduit fittings
UPDATE material_pricing 
SET category = 'Fittings'
WHERE category = '' AND (description ILIKE '%emt%' OR description ILIKE '%coupling%' OR description ILIKE '%fitting%' OR description ILIKE '%connector%');

-- Update Breakers
UPDATE material_pricing 
SET category = 'Breakers'
WHERE category = '' AND (description ILIKE '%breaker%' OR description ILIKE '%circuit breaker%');

-- Update Panels
UPDATE material_pricing 
SET category = 'Panels'
WHERE category = '' AND (description ILIKE '%panel%' OR description ILIKE '%loadcenter%');

-- Update Lighting
UPDATE material_pricing 
SET category = 'Lighting'
WHERE category = '' AND (description ILIKE '%light%' OR description ILIKE '%fixture%' OR description ILIKE '%lamp%' OR description ILIKE '%led%');

-- Remaining items with empty category - set to 'Electrical Materials'
UPDATE material_pricing 
SET category = 'Electrical Materials'
WHERE category = '';
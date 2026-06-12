-- Relabel any existing assets with category 'Liquid' or 'savings' to 'Other'
UPDATE "Asset" 
SET category = 'Other' 
WHERE category IN ('Liquid', 'savings', 'other', 'property', 'vehicle', 'business', 'investments', 'jewelry');

-- The above correctly capitalizes 'other' to 'Other', 'property' to 'Property', etc.
-- Let's do it individually to be clean.
UPDATE "Asset" SET category = 'Other' WHERE category IN ('Liquid', 'savings', 'other', 'jewelry', 'business');
UPDATE "Asset" SET category = 'Property' WHERE category = 'property';
UPDATE "Asset" SET category = 'Investment' WHERE category IN ('investments', 'Investment');
UPDATE "Asset" SET category = 'Vehicle' WHERE category = 'vehicle';
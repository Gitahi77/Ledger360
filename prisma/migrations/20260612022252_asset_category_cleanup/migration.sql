  UPDATE "Asset" SET category = 'Property'   WHERE lower(category) = 'property';
  UPDATE "Asset" SET category = 'Vehicle'    WHERE lower(category) = 'vehicle';
  UPDATE "Asset" SET category = 'Investment' WHERE lower(category) IN ('investment','investments','business');
  UPDATE "Asset" SET category = 'Other'      WHERE category NOT IN ('Property','Vehicle','Investment','Other');
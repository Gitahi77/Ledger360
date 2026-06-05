-- Update any existing Account rows with type 'mobile' to 'mobile_money'
UPDATE "Account" SET "type" = 'mobile_money' WHERE "type" = 'mobile';
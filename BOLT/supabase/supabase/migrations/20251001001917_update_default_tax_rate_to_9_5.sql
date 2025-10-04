/*
  # Update Default Tax Rate to 9.5%
  
  Updates the default material tax rate from 8.5% to 9.5% in the company_settings table.
*/

ALTER TABLE company_settings 
ALTER COLUMN material_tax_rate SET DEFAULT 0.095;
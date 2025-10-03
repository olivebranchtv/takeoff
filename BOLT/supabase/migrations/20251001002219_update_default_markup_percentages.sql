/*
  # Update Default Markup Percentages
  
  Updates default overhead and profit percentages to 10% each,
  and material tax rate to 9.5% in the company_settings table.
*/

ALTER TABLE company_settings 
ALTER COLUMN default_overhead_percentage SET DEFAULT 10.00;

ALTER TABLE company_settings 
ALTER COLUMN default_profit_percentage SET DEFAULT 10.00;

ALTER TABLE company_settings 
ALTER COLUMN material_tax_rate SET DEFAULT 0.095;
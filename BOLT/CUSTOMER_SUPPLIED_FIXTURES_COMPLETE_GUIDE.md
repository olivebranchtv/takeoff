# Customer-Supplied Fixtures - Complete Implementation Guide

## Overview
This system allows you to properly bid customer-supplied lighting fixtures (like AutoZone fixtures) where the customer provides the fixtures but you install them and provide labor.

## How It Works

### 1. **No Assembly Assignment for Generic Light Tags (A-Z)**
- Tags like "A", "B", "C", "D" (for "Lights A", "Lights B", etc.) do NOT have assemblies assigned
- This prevents the system from pricing them using assembly materials
- Instead, they ONLY use the pricing database

**Code Location:** `src/utils/tagAssemblyMapping.ts`
```typescript
// Letter codes A-Z for lights (customer-supplied) - NO ASSEMBLY
if (code.match(/^[A-Z]$/) || code.match(/^[A-Z]\d+$/)) return undefined;
```

### 2. **Pricing Database Entries**
All generic light tags (A-Z) are in the Supabase pricing database with:
- **Material Cost:** $0.00 (customer supplies)
- **Labor Hours:** 1.5 hours (your installation time)
- **Vendor:** "Customer Supplied"

**Database Table:** `material_pricing`

Example entries:
```
"Lights A" → $0 material, 1.5hrs labor
"Lights B" → $0 material, 1.5hrs labor
"Lights D" → $0 material, 1.5hrs labor
```

### 3. **Lighting Package Cost Field**
In the **Pricing & Bidding** panel, there's a new field:

**"Lighting Package Cost $ (customer-supplied fixtures)"**

Use this to add the actual cost of the fixture package that the customer is providing.

**Example - AutoZone Project:**
- Customer supplies 20 fixtures worth $3,000
- Enter $3,000 in "Lighting Package Cost"
- System adds this to material costs in the bid

## Complete Workflow Example

### Scenario: AutoZone - 20 "D" Fixtures

1. **Tag the fixtures** on the drawing as "D" (or "Lights D")
   - System recognizes this as a lighting fixture
   - NO assembly assigned (no materials calculated from assemblies)

2. **System Calculates Labor Only**
   - Looks up "Lights D" in pricing database
   - Finds: $0 material cost, 1.5 labor hours
   - Calculates: 20 fixtures × 1.5hrs = **30 labor hours**

3. **Open Pricing & Bidding Panel**
   - Material from tags: **$0** (no material assigned)
   - Labor: **30 hrs × $30/hr = $900**
   - Equipment Rental: $0 (if none)

4. **Add Lighting Package Cost**
   - In "Lighting Package Cost" field, enter: **$3,000**
   - This is the cost of the fixtures AutoZone is providing

5. **Final Bid Calculation**
```
Materials (from tags):           $0
Material Tax (9.5%):             $0
Shipping:                        $0
----------------------------------
Material Subtotal:               $0

Labor (30 hrs @ $30/hr):      $900

Equipment Rental:                $0

Lighting Package (Customer):  $3,000
----------------------------------
SUBTOTAL:                     $3,900

Overhead (10%):                $390
----------------------------------
Subtotal with Overhead:      $4,290

Profit (10%):                  $429
----------------------------------
TOTAL BID PRICE:             $4,719
```

## Key Benefits

### ✅ **No Double Counting**
- Generic light tags (A-Z) have NO assemblies
- Only labor hours are calculated from the database
- Material cost = $0

### ✅ **Proper Customer Material Tracking**
- "Lighting Package Cost" field shows the actual fixture cost
- This amount is included in overhead and profit calculations
- Appears clearly on bid proposals

### ✅ **Accurate Labor Bidding**
- Each fixture gets proper labor hours (1.5hrs default)
- Labor is calculated and billed correctly
- You get paid for installation even though fixtures are free

## Where to Find Things

### Pricing Database (Supabase)
- Go to Settings → Export Database
- Find entries for "Lights A" through "Lights Z"
- Each should have: $0 material cost, 1.5 labor hours

### Pricing & Bidding Panel
- Open any project with fixtures
- Click "💰 Pricing & Bidding" button
- See "Lighting Package Cost $" field below "Equipment Rental $"
- Enter the cost of customer-supplied fixtures here

### Tag Manager
- Tags A-Z are in the master tag database
- Category: "Lights"
- Color: Orange (#F97316)
- NO assemblies assigned (system handles this automatically)

## Troubleshooting

### Problem: Fixtures showing $0 labor in bid
**Solution:**
1. Check that tag code is A-Z (single letter)
2. Export pricing database and verify "Lights A" (etc.) has labor_hours = 1.5
3. If missing, re-import database or add manually

### Problem: Fixtures getting assembly materials
**Solution:**
1. Check that tag code matches exactly: "A", "B", "C", etc. (single letter)
2. Verify in code: `src/utils/tagAssemblyMapping.ts` lines 15-18
3. Should return `undefined` for A-Z codes (no assembly)

### Problem: Lighting package cost not showing in bid
**Solution:**
1. Make sure you entered a value > 0 in the "Lighting Package Cost" field
2. The cost only appears if > $0
3. Check that costs panel is refreshed (recalculates automatically)

### Problem: Wrong labor hours per fixture
**Solution:**
1. Export pricing database
2. Find the specific fixture entry (e.g., "Lights D")
3. Update the `labor_hours` column to your actual time (1.5 hrs is standard)
4. Re-import database

## Customization

### Change Default Labor Hours
1. Open Settings → Export Database
2. Find "Lights A" through "Lights Z"
3. Change `labor_hours` column (e.g., 2.0 for complex fixtures)
4. Import database back

### Add New Customer Fixture Types
1. Export database
2. Add new row:
   - Item Code: "CUST-FIXTURE-NAME"
   - Category: "Lighting Fixtures"
   - Description: "Fixture Name"
   - Unit: "EA"
   - Material Cost: 0.00
   - Labor Hours: 1.5 (or your time)
   - Vendor: "Customer Supplied"
3. Import database

### Different Labor Rates Per Fixture
You can have different labor hours for different fixtures:
- "Lights A" = 1.0 hrs (simple)
- "Lights B" = 1.5 hrs (standard)
- "Lights C" = 2.5 hrs (complex high bay)

Just update the database entries accordingly.

## Summary

✅ **Customer supplies fixtures** → Material cost = $0
✅ **You install them** → Labor hours calculated (1.5 hrs default)
✅ **Track actual fixture cost** → "Lighting Package Cost" field
✅ **Proper bid calculations** → All costs included with overhead & profit

**Result:** Accurate bids that pay you for your labor while properly accounting for customer-supplied materials!

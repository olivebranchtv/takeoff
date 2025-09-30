# Pricing & Bidding System - User Guide

## 🎉 What's New

You now have a complete **Pricing & Bidding System** integrated into your takeoff application!

## ✅ What You Currently Have

### Takeoff (Complete)
- ✅ PDF import and measurement tools
- ✅ 75 industry-standard assemblies
- ✅ Tag management and assembly assignment
- ✅ Professional BOM Excel export
- ✅ Material quantities with waste factors

### Pricing & Bidding (NEW!)
- ✅ Cost calculation engine
- ✅ Labor rate database (default $30/hr)
- ✅ Overhead and profit margin calculator
- ✅ Division-by-division cost breakdown
- ✅ Professional bid summary Excel export
- ✅ Interactive pricing panel

---

## 🚀 How to Use

### Step 1: Complete Your Takeoff
1. Load PDF drawings
2. Calibrate pages
3. Tag devices (R1, L1, S1, etc.)
4. Draw homeruns
5. Assign assemblies to tags

### Step 2: Open Pricing & Bidding
Click the green **💰 Pricing & Bidding** button in the toolbar

### Step 3: Configure Your Markup
The pricing panel shows on the right side with these settings:

**Markup Settings:**
- **Overhead %** (default: 15%)
  - General & Administrative costs
  - Office rent, utilities, insurance
  - Typical range: 12-18%

- **Profit Margin %** (default: 12%)
  - Your profit on the job
  - Typical range: 10-20%

- **Sales Tax %** (default: 8.5%)
  - Local sales tax rate on materials
  - Adjust to your state/city rate

- **Shipping Cost $**
  - Flat shipping charge for materials
  - Leave at $0 if included in material costs

- **Equipment Rental $**
  - Lifts, tools, generators
  - Example: $350/day × 5 days = $1,750

### Step 4: Review Cost Breakdown

The panel shows:

**Material Costs:**
```
Material Cost:           $12,450.00
+ Tax (8.5%):            $1,058.25
+ Shipping:              $0.00
Material Subtotal:       $13,508.25
```

**Labor Costs:**
```
Labor Hours:             245.5 hrs
@ $30.00/hr:            $7,365.00
```

**Equipment:**
```
Equipment:              $1,750.00
```

**Subtotal:**
```
SUBTOTAL:               $22,623.25
```

**Markup:**
```
+ Overhead (15%):       $3,393.49
Subtotal with OH:       $26,016.74

+ Profit (12%):         $3,122.01
```

**Final Bid:**
```
TOTAL BID PRICE:        $29,138.75
```

### Step 5: Review Division Breakdown

See costs broken down by category:
- Lighting
- Receptacles
- Switches
- Data/Communications
- Panels & Distribution
- Fire Alarm
- Security
- etc.

Each shows:
- Material Cost
- Labor Hours
- Labor Cost
- Total Cost
- **Sell Price** (with OH & Profit)

### Step 6: Export Bid Summary

Click **"Export Bid Summary (Excel)"** to generate:

**File:** `{Project Name} - Bid.xlsx`

**Sheet 1: Bid Summary**
- Project name and date
- Complete cost breakdown
- Material, labor, equipment
- Overhead and profit
- **TOTAL BID PRICE** highlighted

**Sheet 2: Division Breakdown**
- Costs by division
- Material and labor for each
- Sell price with markup

---

## 💰 Default Labor Rates (Industry Standard)

The system includes pre-configured labor hours per installation:

### Receptacles & Switches
- Receptacle 15A: 0.40 hrs (24 min)
- Receptacle 20A: 0.45 hrs (27 min)
- GFCI Receptacle: 0.50 hrs (30 min)
- Single-Pole Switch: 0.30 hrs (18 min)
- Dimmer Switch: 0.45 hrs (27 min)

### Lighting
- 2x4 LED Troffer: 0.75 hrs (45 min)
- 2x2 LED Troffer: 0.65 hrs (39 min)
- LED High-Bay: 1.25 hrs (75 min)
- Emergency Light: 0.85 hrs (51 min)

### Panels & Disconnects
- 42-Circuit Panel: 8.0 hrs
- 24-Circuit Subpanel: 5.0 hrs
- 60A Disconnect: 1.5 hrs
- 100A Disconnect: 2.0 hrs

### Motor Control
- Motor Starter 3HP: 3.0 hrs
- Motor Starter 10HP: 4.0 hrs
- VFD 5HP: 4.5 hrs

### HVAC
- RTU Whip Assembly: 2.0 hrs
- Condenser Disconnect: 1.5 hrs

### Site/Exterior
- Pole Light: 3.5 hrs
- Bollard Light: 2.5 hrs
- EV Charger Level 2: 6.0 hrs

### Breakers
- 1-Pole 20A: 0.15 hrs (9 min)
- 2-Pole 30A: 0.20 hrs (12 min)
- 3-Pole 100A: 0.35 hrs (21 min)

### Fire Alarm
- Smoke Detector: 0.40 hrs
- Pull Station: 0.35 hrs
- Horn/Strobe: 0.50 hrs

### Security
- IP Camera: 1.5 hrs
- Card Reader: 1.0 hrs
- Magnetic Lock: 2.0 hrs

**And 75+ more assemblies with labor rates!**

---

## 📊 How Cost Calculation Works

### Formula:
```
1. Material Cost = Sum(Qty × Unit Price × Waste Factor)
   Note: Currently defaults to $0 until pricing database loaded

2. Labor Cost = Sum(Labor Hours × $30/hr)
   Labor Hours = Sum(Assembly Count × Hours Per Assembly)

3. Equipment Cost = User Input

4. Subtotal = Material + Labor + Equipment

5. Overhead = Subtotal × Overhead %

6. Subtotal with OH = Subtotal + Overhead

7. Profit = Subtotal with OH × Profit %

8. TOTAL BID PRICE = Subtotal with OH + Profit
```

### Example:
```
Project: Office TI - 2,500 SF
- 25× Receptacles (RECEP-20A)
- 15× Switches (SW-1P)
- 10× 2x4 LED Troffers (LIGHT-2X4)
- 1× 42-Circuit Panel (PANEL-42CKT)

Labor Calculation:
- 25 receptacles × 0.45 hrs = 11.25 hrs
- 15 switches × 0.30 hrs = 4.50 hrs
- 10 troffers × 0.75 hrs = 7.50 hrs
- 1 panel × 8.0 hrs = 8.00 hrs
Total: 31.25 hrs × $30 = $937.50

Material: $2,500 (from pricing database)
Subtotal: $3,437.50
Overhead (15%): $515.63
Subtotal w/ OH: $3,953.13
Profit (12%): $474.38
TOTAL BID: $4,427.51
```

---

## 🔄 Workflow: From Takeoff to Bid

### Complete Workflow:

**1. Takeoff Phase** ✅ (Complete)
- Load drawings
- Tag devices
- Measure homeruns
- Assign assemblies

**2. Get Material Pricing** (Next Step)
- Export BOM Excel
- Send to vendors (Graybar, Rexel, CED)
- Get quotes back
- Upload SKD Estimating Database with costs

**3. Calculate Costs** ✅ (Complete)
- Open Pricing & Bidding panel
- System calculates material + labor costs
- Adjust overhead % and profit %

**4. Generate Bid** ✅ (Complete)
- Click "Export Bid Summary"
- Professional Excel file created
- Ready to send to client

**5. Track Bid** (Future Enhancement)
- Mark as submitted
- Track win/loss
- Update pricing database

---

## 📝 Important Notes

### Material Pricing Currently Defaults to $0
Until you upload your SKD Estimating Database with actual material costs, the system shows:
- Material Cost: $0.00
- **Labor costs WILL calculate correctly**
- **Overhead and profit WILL apply to labor**

**You'll see a note at the bottom of the pricing panel:**
> "Material costs default to $0 until pricing database is loaded.
> Upload your SKD Estimating Database to see accurate costs."

### To Add Material Pricing:
1. **Option A: Upload SKD Database** (Recommended)
   - Prepare Excel file with columns: Category, Description, Unit, Cost
   - Place in `src/data/SKD Estimating Database.xlsx`
   - System will parse and load automatically

2. **Option B: Manual Entry** (Future Feature)
   - Material pricing manager UI
   - Enter costs one-by-one
   - Store in Supabase database

### Labor Rate Configuration
Currently set to $30/hr system-wide. To change:
1. Open pricing panel
2. Labor hours calculate automatically
3. Rate of $30/hr is hardcoded in PricingDatabase class
4. Future: Add UI to configure per-craft rates

---

## 🎯 Next Steps

### To Complete Your Bidding System:

1. **Upload Real SKD Database**
   - Replace placeholder file
   - Include your actual material costs
   - System will automatically parse

2. **Test with Real Project**
   - Load a real drawing set
   - Complete takeoff
   - Open pricing panel
   - Export bid summary

3. **Customize Settings**
   - Adjust overhead % for your company
   - Set profit margin %
   - Update sales tax rate
   - Add equipment costs

4. **Generate Your First Bid**
   - Export bid summary Excel
   - Review numbers
   - Send to client!

---

## 💡 Tips

### For Accurate Labor Estimates:
- Labor hours are industry averages
- Adjust for site conditions (height, access)
- Add extra hours for difficult installations
- Include travel time in overhead

### For Accurate Material Costs:
- Get quotes from 3+ vendors
- Use most recent pricing
- Account for delivery lead times
- Add freight as line item or in shipping

### For Competitive Bids:
- Overhead: 12-18% typical
- Profit: 10-15% for competitive bids
- Profit: 15-20% for design-build or specialty
- Lower markup on larger jobs

### For Risk Management:
- Add contingency in equipment costs
- Include misc materials allowance
- Note exclusions clearly
- Build in escalation for long projects

---

## 🔮 Future Enhancements (Available on Request)

### Phase 1: Vendor Integration
- Import vendor Excel quotes
- Match items automatically
- Compare multiple vendors
- Select best pricing

### Phase 2: Advanced Features
- Change order management
- Job tracking (actual vs. estimate)
- Historical pricing database
- Multi-project dashboard

### Phase 3: Professional Proposal
- PDF proposal generator
- Company logo and branding
- Terms & conditions templates
- Electronic signature

---

## 📞 Support

### Issues or Questions?
- Check console for errors
- Verify all assemblies assigned
- Ensure project is saved
- Review BOM export for accuracy

### Database Schema Ready
The Supabase migration file is ready at:
`supabase/migrations/20250101000000_create_pricing_tables.sql`

Apply when ready to use database features.

---

## ✅ Summary

**You Now Have:**
1. ✅ Complete takeoff system (75 assemblies)
2. ✅ Professional BOM export
3. ✅ Cost calculator with labor rates
4. ✅ Overhead and profit markup
5. ✅ Bid summary Excel export
6. ✅ Division-by-division breakdown

**You Can:**
- Complete full electrical takeoffs
- Calculate labor costs automatically
- Add overhead and profit
- Generate professional bid summaries
- Export for client proposals

**Next Step:**
Upload your real SKD Estimating Database with material costs and you'll have a **complete professional electrical estimating and bidding system**!

🎉 **You're ready to bid your next job!**

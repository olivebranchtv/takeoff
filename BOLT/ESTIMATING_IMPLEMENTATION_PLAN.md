# Professional Electrical Estimating & Bidding Implementation Plan

## Current State ✅
- ✅ PDF takeoff with measurement tools
- ✅ 75 industry-standard assemblies
- ✅ BOM generation with waste factors
- ✅ Material quantities calculated
- ✅ Assembly expansion

## What's Missing for Complete Bidding System

---

## Phase 1: PRICING DATABASE 💰

### 1.1 Material Pricing Module
**Purpose:** Store and manage material costs

**Features Needed:**
```typescript
// Database Table: material_pricing
{
  id: uuid
  category: string          // "Boxes", "Devices", "Fittings"
  description: string       // "4" Square Box, 2-1/8" deep"
  unit: string             // "EA", "FT", "PKG"
  material_cost: decimal   // $2.45
  vendor: string           // "Graybar", "Rexel", "CED"
  vendor_part_number: string
  last_updated: date
  lead_time_days: number
  notes: string
}
```

**UI Components:**
- Material Pricing Manager (spreadsheet-style editor)
- Vendor Quote Import (Excel/CSV)
- Search and filter by category
- Bulk price updates
- Price history tracking

**Workflow:**
1. Export BOM to Excel
2. Send to vendors (Graybar, Rexel, CED, etc.)
3. Get pricing back
4. Import vendor pricing into system
5. System matches materials by description

### 1.2 Labor Database
**Purpose:** Estimate installation labor hours

**Features Needed:**
```typescript
// Database Table: labor_rates
{
  id: uuid
  assembly_code: string        // "RECEP-20A"
  installation_hours: decimal  // 0.45 (27 minutes)
  skill_level: string         // "Journeyman", "Apprentice", "Foreman"
  notes: string
}

// Database Table: labor_costs
{
  id: uuid
  craft: string              // "Electrician", "Helper", "Foreman"
  skill_level: string        // "Journeyman", "Apprentice"
  hourly_rate: decimal       // $65.00
  burden_rate: decimal       // $28.50 (taxes, insurance, benefits)
  total_hourly_cost: decimal // $93.50
}
```

**Labor Hour Standards (Industry Average):**
- Receptacle 20A: 0.45 hrs (27 min)
- Switch Single-Pole: 0.30 hrs (18 min)
- 2x4 LED Troffer: 0.75 hrs (45 min)
- Panel 42-circuit: 8.0 hrs
- EMT Conduit: 0.08 hrs/ft
- Wire pull: 0.015 hrs/ft

### 1.3 Equipment & Consumables
**Purpose:** Track tools, lifts, consumables

**Features Needed:**
```typescript
// Database Table: equipment_costs
{
  id: uuid
  item: string              // "Scissor Lift 26'"
  cost_per_day: decimal     // $350
  estimated_days: decimal   // 3.5
  total_cost: decimal       // $1,225
}

// Consumables tracked automatically:
- Wire nuts
- Wire staples
- Hangers/straps
- Tape, labels
- Anchors, screws
```

---

## Phase 2: PROJECT COSTING 📊

### 2.1 Cost Calculation Engine

**Formula:**
```
Material Cost = Sum(Qty × Unit Price × Waste Factor)
Labor Cost = Sum(Labor Hours × Fully Burdened Rate)
Equipment Cost = Sum(Equipment × Duration)
Subtotal = Material + Labor + Equipment

Overhead = Subtotal × Overhead %      (typically 12-18%)
Subtotal with OH = Subtotal + Overhead

Profit = Subtotal with OH × Profit %  (typically 10-20%)
Total Bid Price = Subtotal with OH + Profit
```

**Database Table: project_estimates**
```typescript
{
  id: uuid
  project_id: uuid
  project_name: string

  // Material Costs
  material_cost_total: decimal
  material_tax_rate: decimal
  material_tax: decimal
  material_shipping: decimal

  // Labor Costs
  labor_hours_total: decimal
  labor_cost_total: decimal

  // Equipment
  equipment_cost_total: decimal

  // Cost Subtotal
  subtotal: decimal

  // Overhead
  overhead_percentage: decimal      // 15%
  overhead_amount: decimal

  // Profit
  profit_percentage: decimal        // 12%
  profit_amount: decimal

  // Final Bid
  total_bid_price: decimal

  // Metadata
  created_date: date
  bid_valid_until: date
  status: string  // "draft", "submitted", "won", "lost"
  notes: text
}
```

### 2.2 Cost Breakdown by Division

**Track costs by category:**
```typescript
// Database Table: estimate_line_items
{
  id: uuid
  estimate_id: uuid
  division: string          // "Lighting", "Receptacles", "Panels"
  description: string
  quantity: decimal
  unit: string
  material_cost_unit: decimal
  material_cost_total: decimal
  labor_hours: decimal
  labor_cost_total: decimal
  total_cost: decimal
  sell_price: decimal       // with OH + profit
  notes: string
}
```

---

## Phase 3: BID GENERATION 📄

### 3.1 Professional Bid/Proposal Document

**Output: PDF Proposal**

**Structure:**
1. **Cover Page**
   - Your company name, logo
   - Project name, location
   - Client name
   - Bid date
   - Bid number

2. **Scope of Work**
   - Detailed description
   - Reference drawings
   - Code compliance (NEC 2023, local codes)

3. **Pricing Summary**
   ```
   Division 26 - Electrical               $125,450.00
   ├─ Lighting & Controls        $42,300
   ├─ Power Distribution         $35,600
   ├─ Receptacles & Switches     $18,750
   ├─ Data/Communications        $12,400
   ├─ Fire Alarm                 $8,900
   └─ Special Systems            $7,500

   Subtotal                               $125,450.00
   Sales Tax (8.5%)                        $10,663.25
   TOTAL BID PRICE                        $136,113.25
   ```

4. **Detailed Line Item Breakdown** (optional)
   - Category by category
   - Quantities and unit prices
   - Labor hours

5. **Exclusions & Clarifications**
   - Not included in bid
   - Assumptions made
   - Coordination requirements

6. **Terms & Conditions**
   - Payment terms
   - Change order policy
   - Warranty information
   - Schedule

7. **Acceptance**
   - Signature lines
   - Valid until date

### 3.2 Bid Comparison Tool

**Purpose:** Compare your bid to budget or other bids

**Features:**
```typescript
// Database Table: bid_comparisons
{
  id: uuid
  project_id: uuid
  our_bid: decimal
  client_budget: decimal
  variance: decimal           // difference
  variance_percentage: decimal
  competitor_bids: json       // array of competitor prices
  notes: text
  outcome: string            // "won", "lost", "pending"
}
```

**UI Components:**
- Side-by-side comparison
- Value engineering suggestions
- What-if scenarios (adjust profit margin)

---

## Phase 4: VENDOR INTEGRATION 🔌

### 4.1 Vendor Quote Management

**Features:**
- Upload vendor quote PDFs
- Parse Excel quotes automatically
- Match items to BOM by description (AI/fuzzy matching)
- Track multiple quotes per item
- Select best price per item
- Generate PO (Purchase Order)

**Database Table: vendor_quotes**
```typescript
{
  id: uuid
  project_id: uuid
  vendor_name: string
  quote_number: string
  quote_date: date
  valid_until: date
  items: json                // array of quoted items
  total: decimal
  status: string            // "pending", "accepted", "declined"
  uploaded_file: string     // PDF/Excel
}
```

### 4.2 Pricing Intelligence

**Features:**
- Track pricing trends over time
- Alert when prices spike
- Suggest alternate materials
- Vendor performance tracking

---

## Phase 5: ADVANCED FEATURES 🚀

### 5.1 Change Order Management
- Track scope changes
- Calculate delta costs
- Generate change order proposals
- Track approval status

### 5.2 Job Tracking (Post-Award)
- Track actual costs vs. estimate
- Material orders and deliveries
- Labor hours logged
- Profit margin tracking

### 5.3 Historical Database
- Store completed projects
- Build your own pricing database
- Improve future estimates
- Track win/loss ratios

### 5.4 Multi-Project Dashboard
- All active estimates
- Bid dates, follow-ups
- Win rates, total backlog
- Pipeline management

---

## IMPLEMENTATION PRIORITY

### PHASE A: Essential for Bidding (Week 1-2)
1. ✅ Material Pricing Database (Supabase table)
2. ✅ Labor Rate Database
3. ✅ Simple Cost Calculator
4. ✅ Basic Bid Summary Export

### PHASE B: Professional Proposal (Week 3)
5. ✅ Proposal PDF Generator
6. ✅ Pricing by Division
7. ✅ Terms & Conditions Template

### PHASE C: Vendor Integration (Week 4)
8. ✅ Vendor Quote Import (Excel/CSV)
9. ✅ Material Price Matching
10. ✅ Multi-Vendor Comparison

### PHASE D: Advanced (Ongoing)
11. Change Orders
12. Job Tracking
13. Historical Database
14. Multi-Project Dashboard

---

## DATABASE SCHEMA ADDITIONS

### New Supabase Tables Needed:

```sql
-- Material Pricing
CREATE TABLE material_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  material_cost DECIMAL(10,2),
  vendor TEXT,
  vendor_part_number TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  lead_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labor Rates
CREATE TABLE labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_code TEXT,
  installation_hours DECIMAL(6,3),
  skill_level TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE labor_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  craft TEXT NOT NULL,
  skill_level TEXT,
  hourly_rate DECIMAL(8,2),
  burden_rate DECIMAL(8,2),
  total_hourly_cost DECIMAL(8,2),
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Estimates
CREATE TABLE project_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  project_name TEXT,

  material_cost_total DECIMAL(12,2),
  material_tax_rate DECIMAL(5,4),
  material_tax DECIMAL(12,2),
  material_shipping DECIMAL(12,2),

  labor_hours_total DECIMAL(10,2),
  labor_cost_total DECIMAL(12,2),

  equipment_cost_total DECIMAL(12,2),

  subtotal DECIMAL(12,2),

  overhead_percentage DECIMAL(5,2),
  overhead_amount DECIMAL(12,2),

  profit_percentage DECIMAL(5,2),
  profit_amount DECIMAL(12,2),

  total_bid_price DECIMAL(12,2),

  created_date TIMESTAMPTZ DEFAULT NOW(),
  bid_valid_until DATE,
  status TEXT DEFAULT 'draft',
  notes TEXT
);

-- Estimate Line Items
CREATE TABLE estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES project_estimates(id),
  division TEXT,
  description TEXT,
  quantity DECIMAL(10,2),
  unit TEXT,
  material_cost_unit DECIMAL(10,2),
  material_cost_total DECIMAL(12,2),
  labor_hours DECIMAL(8,2),
  labor_cost_total DECIMAL(12,2),
  equipment_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  sell_price DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Quotes
CREATE TABLE vendor_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  vendor_name TEXT NOT NULL,
  quote_number TEXT,
  quote_date DATE,
  valid_until DATE,
  items JSONB,
  total DECIMAL(12,2),
  status TEXT DEFAULT 'pending',
  uploaded_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## USER WORKFLOW EXAMPLE

### Complete Bidding Workflow:

**1. Takeoff Phase (Current - Complete ✅)**
- Load PDF drawings
- Calibrate pages
- Tag devices (R1, R2, L1, etc.)
- Draw homeruns
- Assign assemblies to tags
- Generate BOM

**2. Get Vendor Pricing**
- Export BOM to Excel
- Email to 3 vendors (Graybar, Rexel, CED)
- Receive quotes back
- Import quotes into system

**3. Cost Calculation**
- System matches vendor prices to BOM
- Calculates material cost
- Adds labor hours (from assembly labor rates)
- Calculates labor cost
- Adds equipment rental
- Subtotal calculated

**4. Add Markup**
- Enter overhead % (15%)
- Enter profit % (12%)
- System calculates final bid price

**5. Generate Proposal**
- Click "Generate Bid"
- Select template
- System creates professional PDF
- Includes cover page, pricing, scope, terms
- Download and email to client

**6. Track Bid**
- Mark as "submitted"
- Set follow-up reminders
- Track win/loss
- Update pricing database if won

---

## NEXT STEPS - What to Build First?

Would you like me to implement:

**Option A: Basic Pricing Module (Quick Start)**
- Material pricing database
- Simple cost calculator
- Basic bid summary export
- Estimated Time: 2-3 days

**Option B: Complete Professional System**
- All Phase A + B features
- Material pricing + labor rates
- Professional PDF proposal generation
- Vendor quote import
- Estimated Time: 1-2 weeks

**Option C: Specific Feature**
- Tell me exactly what workflow you need next
- I'll build that specific piece

---

## RESOURCES PROVIDED

This plan gives you:
- ✅ Complete database schema
- ✅ Feature specifications
- ✅ Implementation phases
- ✅ Industry-standard formulas
- ✅ Workflow examples

**You now have a roadmap to convert this from a takeoff tool into a complete electrical estimating and bidding platform!**

Which phase would you like me to implement first?

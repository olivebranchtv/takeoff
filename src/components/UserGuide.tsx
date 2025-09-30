/**
 * User Guide Modal - Complete A to Z Guide
 */

import React from 'react';

interface UserGuideProps {
  onClose: () => void;
}

export function UserGuide({ onClose }: UserGuideProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '95%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5)'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '2px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0d3b66',
            color: '#fff',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            📘 Electrical Takeoff & Bidding - User Guide
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '32px',
              cursor: 'pointer',
              lineHeight: '24px',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '30px',
            fontSize: '15px',
            lineHeight: '1.7'
          }}
        >
          <Section title="🚀 Quick Start - 3 Easy Steps">
            <Step num={1} title="Do Your Takeoff (5-15 minutes)">
              <ul>
                <li>Click <strong>"Load PDF"</strong> and select electrical drawings</li>
                <li><strong>Calibrate</strong> each page (click two points of known distance)</li>
                <li><strong>Add project tags</strong> from master database (R1, L1, S1, etc.)</li>
                <li><strong>Tag devices</strong> on drawings using Count tool</li>
                <li><strong>Draw homeruns</strong> using Segment/Polyline tools</li>
                <li><strong>Assign assemblies</strong> to each tag</li>
              </ul>
            </Step>

            <Step num={2} title="Calculate Costs (2 minutes)">
              <ul>
                <li>Click <strong>"💰 Pricing & Bidding"</strong> (green button)</li>
                <li>Click <strong>"📁 Upload Pricing Excel"</strong> to load material costs</li>
                <li>Adjust <strong>Overhead %</strong> (default: 10%)</li>
                <li>Adjust <strong>Profit %</strong> (default: 10%)</li>
                <li>Add <strong>Equipment Rental</strong> costs if needed</li>
              </ul>
            </Step>

            <Step num={3} title="Generate Bid (1 minute)">
              <ul>
                <li>Review cost summary</li>
                <li>Click <strong>"Export Bid Summary (Excel)"</strong></li>
                <li>Send to client!</li>
              </ul>
            </Step>
          </Section>

          <Section title="📐 Step-by-Step: Complete Takeoff Process">
            <SubSection title="A. Load and Prepare Drawings">
              <ol>
                <li><strong>Click "Load PDF"</strong> in top toolbar</li>
                <li>Select your electrical drawings (can be multi-page)</li>
                <li>PDF loads and displays first page</li>
                <li>Use page navigation arrows to switch between pages</li>
              </ol>
            </SubSection>

            <SubSection title="B. Calibrate Each Page">
              <ol>
                <li>Find a known dimension on drawing (e.g., 10'-0" wall)</li>
                <li>Click <strong>Calibrate button</strong> in toolbar</li>
                <li>Click first point of known dimension</li>
                <li>Click second point</li>
                <li>Enter actual distance in feet (e.g., 10)</li>
                <li>System calculates pixels per foot</li>
                <li><strong>Important:</strong> Repeat for EACH page (scales may vary)</li>
              </ol>
            </SubSection>

            <SubSection title="C. Add Project Tags">
              <ol>
                <li>Click <strong>"Add from DB"</strong> button in Project Tags bar</li>
                <li>Browse master tag database (75+ pre-configured tags)</li>
                <li>Click tags to add to project (R1-R50, L1-L50, S1-S50, etc.)</li>
                <li>Close picker when done</li>
                <li>Tags appear in Project Tags bar for quick access</li>
              </ol>
              <div style={{background: '#e3f2fd', padding: '12px', borderRadius: '6px', marginTop: '10px', fontSize: '14px'}}>
                <strong>💡 Tag Naming Convention:</strong>
                <ul style={{marginBottom: 0, marginTop: '8px'}}>
                  <li><strong>R1-R50:</strong> Receptacles</li>
                  <li><strong>L1-L50:</strong> Lighting fixtures</li>
                  <li><strong>S1-S50:</strong> Switches</li>
                  <li><strong>P1-P10:</strong> Panels</li>
                  <li><strong>D1-D50:</strong> Data/communications</li>
                </ul>
              </div>
            </SubSection>

            <SubSection title="D. Tag Devices on Drawings">
              <ol>
                <li>Select a tag from Project Tags bar (e.g., R1)</li>
                <li>Tool automatically switches to <strong>Count</strong> mode</li>
                <li>Click on each device location on the drawing</li>
                <li>Symbol appears with tag code</li>
                <li>Switch to next tag and repeat</li>
                <li>Continue until all devices are tagged</li>
              </ol>
              <div style={{background: '#fff3cd', padding: '12px', borderRadius: '6px', marginTop: '10px', fontSize: '14px'}}>
                <strong>⚠️ Tips:</strong>
                <ul style={{marginBottom: 0, marginTop: '8px'}}>
                  <li>Use consistent naming (R1 for all standard receptacles)</li>
                  <li>Different tags for different types (R1 = 20A, R2 = GFCI)</li>
                  <li>Click accurately on device locations</li>
                  <li>Can delete symbols by selecting and pressing Delete</li>
                </ul>
              </div>
            </SubSection>

            <SubSection title="E. Draw Homerun Conduits">
              <ol>
                <li>Click <strong>Segment tool</strong> for straight runs</li>
                <li>Or click <strong>Polyline tool</strong> for multi-segment runs</li>
                <li>Click to start homerun at device/panel</li>
                <li>Click intermediate points (corners, turns)</li>
                <li>Double-click to finish</li>
                <li>Measurement dialog appears</li>
                <li>Enter conduit size, wire specs, conductor count</li>
                <li>System auto-calculates quantities</li>
              </ol>
            </SubSection>

            <SubSection title="F. Assign Assemblies to Tags">
              <ol>
                <li>Click <strong>"Assemblies"</strong> button in toolbar</li>
                <li>Assembly Manager modal opens</li>
                <li>Find your tag in the list (e.g., R1)</li>
                <li>Click <strong>"Choose Assembly"</strong></li>
                <li>Browse 75+ pre-built assemblies</li>
                <li>Select appropriate assembly (e.g., "RECEP-20A")</li>
                <li>Assembly details show materials and quantities</li>
                <li>Click to assign</li>
                <li>Repeat for all tags</li>
              </ol>
              <div style={{background: '#d4edda', padding: '12px', borderRadius: '6px', marginTop: '10px', fontSize: '14px'}}>
                <strong>✅ Available Assemblies:</strong>
                <ul style={{marginBottom: 0, marginTop: '8px'}}>
                  <li>Receptacles (15A, 20A, GFCI, IG, Floor, USB, 208V, 240V)</li>
                  <li>Switches (1P, 3W, 4W, Dimmer, Occupancy, Timer)</li>
                  <li>Lighting (2x4/2x2 Troffers, High-Bays, Downlights)</li>
                  <li>Panels (42-ckt, 24-ckt, Disconnects)</li>
                  <li>Data/Comm (CAT6, CAT6A, Fiber)</li>
                  <li>And 60+ more!</li>
                </ul>
              </div>
            </SubSection>
          </Section>

          <Section title="📊 Export Bill of Materials">
            <SubSection title="G. Export Full BOM">
              <ol>
                <li>Click <strong>"Export Excel (Full BOM)"</strong></li>
                <li>Excel file downloads automatically</li>
                <li>Contains complete material list with quantities</li>
                <li>Includes waste factors (5-15% by material type)</li>
                <li>Organized by category</li>
                <li>Ready to send to vendors for quotes</li>
              </ol>
            </SubSection>

            <SubSection title="Export Lighting Fixtures">
              <ul>
                <li>Exports all lighting fixtures to Excel</li>
                <li>Includes linear fixtures, troffers, high-bays, downlights, emergency, exit signs</li>
                <li>Perfect for sending to lighting vendors for pricing quotes</li>
                <li>Organized by fixture type with quantities</li>
                <li>Helps get competitive pricing for lighting packages</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="💰 Pricing and Bidding">
            <SubSection title="H. Prepare Your Pricing Database">
              <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px'}}>
                <strong>Excel Format Required:</strong>
                <pre style={{background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '13px', marginTop: '8px'}}>
{`Category | Description           | Unit | Cost
---------|------------------------|------|------
Boxes    | 4" Square Box         | EA   | 2.45
Devices  | Receptacle 20A        | EA   | 3.75
Wire     | #12 THHN CU           | FT   | 0.35
Conduit  | EMT 1/2"              | FT   | 0.42`}
                </pre>
              </div>
              <ul>
                <li>Get vendor quotes (Graybar, Rexel, CED)</li>
                <li>Format in Excel with columns: Category, Description, Unit, Cost</li>
                <li>Save as .xlsx file</li>
              </ul>
            </SubSection>

            <SubSection title="I. Calculate Project Costs">
              <ol>
                <li>Click <strong>"💰 Pricing & Bidding"</strong> (green button)</li>
                <li>Pricing panel opens on right side</li>
                <li>Click <strong>"📁 Upload Pricing Excel"</strong></li>
                <li>Select your pricing file</li>
                <li>System loads all material costs automatically</li>
                <li>Status shows "✓ [Number] Material Prices Loaded"</li>
              </ol>
            </SubSection>

            <SubSection title="J. Configure Markup Settings">
              <ul>
                <li><strong>Overhead %:</strong> Default 10% (adjust for your company)</li>
                <li><strong>Profit Margin %:</strong> Default 10% (adjust per job)</li>
                <li><strong>Sales Tax %:</strong> Default 9.5% (your local rate)</li>
                <li><strong>Shipping Cost $:</strong> Flat freight charge</li>
                <li><strong>Equipment Rental $:</strong> Lifts, tools, generators</li>
              </ul>
            </SubSection>

            <SubSection title="K. Review Cost Breakdown">
              <div style={{background: '#f0f4f8', padding: '15px', borderRadius: '6px'}}>
                <strong>System automatically calculates:</strong>
                <ul style={{marginTop: '8px', marginBottom: 0}}>
                  <li><strong>Material Cost:</strong> Quantities × Unit Prices</li>
                  <li><strong>Material Tax:</strong> Material Cost × Tax %</li>
                  <li><strong>Labor Cost:</strong> Hours × $30/hr (industry-standard hours per assembly)</li>
                  <li><strong>Equipment:</strong> Your entered amount</li>
                  <li><strong>Subtotal:</strong> Sum of all above</li>
                  <li><strong>Overhead:</strong> Subtotal × Overhead %</li>
                  <li><strong>Profit:</strong> (Subtotal + Overhead) × Profit %</li>
                  <li><strong>TOTAL BID PRICE:</strong> Final amount</li>
                </ul>
              </div>
            </SubSection>

            <SubSection title="L. Generate Professional Bid">
              <ol>
                <li>Review all costs in pricing panel</li>
                <li>Make final adjustments to overhead/profit</li>
                <li>Click <strong>"Export Bid Summary (Excel)"</strong></li>
                <li>Excel file downloads with professional bid summary</li>
                <li>Includes two sheets:</li>
                <ul>
                  <li><strong>Sheet 1:</strong> Bid Summary with all cost breakdowns</li>
                  <li><strong>Sheet 2:</strong> Division Breakdown by category</li>
                </ul>
                <li>Review, add company logo/letterhead if desired</li>
                <li>Send to client!</li>
              </ol>
            </SubSection>
          </Section>

          <Section title="🛠️ Tools Reference">
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <ToolCard
                name="Count"
                desc="Tag individual devices (receptacles, switches, fixtures)"
                keys="Click on device locations"
              />
              <ToolCard
                name="Segment"
                desc="Draw straight conduit runs or homeruns"
                keys="Click start, click end"
              />
              <ToolCard
                name="Polyline"
                desc="Draw multi-segment conduit runs with turns"
                keys="Click points, double-click to finish"
              />
              <ToolCard
                name="Freeform"
                desc="Draw irregular areas or complex paths"
                keys="Click points, close to origin"
              />
              <ToolCard
                name="Pan"
                desc="Move around the drawing"
                keys="Drag to pan, scroll to zoom"
              />
              <ToolCard
                name="Select"
                desc="Select and modify existing objects"
                keys="Click to select, Delete to remove"
              />
            </div>
          </Section>

          <Section title="⚙️ Settings and Defaults">
            <SubSection title="Current System Defaults">
              <ul>
                <li><strong>Labor Rate:</strong> $30.00/hr</li>
                <li><strong>Overhead:</strong> 15%</li>
                <li><strong>Profit Margin:</strong> 10%</li>
                <li><strong>Sales Tax:</strong> 8.5%</li>
                <li><strong>Waste Factors:</strong> 2-15% by material type</li>
              </ul>
            </SubSection>

            <SubSection title="Waste Factors Applied in BOM">
              <ul>
                <li><strong>Wire & Cable:</strong> 10%</li>
                <li><strong>Conduit:</strong> 10%</li>
                <li><strong>Boxes:</strong> 5%</li>
                <li><strong>Devices:</strong> 5%</li>
                <li><strong>Fixtures:</strong> 2%</li>
                <li><strong>Fittings:</strong> 15%</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="💡 Tips for Success">
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <TipCard title="For Accurate Takeoffs">
                <ul style={{fontSize: '14px', marginBottom: 0}}>
                  <li>Calibrate every page carefully</li>
                  <li>Use consistent tag naming</li>
                  <li>Assign correct assemblies</li>
                  <li>Review BOM before exporting</li>
                </ul>
              </TipCard>
              <TipCard title="For Competitive Bids">
                <ul style={{fontSize: '14px', marginBottom: 0}}>
                  <li>Get quotes from 3+ vendors</li>
                  <li>Use realistic labor hours</li>
                  <li>Adjust overhead for job size</li>
                  <li>Consider site conditions</li>
                </ul>
              </TipCard>
              <TipCard title="For Better Efficiency">
                <ul style={{fontSize: '14px', marginBottom: 0}}>
                  <li>Save projects frequently</li>
                  <li>Use Project Tags bar</li>
                  <li>Export BOM to verify</li>
                  <li>Keep pricing updated</li>
                </ul>
              </TipCard>
              <TipCard title="For Professional Results">
                <ul style={{fontSize: '14px', marginBottom: 0}}>
                  <li>Document everything</li>
                  <li>Use detailed measurements</li>
                  <li>Review before submitting</li>
                  <li>Track win/loss ratios</li>
                </ul>
              </TipCard>
            </div>
          </Section>

          <Section title="❓ Frequently Asked Questions">
            <FAQ q="Material costs showing $0?" a="Upload your pricing Excel file by clicking '📁 Upload Pricing Excel' in the Pricing panel." />
            <FAQ q="How do I change labor rate?" a="Currently $30/hr default. Adjust by editing labor hours if needed. Custom rates coming soon." />
            <FAQ q="Can I edit assemblies?" a="Yes! Click Assemblies button to view/edit all 75 assemblies and their material breakdowns." />
            <FAQ q="Where is my project saved?" a="File > Download .skdproj saves to your downloads folder. File > Open Project loads saved projects." />
            <FAQ q="Can I use on multiple computers?" a="Yes! Save your .skdproj file and open it on any computer with this application." />
            <FAQ q="What if I make a mistake?" a="Use Select tool to click objects and press Delete. Or File > Open Project to reload last saved version." />
            <FAQ q="How accurate are labor hours?" a="Based on industry standards (NECA). Adjust for your crew's speed and site conditions." />
            <FAQ q="Can I customize assemblies?" a="Yes! In Assembly Manager, you can view and modify materials in any assembly." />
          </Section>

          <Section title="🎓 Example Project Walkthrough">
            <div style={{background: '#e8f5e9', padding: '20px', borderRadius: '8px'}}>
              <h4 style={{marginTop: 0}}>Office TI - 2,500 SF</h4>

              <strong>1. Takeoff (10 min):</strong>
              <ul>
                <li>Load floor plan PDF</li>
                <li>Calibrate: 10' = 120 pixels</li>
                <li>Add tags: R1-R25 (receptacles), S1-S15 (switches), L1-L10 (lights)</li>
                <li>Draw 12 homeruns back to panel</li>
                <li>Assign assemblies: RECEP-20A, SW-1P, LIGHT-2X4, PANEL-42CKT</li>
              </ul>

              <strong>2. BOM Generated:</strong>
              <ul>
                <li>25× Receptacles + boxes + wire + conduit</li>
                <li>15× Switches + boxes + wire</li>
                <li>10× LED Troffers + whips</li>
                <li>1× 42-Circuit Panel + breakers</li>
                <li>Total: 200+ line items auto-calculated</li>
              </ul>

              <strong>3. Costs Calculated:</strong>
              <ul>
                <li>Material: $2,850.00</li>
                <li>Labor: 31.5 hrs × $30 = $945.00</li>
                <li>Subtotal: $3,795.00</li>
                <li>Overhead (10%): $379.50</li>
                <li>Profit (10%): $417.45</li>
                <li><strong>TOTAL BID: $4,591.95</strong></li>
              </ul>

              <strong>4. Export & Submit:</strong>
              <ul>
                <li>Export bid summary Excel</li>
                <li>Review professional format</li>
                <li>Send to client</li>
                <li>Win job! 🎉</li>
              </ul>
            </div>
          </Section>

          <div style={{textAlign: 'center', padding: '30px 0 20px', borderTop: '2px solid #e0e0e0', marginTop: '30px'}}>
            <h3 style={{color: '#0d3b66', marginBottom: '15px'}}>You're Ready to Start Bidding!</h3>
            <p style={{fontSize: '16px', color: '#555', marginBottom: '20px'}}>
              Follow these steps from A to Z and you'll be generating professional bids in 20 minutes.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '12px 30px',
                background: '#2e7d32',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Got It - Let's Get Started!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '35px' }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#0d3b66',
        marginBottom: '15px',
        paddingBottom: '8px',
        borderBottom: '3px solid #0d3b66'
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px', marginLeft: '10px' }}>
      <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c5f7c', marginBottom: '10px' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#2e7d32',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          {num}
        </div>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function ToolCard({ name, desc, keys }: { name: string; desc: string; keys: string }) {
  return (
    <div style={{
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0'
    }}>
      <h5 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold', color: '#0d3b66' }}>
        {name}
      </h5>
      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>{desc}</p>
      <div style={{ fontSize: '13px', color: '#777', fontStyle: 'italic' }}>{keys}</div>
    </div>
  );
}

function TipCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff3cd',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #ffc107'
    }}>
      <h5 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#856404' }}>
        {title}
      </h5>
      {children}
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ marginBottom: '15px' }}>
      <strong style={{ color: '#0d3b66' }}>Q: {q}</strong>
      <p style={{ margin: '5px 0 0 20px', color: '#555' }}>A: {a}</p>
    </div>
  );
}

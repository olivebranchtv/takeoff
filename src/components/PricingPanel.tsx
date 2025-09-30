/**
 * Pricing and Bidding Panel
 * Calculate costs and generate bid proposals
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/state/store';
import { PricingDatabase, calculateProjectCosts, type ProjectCosts } from '@/utils/pricing';
import { loadMaterialPricingFromSupabase, saveMaterialPricingToSupabase, loadCompanySettings, saveCompanySettings, saveProjectEstimate, type MaterialPricing } from '@/utils/supabasePricing';
import { loadDemoPricing } from '@/utils/demoPricing';
import type { PageState } from '@/types';

interface PricingPanelProps {
  pages: PageState[];
  onClose: () => void;
}

export function PricingPanel({ pages, onClose }: PricingPanelProps) {
  const { tags, assemblies } = useStore();

  const [pricingDb] = useState(() => new PricingDatabase(30.0));
  const [overheadPct, setOverheadPct] = useState(15);
  const [profitPct, setProfitPct] = useState(12);
  const [taxRate, setTaxRate] = useState(8.5);
  const [shipping, setShipping] = useState(0);
  const [equipment, setEquipment] = useState(0);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [priceCount, setPriceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [costs, setCosts] = useState<ProjectCosts | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);

    const settings = await loadCompanySettings();
    if (settings) {
      setOverheadPct(settings.default_overhead_percentage);
      setProfitPct(settings.default_profit_percentage);
      setTaxRate(settings.material_tax_rate * 100);
    }

    const materials = await loadMaterialPricingFromSupabase();
    if (materials && materials.length > 0) {
      let loadedCount = 0;
      materials.forEach(m => {
        const key = `${m.category}::${m.description}`;
        // Convert to number explicitly (Postgres may return as string)
        const materialCost = typeof m.material_cost === 'string' ? parseFloat(m.material_cost) : (m.material_cost || 0);
        const laborHours = typeof m.labor_hours === 'string' ? parseFloat(m.labor_hours) : (m.labor_hours || 0);

        pricingDb.setMaterialPrice(key, {
          category: m.category,
          description: m.description,
          unit: m.unit,
          materialCost: isNaN(materialCost) ? 0 : materialCost,
          laborHours: isNaN(laborHours) ? 0 : laborHours,
          vendor: m.vendor,
          vendorPartNumber: m.vendor_part_number
        });

        if (materialCost > 0) loadedCount++;
      });
      setPricesLoaded(true);
      setPriceCount(materials.length);
      console.log(`✅ Loaded ${loadedCount} material prices with costs from Supabase (${pricingDb.getPriceCount()} total entries)`);

      // Show sample of wire and conduit prices loaded
      const wireKeys = pricingDb.getAllKeys().filter(k => k.startsWith('wire::')).slice(0, 3);
      const conduitKeys = pricingDb.getAllKeys().filter(k => k.startsWith('EMT CONDUIT::')).slice(0, 3);
      console.log('📦 Sample wire prices:', wireKeys);
      console.log('📦 Sample conduit prices:', conduitKeys);
    }

    setIsLoading(false);
  };

  const loadPricingFile = async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      let sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      const materials: Omit<MaterialPricing, 'id' | 'user_id' | 'created_at'>[] = [];
      let loaded = 0;

      for (const row of rows) {
        // SKD Database format: name, category, unit_cost, labor_unit_s..., supplier, description
        const category = String(row['category'] || row['Category'] || row['Division'] || row['Type'] || '').trim();
        const description = String(row['description'] || row['Description'] || row['name'] || row['Name'] || row['Item'] || row['Material'] || '').trim();
        const unit = String(row['unit'] || row['Unit'] || row['UOM'] || 'EA').trim();

        // SKD uses 'unit_cost' column
        const cost = parseFloat(row['unit_cost'] || row['unit cost'] || row['Unit Cost'] || row['Cost'] || row['cost'] || row['Price'] || '0');

        // SKD uses 'labor_unit_s...' column
        const laborHours = parseFloat(row['labor_unit_s'] || row['labor_unit_supply'] || row['labor_unit_supplier'] || row['Labor Hours'] || row['Labor Hrs'] || '0');

        // Skip header rows
        if (!description || description.toLowerCase().includes('description') || description.toLowerCase().includes('name')) {
          continue;
        }

        if (description && (cost > 0 || laborHours > 0)) {
          const key = `${category}::${description}`;
          pricingDb.setMaterialPrice(key, {
            category,
            description,
            unit,
            materialCost: cost,
            laborHours: laborHours > 0 ? laborHours : undefined,
            vendor: row['supplier'] || row['Supplier'] || row['Vendor'] || row['vendor'],
            vendorPartNumber: row['Part Number'] || row['Part #']
          });

          materials.push({
            category,
            description,
            unit,
            material_cost: cost,
            labor_hours: laborHours > 0 ? laborHours : undefined,
            vendor: row['supplier'] || row['Supplier'] || row['Vendor'] || row['vendor'],
            vendor_part_number: row['Part Number'] || row['Part #'],
            last_updated: new Date().toISOString()
          });

          loaded++;
        }
      }

      setPricesLoaded(true);
      setPriceCount(loaded);

      const saved = await saveMaterialPricingToSupabase(materials);
      if (saved) {
        alert(`Successfully loaded and saved ${loaded} material prices to database!`);
      } else {
        alert(`Loaded ${loaded} material prices (session only - not saved to database)`);
      }
    } catch (error) {
      console.error('Error loading pricing file:', error);
      alert('Failed to load pricing file. Please check the format.');
    }
  };

  const saveSettings = async () => {
    const saved = await saveCompanySettings({
      default_overhead_percentage: overheadPct,
      default_profit_percentage: profitPct,
      default_labor_rate: 30.0,
      material_tax_rate: taxRate / 100
    });

    if (saved) {
      alert('Settings saved successfully!');
    }
  };

  const saveBid = async () => {
    if (!costs) return;

    const projectName = useStore.getState().getProjectName() || 'Untitled Project';
    const estimateId = await saveProjectEstimate(
      projectName,
      {
        materialCostTotal: costs.materialCostTotal,
        materialTaxRate: taxRate / 100,
        materialTax: costs.materialTax,
        materialShipping: costs.materialShipping,
        laborHoursTotal: costs.laborHoursTotal,
        laborCostTotal: costs.laborCostTotal,
        equipmentCostTotal: costs.equipmentCostTotal,
        subtotal: costs.subtotal,
        overheadPercentage: overheadPct,
        overheadAmount: costs.overheadAmount,
        profitPercentage: profitPct,
        profitAmount: costs.profitAmount,
        totalBidPrice: costs.totalBidPrice
      },
      { pages, tags, assemblies }
    );

    if (estimateId) {
      alert('Bid saved to database successfully!');
    }
  };

  const handleLoadDemoPricing = () => {
    const loaded = loadDemoPricing(pricingDb);
    setPricesLoaded(true);
    setPriceCount(loaded);
    alert(`Loaded ${loaded} demo material prices!\n\nNote: This is sample data for demonstration purposes.\nNot saved to database.`);
  };

  // Calculate costs whenever inputs change
  useEffect(() => {
    try {
      const calculated = calculateProjectCosts(
        pages,
        tags,
        assemblies,
        pricingDb,
        {
          overheadPercentage: overheadPct,
          profitPercentage: profitPct,
          materialTaxRate: taxRate / 100,
          materialShipping: shipping,
          equipmentCost: equipment
        }
      );
      setCosts(calculated);
    } catch (error) {
      console.error('Error calculating costs:', error);
    }
  }, [pages, tags, assemblies, pricingDb, overheadPct, profitPct, taxRate, shipping, equipment]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const exportBidSummary = async () => {
    if (!costs) return;

    try {
      const XLSX = await import('xlsx');

      // Cover sheet data
      const coverData = [
        ['ELECTRICAL BID SUMMARY'],
        [''],
        ['Project Name:', useStore.getState().getProjectName() || 'Untitled Project'],
        ['Date:', new Date().toLocaleDateString()],
        [''],
        ['COST BREAKDOWN'],
        [''],
        ['Material Costs', formatCurrency(costs.materialCostTotal)],
        ['Material Tax (' + taxRate + '%)', formatCurrency(costs.materialTax)],
        ['Shipping', formatCurrency(costs.materialShipping)],
        ['Material Subtotal', formatCurrency(costs.materialSubtotal)],
        [''],
        ['Labor Hours', costs.laborHoursTotal.toFixed(2)],
        ['Labor Rate', formatCurrency(costs.laborRate) + '/hr'],
        ['Labor Cost', formatCurrency(costs.laborCostTotal)],
        [''],
        ['Equipment', formatCurrency(costs.equipmentCostTotal)],
        [''],
        ['SUBTOTAL', formatCurrency(costs.subtotal)],
        [''],
        ['Overhead (' + overheadPct + '%)', formatCurrency(costs.overheadAmount)],
        ['Subtotal with Overhead', formatCurrency(costs.subtotalWithOverhead)],
        [''],
        ['Profit Margin (' + profitPct + '%)', formatCurrency(costs.profitAmount)],
        [''],
        ['TOTAL BID PRICE', formatCurrency(costs.totalBidPrice)]
      ];

      const wb = XLSX.utils.book_new();
      const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
      coverSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, coverSheet, 'Bid Summary');

      // Division breakdown
      if (costs.divisionBreakdown.length > 0) {
        const divisionRows = costs.divisionBreakdown.map(d => ({
          'Division': d.division,
          'Material Cost': formatCurrency(d.materialCost),
          'Labor Hours': d.laborHours.toFixed(2),
          'Labor Cost': formatCurrency(d.laborCost),
          'Total Cost': formatCurrency(d.totalCost),
          'Sell Price (w/ OH & Profit)': formatCurrency(d.sellPrice)
        }));

        const divisionSheet = XLSX.utils.json_to_sheet(divisionRows);
        divisionSheet['!cols'] = [
          { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(wb, divisionSheet, 'Division Breakdown');
      }

      const fileName = `${useStore.getState().getProjectName() || 'Project'} - Bid.xlsx`;
      XLSX.writeFile(wb, fileName);

      alert('Bid summary exported successfully!');
    } catch (error) {
      console.error('Error exporting bid:', error);
      alert('Failed to export bid summary');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: '#fff',
      borderLeft: '2px solid #ddd',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
      overflowY: 'auto',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Pricing & Bidding</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>
      </div>

      {isLoading ? (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '6px', textAlign: 'center', color: '#666' }}>
          Loading pricing data...
        </div>
      ) : (
        <div style={{ marginBottom: '20px', padding: '12px', background: pricesLoaded ? '#d4edda' : '#fff3cd', borderRadius: '6px', border: pricesLoaded ? '1px solid #c3e6cb' : '1px solid #ffeaa7' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: pricesLoaded ? '#155724' : '#856404' }}>
            {pricesLoaded ? `✓ ${priceCount} Material Prices Loaded from Database` : '⚠ No Material Pricing Loaded'}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <label
              htmlFor="pricing-upload"
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                background: '#2e7d32',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              📁 Upload Pricing Excel
            </label>
            <input
              id="pricing-upload"
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadPricingFile(file);
              }}
            />
            <button
              onClick={handleLoadDemoPricing}
              style={{
                padding: '8px 12px',
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              🎯 Load Demo Pricing
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#0d3b66' }}>
          Markup Settings
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: '500' }}>
            Overhead %
          </label>
          <input
            type="number"
            value={overheadPct}
            onChange={(e) => setOverheadPct(parseFloat(e.target.value) || 0)}
            step="0.5"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: '500' }}>
            Profit Margin %
          </label>
          <input
            type="number"
            value={profitPct}
            onChange={(e) => setProfitPct(parseFloat(e.target.value) || 0)}
            step="0.5"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: '500' }}>
            Sales Tax %
          </label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            step="0.1"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: '500' }}>
            Shipping Cost $
          </label>
          <input
            type="number"
            value={shipping}
            onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
            step="10"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: '500' }}>
            Equipment Rental $
          </label>
          <input
            type="number"
            value={equipment}
            onChange={(e) => setEquipment(parseFloat(e.target.value) || 0)}
            step="50"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {costs && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#0d3b66' }}>
            Cost Summary
          </h3>

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
              <span>Material Cost:</span>
              <strong>{formatCurrency(costs.materialCostTotal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              <span style={{ paddingLeft: '10px' }}>+ Tax ({taxRate}%):</span>
              <span>{formatCurrency(costs.materialTax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              <span style={{ paddingLeft: '10px' }}>+ Shipping:</span>
              <span>{formatCurrency(costs.materialShipping)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #ddd', fontSize: '14px' }}>
              <span>Material Subtotal:</span>
              <strong>{formatCurrency(costs.materialSubtotal)}</strong>
            </div>
          </div>

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
              <span>Labor Hours:</span>
              <strong>{costs.laborHoursTotal.toFixed(1)} hrs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              <span style={{ paddingLeft: '10px' }}>@ {formatCurrency(costs.laborRate)}/hr:</span>
              <span>{formatCurrency(costs.laborCostTotal)}</span>
            </div>
          </div>

          {costs.equipmentCostTotal > 0 && (
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Equipment:</span>
                <strong>{formatCurrency(costs.equipmentCostTotal)}</strong>
              </div>
            </div>
          )}

          <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '15px', fontWeight: 'bold' }}>
              <span>SUBTOTAL:</span>
              <span>{formatCurrency(costs.subtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#555' }}>
              <span>+ Overhead ({overheadPct}%):</span>
              <span>{formatCurrency(costs.overheadAmount)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid #90caf9', fontSize: '14px' }}>
              <span>Subtotal with OH:</span>
              <strong>{formatCurrency(costs.subtotalWithOverhead)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '14px', color: '#555' }}>
              <span>+ Profit ({profitPct}%):</span>
              <span>{formatCurrency(costs.profitAmount)}</span>
            </div>
          </div>

          <div style={{
            background: '#1b5e20',
            color: '#fff',
            padding: '20px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>TOTAL BID PRICE</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {formatCurrency(costs.totalBidPrice)}
            </div>
          </div>

          <button
            onClick={exportBidSummary}
            style={{
              width: '100%',
              padding: '12px',
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            📄 Export Bid Summary (Excel)
          </button>

          <button
            onClick={saveBid}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            💾 Save Bid to Database
          </button>

          <button
            onClick={saveSettings}
            style={{
              width: '100%',
              padding: '10px',
              background: '#757575',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ⚙️ Save Settings as Default
          </button>

          {costs.divisionBreakdown.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#0d3b66' }}>
                Breakdown by Division
              </h3>
              {costs.divisionBreakdown.map((div, idx) => (
                <div key={idx} style={{
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{div.division}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>Material:</span>
                    <span>{formatCurrency(div.materialCost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>Labor ({div.laborHours.toFixed(1)}hrs):</span>
                    <span>{formatCurrency(div.laborCost)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid #ddd',
                    fontWeight: 'bold',
                    color: '#1b5e20'
                  }}>
                    <span>Sell Price:</span>
                    <span>{formatCurrency(div.sellPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!pricesLoaded && !isLoading && (
        <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '6px', fontSize: '12px', color: '#856404' }}>
          <strong>Note:</strong> Material costs default to $0 until pricing database is loaded.
          Click "📁 Upload Pricing Excel\" above to load your material costs. Your pricing will be saved to the database and automatically load next time!
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '6px', fontSize: '12px', color: '#1565c0' }}>
        <strong>💡 How it works:</strong><br/>
        • Upload your pricing Excel once - it saves to the database<br/>
        • Costs auto-calculate as you do your takeoff<br/>
        • Your settings (overhead, profit, tax) are saved<br/>
        • Click "Save Bid" to store this estimate<br/>
        • Export to Excel for client proposals
      </div>
    </div>
  );
}

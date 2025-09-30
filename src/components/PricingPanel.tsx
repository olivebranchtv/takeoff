/**
 * Pricing and Bidding Panel
 * Calculate costs and generate bid proposals
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/state/store';
import { PricingDatabase, calculateProjectCosts, type ProjectCosts } from '@/utils/pricing';
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

  const [costs, setCosts] = useState<ProjectCosts | null>(null);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
            Export Bid Summary (Excel)
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

      <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '6px', fontSize: '12px', color: '#856404' }}>
        <strong>Note:</strong> Material costs default to $0 until pricing database is loaded.
        Upload your SKD Estimating Database to see accurate costs.
      </div>
    </div>
  );
}

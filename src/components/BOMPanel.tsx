import React, { useMemo, useState } from 'react';
import { useStore } from '@/state/store';
import { pathLength } from '@/utils/geometry';
import type { AnyTakeoffObject, ManualItem } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

type Props = { open: boolean; onToggle: () => void; };

type Summary = {
  totalTags: number;
  totalLF: number;
  byType: { segment: number; polyline: number; freeform: number };
  countsByCode: { code: string; count: number }[];
  calibratedPages: number;
  totalPages: number;
  totalRacewayLF: number;
  totalConductorLF: number;
  totalBoxes: number;
  wireBySizeAndMaterial: { size: string; material: string; lengthFt: number }[];
};

export default function BomPanel({ open, onToggle }: Props) {
  const { pages, manualItems, addManualItem, updateManualItem, deleteManualItem, addCountsForExistingMeasurements } = useStore();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [autoAddComplete, setAutoAddComplete] = useState(false);
  const [newItem, setNewItem] = useState<Omit<ManualItem, 'id'>>({
    description: '',
    quantity: 0,
    unit: 'EA',
    category: '',
    itemCode: '',
    notes: ''
  });

  // Auto-add counts on mount (only once per session)
  React.useEffect(() => {
    if (!autoAddComplete && pages.length > 0) {
      console.log('🔄 Auto-add effect triggered');
      setTimeout(() => {
        console.log('🔄 Auto-add timeout fired');
        try {
          const count = addCountsForExistingMeasurements();
          console.log(`🔄 Auto-added ${count} fixture counts`);
          setAutoAddComplete(true);
        } catch (err) {
          console.error('❌ Auto-add error:', err);
          setAutoAddComplete(true);
        }
      }, 1000);
    }
  }, [autoAddComplete, pages.length, addCountsForExistingMeasurements]);

  const data = useMemo<Summary>(() => {
    let totalTags = 0;
    let segLF = 0, plLF = 0, ffLF = 0;
    const counts = new Map<string, number>();
    let calibratedPages = 0;
    let totalRacewayLF = 0;
    let totalConductorLF = 0;
    let totalBoxes = 0;
    const wireMap = new Map<string, number>(); // key: "size::material"

    for (const pg of pages) {
      const ppf = pg.pixelsPerFoot;
      if (ppf && ppf > 0) calibratedPages++;
      for (const obj of (pg.objects ?? [])) {
        if (obj.type === 'count') {
          totalTags += 1;
          const c = (obj as any).code || '';
          counts.set(c, (counts.get(c) ?? 0) + 1);
        } else {
          const verts = obj.vertices ?? [];
          const lenPx = pathLength(verts);
          const lf = ppf && ppf > 0 ? lenPx / ppf : 0;
          if (obj.type === 'segment') segLF += lf;
          else if (obj.type === 'polyline') plLF += lf;
          else if (obj.type === 'freeform') ffLF += lf;

          // Add raceway/conductor calculations if measureResult exists
          const measureResult = (obj as any).measureResult;
          if (measureResult) {
            if (measureResult.raceway?.lengthFt) {
              totalRacewayLF += measureResult.raceway.lengthFt;
            }
            if (measureResult.conductors) {
              for (const cond of measureResult.conductors) {
                if (cond.lengthFt > 0) {
                  totalConductorLF += cond.lengthFt;
                  const wireKey = `${cond.size}::${cond.material}`;
                  wireMap.set(wireKey, (wireMap.get(wireKey) || 0) + cond.lengthFt);
                }
              }
            }
            if (measureResult.boxes) {
              totalBoxes += measureResult.boxes;
            }
          }
        }
      }
    }

    const countsByCode = Array.from(counts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => a.code.localeCompare(b.code));

    const wireBySizeAndMaterial = Array.from(wireMap.entries())
      .map(([key, lengthFt]) => {
        const [size, material] = key.split('::');
        return { size, material, lengthFt };
      })
      .sort((a, b) => a.size.localeCompare(b.size));

    return {
      totalTags,
      totalLF: segLF + plLF + ffLF,
      byType: { segment: segLF, polyline: plLF, freeform: ffLF },
      countsByCode,
      calibratedPages,
      totalPages: pages.length,
      totalRacewayLF,
      totalConductorLF,
      totalBoxes,
      wireBySizeAndMaterial
    };
  }, [pages]);

  function handleAddCounts() {
    console.log('🔘 Add Counts button clicked!');
    try {
      const count = addCountsForExistingMeasurements();
      console.log(`✅ Function returned: ${count}`);
      if (count > 0) {
        alert(`Added ${count} fixture count(s) from existing measurements!`);
      } else {
        alert('No new counts added. All measurements already have counts or no valid measurements found.');
      }
    } catch (err) {
      console.error('❌ Error in handleAddCounts:', err);
      alert(`Error: ${err}`);
    }
  }

  function exportCSV() {
    const rows: string[][] = [];
    rows.push(['Metric', 'Value']);
    rows.push(['Total Tags', String(data.totalTags)]);
    rows.push(['Total LF', data.totalLF.toFixed(2)]);
    rows.push(['Segment LF', data.byType.segment.toFixed(2)]);
    rows.push(['Polyline LF', data.byType.polyline.toFixed(2)]);
    rows.push(['Freeform LF', data.byType.freeform.toFixed(2)]);
    rows.push([]);
    rows.push(['Raceway LF', data.totalRacewayLF.toFixed(2)]);
    rows.push(['Conductor LF', data.totalConductorLF.toFixed(2)]);
    rows.push(['Total Boxes', String(data.totalBoxes)]);
    rows.push([]);
    rows.push(['Wire Size', 'Material', 'Length (LF)']);
    for (const w of data.wireBySizeAndMaterial) {
      rows.push([w.size, w.material, w.lengthFt.toFixed(2)]);
    }
    rows.push([]);
    rows.push(['Code', 'Count']);

    // Calculate total for fixture counts
    let totalCount = 0;
    for (const row of data.countsByCode) {
      rows.push([row.code, String(row.count)]);
      totalCount += row.count;
    }

    // Add total row
    rows.push([]);
    rows.push(['TOTAL', String(totalCount)]);

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bom_summary.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 10px', borderBottom:'1px solid #eee', background:'#fff', position:'sticky', top:0, zIndex:1
      }}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <button className="btn" title={open ? 'Collapse' : 'Expand'} onClick={onToggle}>
            {open ? '▾' : '▸'}
          </button>
          <div className="label">BOM Summary</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button
            className="btn"
            onClick={() => {
              const allObjects = pages.flatMap(p => p.objects);
              const withCodes = allObjects.filter(o => (o as any).code);
              console.log('📊 Total objects:', allObjects.length);
              console.log('📊 Objects with codes:', withCodes.length);
              console.log('📊 Sample objects with codes:', withCodes.slice(0, 5));
              alert(`Total objects: ${allObjects.length}\nObjects with codes: ${withCodes.length}\nSee console for details.`);
            }}
            title="Debug: Show objects with codes"
          >
            Debug
          </button>
          <button
            className="btn"
            onClick={handleAddCounts}
            title="Add fixture counts for existing measurements (L2-1, F-1, etc.)"
          >
            Add Counts
          </button>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {open ? (
        <div style={{padding:'10px', overflow:'auto'}}>
          <div style={{fontSize:13, color:'#555', marginBottom:8}}>
            {data.calibratedPages}/{data.totalPages} page(s) calibrated.
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12}}>
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Totals</div>
              <div style={{fontSize:14}}>
                <div><strong>Total Tags:</strong> {data.totalTags}</div>
                <div><strong>Total LF:</strong> {data.totalLF.toFixed(2)}</div>
              </div>
            </div>
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Linear Feet</div>
              <div style={{fontSize:14}}>
                <div>Segment: {data.byType.segment.toFixed(2)}</div>
                <div>Polyline: {data.byType.polyline.toFixed(2)}</div>
                <div>Freeform: {data.byType.freeform.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12}}>
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Raceways & Wire</div>
              <div style={{fontSize:14}}>
                <div><strong>Raceway LF:</strong> {data.totalRacewayLF.toFixed(2)}</div>
                <div><strong>Conductor LF:</strong> {data.totalConductorLF.toFixed(2)}</div>
                <div><strong>Boxes:</strong> {data.totalBoxes}</div>
              </div>
            </div>
            <div className="card">
              <div className="label" style={{marginBottom:6}}>Wire Summary</div>
              <div style={{fontSize:13, maxHeight:100, overflow:'auto'}}>
                {data.wireBySizeAndMaterial.length === 0 ? (
                  <div style={{color:'#666'}}>No wire measured</div>
                ) : (
                  data.wireBySizeAndMaterial.map((w, i) => (
                    <div key={i}>{w.size} {w.material}: {w.lengthFt.toFixed(0)} LF</div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <div className="label">Manual Items (not on drawing)</div>
              <button
                className="btn"
                onClick={() => {
                  setShowManualEntry(!showManualEntry);
                  if (!showManualEntry) {
                    setNewItem({description:'',quantity:0,unit:'EA',category:'',itemCode:'',notes:''});
                  }
                }}
                style={{display:'flex', alignItems:'center', gap:4}}
              >
                <Plus size={16} /> Add Item
              </button>
            </div>

            {showManualEntry && (
              <div style={{padding:10, background:'#f9fafb', borderRadius:6, marginBottom:10}}>
                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8, marginBottom:8}}>
                  <input
                    type="text"
                    placeholder="Description (e.g., 200 LF Trenching)"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    style={{padding:'6px 8px', border:'1px solid #ccc', borderRadius:4, fontSize:13}}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
                    style={{padding:'6px 8px', border:'1px solid #ccc', borderRadius:4, fontSize:13}}
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    style={{padding:'6px 8px', border:'1px solid #ccc', borderRadius:4, fontSize:13}}
                  >
                    <option value="EA">EA</option>
                    <option value="LF">LF</option>
                    <option value="HR">HR</option>
                    <option value="LS">LS</option>
                    <option value="SF">SF</option>
                  </select>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <input
                    type="text"
                    placeholder="Category (optional)"
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    style={{flex:1, padding:'6px 8px', border:'1px solid #ccc', borderRadius:4, fontSize:13}}
                  />
                  <input
                    type="text"
                    placeholder="Item Code (optional)"
                    value={newItem.itemCode}
                    onChange={(e) => setNewItem({...newItem, itemCode: e.target.value})}
                    style={{flex:1, padding:'6px 8px', border:'1px solid #ccc', borderRadius:4, fontSize:13}}
                  />
                </div>
                <div style={{marginTop:8, display:'flex', gap:8}}>
                  <button
                    className="btn"
                    onClick={() => {
                      if (newItem.description && newItem.quantity > 0) {
                        addManualItem(newItem);
                        setNewItem({description:'',quantity:0,unit:'EA',category:'',itemCode:'',notes:''});
                        setShowManualEntry(false);
                      } else {
                        alert('Please enter description and quantity');
                      }
                    }}
                    style={{background:'#10b981', color:'white'}}
                  >
                    Save Item
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setShowManualEntry(false);
                      setNewItem({description:'',quantity:0,unit:'EA',category:'',itemCode:'',notes:''});
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {manualItems.length > 0 && (
              <div style={{maxHeight:200, overflow:'auto', marginBottom:12}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                  <thead>
                    <tr style={{textAlign:'left', borderBottom:'1px solid #eee', background:'#f9fafb'}}>
                      <th style={{padding:'6px 4px'}}>Description</th>
                      <th style={{padding:'6px 4px', width:80}}>Qty</th>
                      <th style={{padding:'6px 4px', width:60}}>Unit</th>
                      <th style={{padding:'6px 4px', width:40}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualItems.map(item => (
                      <tr key={item.id} style={{borderBottom:'1px solid #f4f4f4'}}>
                        <td style={{padding:'6px 4px'}}>{item.description}</td>
                        <td style={{padding:'6px 4px'}}>{item.quantity}</td>
                        <td style={{padding:'6px 4px'}}>{item.unit}</td>
                        <td style={{padding:'6px 4px'}}>
                          <button
                            className="btn"
                            onClick={() => deleteManualItem(item.id)}
                            style={{padding:'2px 6px', fontSize:12}}
                            title="Delete item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="label" style={{marginBottom:6}}>Counts by Code</div>
            <div style={{maxHeight:300, overflow:'auto'}}>
              {data.countsByCode.length === 0 ? (
                <div style={{color:'#666', fontSize:13}}>No tags yet.</div>
              ) : (
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
                  <thead>
                    <tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}>
                      <th style={{padding:'6px 4px'}}>Code</th>
                      <th style={{padding:'6px 4px'}}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.countsByCode.map(r => (
                      <tr key={r.code} style={{borderBottom:'1px solid #f4f4f4'}}>
                        <td style={{padding:'6px 4px', fontWeight:600}}>{r.code}</td>
                        <td style={{padding:'6px 4px'}}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{padding:'8px', color:'#666', fontSize:12}} />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabasePricing';

type DatabaseItem = {
  item_code: string;
  description: string;
  category: string;
  material_cost: number;
  labor_hours: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectCode?: (code: string) => void;
};

export function DatabaseItemBrowser({ open, onClose, onSelectCode }: Props) {
  const [items, setItems] = useState<DatabaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (open) {
      loadItems();
    }
  }, [open]);

  async function loadItems() {
    if (!supabase) {
      alert('Database not connected');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('material_pricing')
        .select('item_code, description, category, material_cost, labor_hours')
        .not('item_code', 'is', null)
        .neq('item_code', '')
        .order('category')
        .order('item_code');

      if (error) {
        console.error('Error loading database items:', error);
        alert('Error loading database items: ' + error.message);
        return;
      }

      setItems(data || []);
    } catch (err) {
      console.error('Exception loading items:', err);
      alert('Error loading items');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category)))].sort();

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = !search ||
      item.item_code.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedItems: Record<string, DatabaseItem[]> = {};
  filteredItems.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
            Master Database Items ({filteredItems.length} items)
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: '2px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          padding: '16px 24px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search by code or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '10px 14px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading database items...
            </div>
          ) : Object.keys(groupedItems).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No items found matching your search
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1f2937',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #e5e7eb',
                  position: 'sticky',
                  top: 0,
                  background: 'white',
                  zIndex: 1
                }}>
                  {category} ({categoryItems.length})
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {categoryItems.map(item => (
                    <div
                      key={item.item_code}
                      style={{
                        padding: '12px 16px',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        display: 'grid',
                        gridTemplateColumns: '200px 1fr 120px 120px',
                        gap: '16px',
                        alignItems: 'center',
                        cursor: onSelectCode ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => onSelectCode?.(item.item_code)}
                      onMouseEnter={e => {
                        if (onSelectCode) {
                          e.currentTarget.style.background = '#eff6ff';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#1f2937', fontFamily: 'monospace' }}>
                        {item.item_code}
                      </div>
                      <div style={{ color: '#4b5563' }}>
                        {item.description}
                      </div>
                      <div style={{ color: '#059669', fontWeight: 600, textAlign: 'right' }}>
                        ${Number(item.material_cost).toFixed(2)}
                      </div>
                      <div style={{ color: '#0891b2', fontWeight: 600, textAlign: 'right' }}>
                        {Number(item.labor_hours).toFixed(2)} hrs
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          background: '#f9fafb',
          borderTop: '2px solid #e5e7eb',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>Tip:</strong> {onSelectCode ? 'Click any item to use its code in your tag' : 'Use these exact item codes in your tags for automatic pricing'}
        </div>
      </div>
    </div>
  );
}

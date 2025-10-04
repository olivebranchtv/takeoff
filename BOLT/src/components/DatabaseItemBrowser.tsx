import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabasePricing';

type DatabaseItem = {
  id?: string;
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
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ cost: string; hours: string }>({ cost: '', hours: '' });
  const [saving, setSaving] = useState(false);

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
        .select('id, item_code, description, category, material_cost, labor_hours')
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

  async function saveEdit(item: DatabaseItem) {
    if (!supabase) {
      alert('Database not connected');
      return;
    }

    const newCost = parseFloat(editValues.cost);
    const newHours = parseFloat(editValues.hours);

    if (isNaN(newCost) || isNaN(newHours) || newCost < 0 || newHours < 0) {
      alert('Please enter valid positive numbers for cost and hours');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('material_pricing')
        .update({
          material_cost: newCost,
          labor_hours: newHours
        })
        .eq('item_code', item.item_code);

      if (error) {
        console.error('Error updating item:', error);
        alert('Error updating item: ' + error.message);
        return;
      }

      setItems(prev => prev.map(i =>
        i.item_code === item.item_code
          ? { ...i, material_cost: newCost, labor_hours: newHours }
          : i
      ));

      setEditingItem(null);
      alert('✓ Item updated successfully!');
    } catch (err) {
      console.error('Exception updating item:', err);
      alert('Error updating item');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: DatabaseItem) {
    if (!supabase) {
      alert('Database not connected');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ Delete "${item.item_code}"?\n\n` +
      `This will permanently remove this item from your master pricing database.\n\n` +
      `Description: ${item.description}\n` +
      `Cost: $${item.material_cost.toFixed(2)}\n` +
      `Hours: ${item.labor_hours.toFixed(2)}\n\n` +
      `Any tags using this item code will lose their pricing reference.\n\n` +
      `This action CANNOT be undone.`
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('material_pricing')
        .delete()
        .eq('item_code', item.item_code);

      if (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item: ' + error.message);
        return;
      }

      setItems(prev => prev.filter(i => i.item_code !== item.item_code));
      alert('✓ Item deleted successfully!');
    } catch (err) {
      console.error('Exception deleting item:', err);
      alert('Error deleting item');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: DatabaseItem) {
    setEditingItem(item.item_code);
    setEditValues({
      cost: String(item.material_cost),
      hours: String(item.labor_hours)
    });
  }

  function cancelEdit() {
    setEditingItem(null);
    setEditValues({ cost: '', hours: '' });
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '1400px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
              Master Database Items ({filteredItems.length} items)
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
              Click any item to use its code, or click Edit to update pricing
            </p>
          </div>
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
                  {categoryItems.map(item => {
                    const isEditing = editingItem === item.item_code;

                    return (
                      <div
                        key={item.item_code}
                        style={{
                          padding: '12px 16px',
                          background: isEditing ? '#fff7ed' : '#f9fafb',
                          border: isEditing ? '2px solid #fb923c' : '1px solid #e5e7eb',
                          borderRadius: '6px',
                          display: 'grid',
                          gridTemplateColumns: '180px 1fr 140px 140px 180px',
                          gap: '12px',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#1f2937', fontFamily: 'monospace', fontSize: '13px' }}>
                          {item.item_code}
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '14px' }}>
                          {item.description}
                        </div>

                        {isEditing ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editValues.cost}
                              onChange={e => setEditValues(v => ({ ...v, cost: e.target.value }))}
                              placeholder="Cost"
                              style={{
                                padding: '6px 10px',
                                border: '2px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#059669'
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit(item);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={editValues.hours}
                              onChange={e => setEditValues(v => ({ ...v, hours: e.target.value }))}
                              placeholder="Hours"
                              style={{
                                padding: '6px 10px',
                                border: '2px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#0891b2'
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit(item);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => saveEdit(item)}
                                disabled={saving}
                                style={{
                                  padding: '6px 12px',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: saving ? 'not-allowed' : 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  opacity: saving ? 0.6 : 1
                                }}
                              >
                                {saving ? 'Saving...' : '✓ Save'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                style={{
                                  padding: '6px 12px',
                                  background: '#f3f4f6',
                                  color: '#4b5563',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  cursor: saving ? 'not-allowed' : 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                color: '#059669',
                                fontWeight: 600,
                                textAlign: 'right',
                                fontSize: '14px'
                              }}
                            >
                              ${Number(item.material_cost).toFixed(2)}
                            </div>
                            <div
                              style={{
                                color: '#0891b2',
                                fontWeight: 600,
                                textAlign: 'right',
                                fontSize: '14px'
                              }}
                            >
                              {Number(item.labor_hours).toFixed(2)} hrs
                            </div>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => startEdit(item)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteItem(item)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px'
                                }}
                              >
                                Delete
                              </button>
                              {onSelectCode && (
                                <button
                                  onClick={() => onSelectCode(item.item_code)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#f3f4f6',
                                    color: '#4b5563',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                  }}
                                >
                                  Use Code
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
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
          <strong>Tip:</strong> Click "Edit" to update cost and labor hours directly in the master database. Changes apply to all tags using this item code.
        </div>
      </div>
    </div>
  );
}

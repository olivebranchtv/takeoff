import React from 'react';
import { useStore } from '@/state/store';
import type { Assembly, Tag, AssemblyItem } from '@/types';
import { Plus, Save, X, Trash2, CreditCard as Edit2 } from 'lucide-react';

export function AssemblyPanel() {
  const { assemblies, tags, addAssembly, updateAssembly, deleteAssembly } = useStore();
  const [selectedAssembly, setSelectedAssembly] = React.useState<Assembly | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingAssembly, setEditingAssembly] = React.useState<Partial<Assembly> | null>(null);

  const tagsUsingAssembly = (assemblyId: string) => {
    return tags.filter(t => t.assemblyId === assemblyId);
  };

  const startCreateAssembly = () => {
    setEditingAssembly({
      code: '',
      name: '',
      description: '',
      type: 'custom',
      items: [],
      isActive: true
    });
    setIsCreating(true);
    setSelectedAssembly(null);
  };

  const startEditAssembly = (assembly: Assembly) => {
    setEditingAssembly({ ...assembly });
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setEditingAssembly(null);
    setIsCreating(false);
  };

  const saveAssembly = () => {
    if (!editingAssembly || !editingAssembly.code || !editingAssembly.name) return;

    const assembly: Assembly = {
      id: editingAssembly.id || crypto.randomUUID(),
      code: editingAssembly.code,
      name: editingAssembly.name,
      description: editingAssembly.description || '',
      type: editingAssembly.type || 'custom',
      items: editingAssembly.items || [],
      isActive: editingAssembly.isActive ?? true
    };

    if (editingAssembly.id) {
      updateAssembly(editingAssembly.id, assembly);
    } else {
      addAssembly(assembly);
    }

    setEditingAssembly(null);
    setIsCreating(false);
    setSelectedAssembly(assembly);
  };

  const addItemToAssembly = () => {
    if (!editingAssembly) return;
    const newItem: AssemblyItem = {
      id: crypto.randomUUID(),
      description: '',
      unit: 'EA',
      quantityPer: 1,
      category: '',
      wasteFactor: 1.02,
      notes: ''
    };
    setEditingAssembly({
      ...editingAssembly,
      items: [...(editingAssembly.items || []), newItem]
    });
  };

  const removeItemFromAssembly = (itemId: string) => {
    if (!editingAssembly) return;
    setEditingAssembly({
      ...editingAssembly,
      items: (editingAssembly.items || []).filter(item => item.id !== itemId)
    });
  };

  const updateItemInAssembly = (itemId: string, updates: Partial<AssemblyItem>) => {
    if (!editingAssembly) return;
    setEditingAssembly({
      ...editingAssembly,
      items: (editingAssembly.items || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    });
  };

  const handleDeleteAssembly = (assemblyId: string) => {
    if (confirm('Are you sure you want to delete this assembly? Tags using it will no longer have an assembly assigned.')) {
      deleteAssembly(assemblyId);
      if (selectedAssembly?.id === assemblyId) {
        setSelectedAssembly(null);
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{
        width: '300px',
        borderRight: '1px solid #ddd',
        overflow: 'auto',
        padding: '16px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              Assemblies
            </h3>
            <button
              onClick={startCreateAssembly}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: '#0066FF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <Plus size={16} />
              Create
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px' }}>
            Standard and custom material kits
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assemblies.map(assembly => {
            const tagCount = tagsUsingAssembly(assembly.id).length;
            const isSelected = selectedAssembly?.id === assembly.id;

            return (
              <button
                key={assembly.id}
                onClick={() => setSelectedAssembly(assembly)}
                style={{
                  padding: '12px',
                  border: '1px solid ' + (isSelected ? '#0066FF' : '#ddd'),
                  borderRadius: '6px',
                  background: isSelected ? '#F0F7FF' : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  {assembly.code}
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                  {assembly.name}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {assembly.items.length} items • {tagCount} tag{tagCount !== 1 ? 's' : ''} using
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {isCreating && editingAssembly ? (
          <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                {editingAssembly.id ? 'Edit Assembly' : 'Create New Assembly'}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={saveAssembly}
                  disabled={!editingAssembly.code || !editingAssembly.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: (!editingAssembly.code || !editingAssembly.name) ? '#ccc' : '#0066FF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (!editingAssembly.code || !editingAssembly.name) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Code *
                  </label>
                  <input
                    type="text"
                    value={editingAssembly.code || ''}
                    onChange={(e) => setEditingAssembly({ ...editingAssembly, code: e.target.value })}
                    placeholder="e.g., CUSTOM-01"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Type
                  </label>
                  <select
                    value={editingAssembly.type || 'custom'}
                    onChange={(e) => setEditingAssembly({ ...editingAssembly, type: e.target.value as Assembly['type'] })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="device">Device</option>
                    <option value="panel">Panel</option>
                    <option value="fixture">Fixture</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={editingAssembly.name || ''}
                  onChange={(e) => setEditingAssembly({ ...editingAssembly, name: e.target.value })}
                  placeholder="e.g., Custom Receptacle Assembly"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  value={editingAssembly.description || ''}
                  onChange={(e) => setEditingAssembly({ ...editingAssembly, description: e.target.value })}
                  placeholder="Describe this assembly..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                Materials ({(editingAssembly.items || []).length})
              </h3>
              <button
                onClick={addItemToAssembly}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                <Plus size={16} />
                Add Material
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(editingAssembly.items || []).map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: '#f9fafb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>
                      Material {idx + 1}
                    </div>
                    <button
                      onClick={() => removeItemFromAssembly(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItemInAssembly(item.id, { description: e.target.value })}
                        placeholder='e.g., 4" Square Box'
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantityPer}
                        onChange={(e) => updateItemInAssembly(item.id, { quantityPer: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Unit
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItemInAssembly(item.id, { unit: e.target.value })}
                        placeholder="EA"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Category
                      </label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateItemInAssembly(item.id, { category: e.target.value })}
                        placeholder="e.g., Boxes"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Waste % (e.g., 2 = 2%)
                      </label>
                      <input
                        type="number"
                        value={((item.wasteFactor - 1) * 100).toFixed(0)}
                        onChange={(e) => updateItemInAssembly(item.id, { wasteFactor: 1 + (parseFloat(e.target.value) || 0) / 100 })}
                        step="1"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateItemInAssembly(item.id, { notes: e.target.value })}
                      placeholder="Additional notes..."
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedAssembly ? (
          <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>
                  {selectedAssembly.name}
                </h2>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  Code: <strong>{selectedAssembly.code}</strong> • Type: <strong>{selectedAssembly.type}</strong>
                </div>
                <p style={{ fontSize: '14px', color: '#444', margin: '8px 0' }}>
                  {selectedAssembly.description}
                </p>
              </div>
              {selectedAssembly.type === 'custom' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => startEditAssembly(selectedAssembly)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#0066FF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAssembly(selectedAssembly.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
                Tags Using This Assembly
              </h3>
              {tagsUsingAssembly(selectedAssembly.id).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {tagsUsingAssembly(selectedAssembly.id).map(tag => (
                    <div
                      key={tag.id}
                      style={{
                        padding: '6px 12px',
                        background: tag.color,
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      {tag.code} - {tag.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic' }}>
                  No tags currently use this assembly
                </p>
              )}
            </div>

            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
                Assembly Materials ({selectedAssembly.items.length})
              </h3>

              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: '8px', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '8px', fontWeight: 600, width: '80px' }}>Qty</th>
                    <th style={{ padding: '8px', fontWeight: 600, width: '60px' }}>Unit</th>
                    <th style={{ padding: '8px', fontWeight: 600, width: '100px' }}>Category</th>
                    <th style={{ padding: '8px', fontWeight: 600, width: '70px' }}>Waste</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAssembly.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>
                        <div>{item.description}</div>
                        {item.notes && (
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {item.quantityPer}
                      </td>
                      <td style={{ padding: '10px' }}>{item.unit}</td>
                      <td style={{ padding: '10px' }}>{item.category}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {((item.wasteFactor - 1) * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#F8F9FA',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#666'
              }}>
                <strong>Note:</strong> These materials are automatically calculated when you place count objects
                using tags assigned to this assembly. The quantities shown are per unit, with waste factors applied.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
            fontSize: '14px'
          }}>
            Select an assembly to view details
          </div>
        )}
      </div>
    </div>
  );
}

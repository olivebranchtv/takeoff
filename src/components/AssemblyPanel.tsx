import React from 'react';
import { useStore } from '@/state/store';
import type { Assembly, Tag } from '@/types';

export function AssemblyPanel() {
  const { assemblies, tags } = useStore();
  const [selectedAssembly, setSelectedAssembly] = React.useState<Assembly | null>(null);

  const tagsUsingAssembly = (assemblyId: string) => {
    return tags.filter(t => t.assemblyId === assemblyId);
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
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
            Standard Assemblies
          </h3>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px' }}>
            Industry-standard material kits for electrical estimating
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
        {selectedAssembly ? (
          <div>
            <div style={{ marginBottom: '24px' }}>
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

/**
 * Settings Panel
 * Configure API keys and application settings
 */

import { useState, useEffect } from 'react';
import { getOpenAIApiKey, setOpenAIApiKey } from '@/utils/openaiAnalysis';
import * as XLSX from 'xlsx';
import { supabase } from '@/utils/supabasePricing';
import { useStore } from '@/state/store';
import { GripVertical } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { getProjectTags, reorderProjectTags } = useStore();
  const projectTags = getProjectTags();

  const [apiKey, setApiKeyState] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportingDB, setExportingDB] = useState(false);
  const [importingDB, setImportingDB] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const key = getOpenAIApiKey();
    if (key) {
      setApiKeyState(key);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      setOpenAIApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    }
  };

  const handleClear = () => {
    setOpenAIApiKey('');
    setApiKeyState('');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const maskedKey = apiKey ? apiKey.substring(0, 7) + '•'.repeat(Math.max(0, apiKey.length - 11)) + apiKey.substring(apiKey.length - 4) : '';

  // Drag and drop handlers for reordering tags
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const reorderedTags = [...projectTags];
      const [movedTag] = reorderedTags.splice(draggedIndex, 1);
      reorderedTags.splice(dragOverIndex, 0, movedTag);
      reorderProjectTags(reorderedTags.map(t => t.id));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleExportDatabase = async () => {
    setExportingDB(true);
    setDbMessage('');

    try {
      if (!supabase) {
        setDbMessage('Database not configured');
        setExportingDB(false);
        return;
      }

      const { data, error } = await supabase
        .from('material_pricing')
        .select('*')
        .order('category', { ascending: true })
        .order('description', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setDbMessage('No pricing data found');
        setExportingDB(false);
        return;
      }

      const exportData = data.map(item => ({
        'Item Code': item.item_code || '',
        'Category': item.category,
        'Description': item.description,
        'Unit': item.unit,
        'Material Cost': item.material_cost,
        'Labor Hours': item.labor_hours,
        'Vendor': item.vendor || '',
        'Notes': item.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 15 },  // Item Code
        { wch: 25 },  // Category
        { wch: 60 },  // Description
        { wch: 8 },   // Unit
        { wch: 12 },  // Material Cost
        { wch: 12 },  // Labor Hours
        { wch: 20 },  // Vendor
        { wch: 30 }   // Notes
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Master Pricing Database');

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Master_Pricing_Database_${timestamp}.xlsx`);

      setDbMessage(`✓ Exported ${data.length} items successfully!`);
      setTimeout(() => setDbMessage(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setDbMessage('Error exporting database');
      setTimeout(() => setDbMessage(''), 3000);
    } finally {
      setExportingDB(false);
    }
  };

  const handleImportDatabase = async (file: File) => {
    setImportingDB(true);
    setDbMessage('');

    try {
      if (!supabase) {
        setDbMessage('Database not configured');
        setImportingDB(false);
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        setDbMessage('No data found in file');
        setImportingDB(false);
        return;
      }

      const items = jsonData.map((row: any) => ({
        item_code: row['Item Code'] || row['item_code'] || null,
        category: String(row['Category'] || row['category'] || ''),
        description: String(row['Description'] || row['description'] || ''),
        unit: String(row['Unit'] || row['unit'] || 'EA'),
        material_cost: parseFloat(String(row['Material Cost'] || row['material_cost'] || row['Cost'] || '0')),
        labor_hours: parseFloat(String(row['Labor Hours'] || row['labor_hours'] || '0')),
        vendor: row['Vendor'] || row['vendor'] || null,
        notes: row['Notes'] || row['notes'] || null
      })).filter(item => item.category && item.description);

      if (items.length === 0) {
        setDbMessage('No valid items found in file');
        setImportingDB(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from('material_pricing')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('material_pricing')
        .insert(items);

      if (insertError) throw insertError;

      setDbMessage(`✓ Imported ${items.length} items successfully!`);
      setTimeout(() => setDbMessage(''), 3000);
    } catch (error) {
      console.error('Import error:', error);
      setDbMessage('Error importing database');
      setTimeout(() => setDbMessage(''), 3000);
    } finally {
      setImportingDB(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '2px solid #e0e0e0',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: '#fff'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
              ⚙️ Settings
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
              Configure API keys and preferences
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e3a8a' }}>
              🤖 OpenAI API Key
            </h3>

            <div style={{
              padding: '16px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#1e40af'
            }}>
              <strong>What is this for?</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Your OpenAI API key enables the AI Document Analysis feature, which automatically extracts
                lighting schedules, panel schedules, assumptions, and scope from your drawings.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#374151'
              }}>
                API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="sk-proj-..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    paddingRight: '100px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {showKey ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>
              {apiKey && !showKey && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>
                  Current: {maskedKey}
                </div>
              )}
            </div>

            <div style={{
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #fde047',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#92400e'
            }}>
              <strong>🔒 Privacy & Security:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Your API key is stored locally in your browser only</li>
                <li>It is never sent to our servers</li>
                <li>API calls go directly from your browser to OpenAI</li>
                <li>You can clear it anytime</li>
              </ul>
            </div>

            <div style={{
              padding: '12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#166534'
            }}>
              <strong>💡 How to get your API key:</strong>
              <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>platform.openai.com/api-keys</a></li>
                <li>Sign up or log in to your OpenAI account</li>
                <li>Click "Create new secret key"</li>
                <li>Copy the key (starts with "sk-")</li>
                <li>Paste it above and click Save</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: apiKey.trim() ? '#2563eb' : '#9ca3af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: apiKey.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {saved ? '✓ Saved!' : '💾 Save API Key'}
              </button>
              {apiKey && (
                <button
                  onClick={handleClear}
                  style={{
                    padding: '12px 20px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            <strong style={{ color: '#374151' }}>💰 Pricing Information:</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              OpenAI GPT-4 Vision costs approximately $0.01 per page analyzed.
              A typical 10-page drawing set costs about $0.10 to analyze.
            </p>
          </div>

          {/* Project Tags Order Section */}
          {projectTags.length > 0 && (
            <div style={{
              marginTop: '32px',
              paddingTop: '32px',
              borderTop: '2px solid #e0e0e0'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1e3a8a' }}>
                📋 Lighting Schedule Order
              </h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                Drag and drop tags to match your lighting schedule order for vendor reports
              </p>

              <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '12px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {projectTags.map((tag, index) => (
                  <div
                    key={tag.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      marginBottom: '8px',
                      background: draggedIndex === index ? '#e3f2fd' : '#fff',
                      border: dragOverIndex === index ? '2px dashed #0066FF' : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      cursor: 'move',
                      transition: 'all 0.2s ease',
                      opacity: draggedIndex === index ? 0.5 : 1
                    }}
                  >
                    <GripVertical size={20} style={{ color: '#999', flexShrink: 0 }} />
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: tag.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      {tag.code}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>
                        {tag.name}
                      </div>
                      {tag.category && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {tag.category}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#999',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: '#e3f2fd',
                border: '1px solid #90caf9',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#1565c0'
              }}>
                💡 <strong>Tip:</strong> This order will be used when exporting the Device Counts sheet in Excel
              </div>
            </div>
          )}

          <div style={{
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '2px solid #e0e0e0'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e3a8a' }}>
              💾 Master Pricing Database
            </h3>

            <div style={{
              padding: '16px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#1e40af'
            }}>
              <strong>What is this?</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Export your complete pricing database (800+ items) to Excel for backup or editing.
                You can update prices in Excel and re-import to update the database.
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: '#fefce8',
              border: '1px solid #fde047',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#713f12'
            }}>
              <strong>💡 Labor Hours for Fixtures:</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                When adding lighting fixtures (especially customer-supplied ones), make sure to set:
              </p>
              <ul style={{ margin: '8px 0 0 16px', paddingLeft: 0 }}>
                <li><strong>Material Cost:</strong> $0 (if customer supplies)</li>
                <li><strong>Labor Hours:</strong> 1.5-2.0 hours per fixture (for installation)</li>
              </ul>
              <p style={{ margin: '8px 0 0 0' }}>
                Example: "D Lights D" → Material Cost: $0, Labor Hours: 1.5
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={handleExportDatabase}
                disabled={exportingDB}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: exportingDB ? '#9ca3af' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: exportingDB ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {exportingDB ? '⏳ Exporting...' : '📥 Export Database to Excel'}
              </button>

              <label
                style={{
                  flex: 1,
                  padding: '12px',
                  background: importingDB ? '#9ca3af' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: importingDB ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center'
                }}
              >
                {importingDB ? '⏳ Importing...' : '📤 Import Database from Excel'}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportDatabase(file);
                      e.target.value = '';
                    }
                  }}
                  disabled={importingDB}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {dbMessage && (
              <div style={{
                padding: '12px',
                background: dbMessage.includes('✓') ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${dbMessage.includes('✓') ? '#86efac' : '#fca5a5'}`,
                borderRadius: '6px',
                fontSize: '13px',
                color: dbMessage.includes('✓') ? '#166534' : '#991b1b',
                fontWeight: 600
              }}>
                {dbMessage}
              </div>
            )}

            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #fde047',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#92400e'
            }}>
              <strong>⚠️ Important Notes:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Export creates a backup of all {'>'}800 pricing items</li>
                <li>Import REPLACES the entire database with your Excel file</li>
                <li>Required columns: Category, Description, Unit, Material Cost, Labor Hours</li>
                <li>Optional columns: Vendor, Notes</li>
                <li>Always backup before importing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

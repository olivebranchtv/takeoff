/**
 * AI Analysis Results Panel
 * Displays OpenAI analysis of electrical drawings
 */

import { useState } from 'react';
import type { ProjectAnalysis } from '@/utils/openaiAnalysis';

interface AIAnalysisPanelProps {
  analysis: ProjectAnalysis;
  onClose: () => void;
  onExport?: () => void;
}

export function AIAnalysisPanel({ analysis, onClose, onExport }: AIAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'lighting' | 'panels' | 'scope' | 'drawings'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'drawings', label: 'Drawings', icon: '📄' },
    { id: 'lighting', label: 'Lighting', icon: '💡' },
    { id: 'panels', label: 'Panels', icon: '⚡' },
    { id: 'scope', label: 'Scope', icon: '📝' }
  ] as const;

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
          width: '95%',
          maxWidth: '1200px',
          height: '90vh',
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
              🤖 AI Document Analysis
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
              Powered by OpenAI GPT-4 Vision
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {onExport && (
              <button
                onClick={onExport}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                📥 Export Report
              </button>
            )}
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
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 24px',
          background: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#667eea' : '#666',
                border: activeTab === tab.id ? '1px solid #e0e0e0' : '1px solid transparent',
                borderBottom: activeTab === tab.id ? '2px solid #667eea' : 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {activeTab === 'overview' && (
            <div>
              {/* Fixture Responsibility */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                  🔧 Fixture Responsibility
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{
                    padding: '16px',
                    background: '#e8f5e9',
                    border: '1px solid #c8e6c9',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#2e7d32' }}>
                      Owner Provided
                    </h4>
                    {analysis.fixtureResponsibility.ownerProvided.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1b5e20' }}>
                        {analysis.fixtureResponsibility.ownerProvided.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>None specified</p>
                    )}
                  </div>
                  <div style={{
                    padding: '16px',
                    background: '#e3f2fd',
                    border: '1px solid #bbdefb',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1565c0' }}>
                      Contractor Provided
                    </h4>
                    {analysis.fixtureResponsibility.contractorProvided.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#0d47a1' }}>
                        {analysis.fixtureResponsibility.contractorProvided.map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>None specified</p>
                    )}
                  </div>
                </div>
                {analysis.fixtureResponsibility.notes && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#fff3cd', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>Note:</strong> {analysis.fixtureResponsibility.notes}
                  </div>
                )}
              </div>

              {/* Assumptions */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                  📌 Project Assumptions
                </h3>
                <div style={{
                  padding: '16px',
                  background: '#fff8e1',
                  border: '1px solid #ffecb3',
                  borderRadius: '8px'
                }}>
                  {analysis.assumptions.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#5d4037' }}>
                      {analysis.assumptions.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>No assumptions found</p>
                  )}
                </div>
              </div>

              {/* Key Notes */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                  📝 Key Notes
                </h3>
                <div style={{
                  padding: '16px',
                  background: '#f3e5f5',
                  border: '1px solid #e1bee7',
                  borderRadius: '8px'
                }}>
                  {analysis.keyNotes.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#4a148c' }}>
                      {analysis.keyNotes.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>No key notes found</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lighting' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                💡 Lighting Schedule
              </h3>
              {analysis.lightingSchedule.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ background: '#f97316', color: '#fff' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Manufacturer</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Model</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Wattage</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Voltage</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Mounting</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.lightingSchedule.map((fixture, idx) => (
                        <tr key={idx} style={{
                          borderBottom: '1px solid #f0f0f0',
                          background: idx % 2 === 0 ? '#fff' : '#f9f9f9'
                        }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#f97316' }}>{fixture.type}</td>
                          <td style={{ padding: '12px' }}>{fixture.description}</td>
                          <td style={{ padding: '12px' }}>{fixture.manufacturer || '—'}</td>
                          <td style={{ padding: '12px', fontSize: '12px' }}>{fixture.model || '—'}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{fixture.quantity || '—'}</td>
                          <td style={{ padding: '12px' }}>{fixture.wattage || '—'}</td>
                          <td style={{ padding: '12px' }}>{fixture.voltage || '—'}</td>
                          <td style={{ padding: '12px' }}>{fixture.mounting || '—'}</td>
                          <td style={{ padding: '12px', fontSize: '11px', color: '#666' }}>{fixture.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  padding: '48px',
                  textAlign: 'center',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>No lighting schedule found in drawings</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'panels' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                ⚡ Panel Schedule
              </h3>
              {analysis.panelSchedule.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {analysis.panelSchedule.map((panel, idx) => (
                    <div key={idx} style={{
                      padding: '20px',
                      background: '#fff',
                      border: '2px solid #2563eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#2563eb'
                        }}>
                          Panel {panel.panelId}
                        </h4>
                        <div style={{
                          padding: '4px 12px',
                          background: '#dbeafe',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#1e40af'
                        }}>
                          {panel.main}
                        </div>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        fontSize: '13px'
                      }}>
                        {panel.location && (
                          <div>
                            <span style={{ color: '#666', fontWeight: 500 }}>Location:</span>{' '}
                            <span style={{ fontWeight: 600 }}>{panel.location}</span>
                          </div>
                        )}
                        {panel.voltage && (
                          <div>
                            <span style={{ color: '#666', fontWeight: 500 }}>Voltage:</span>{' '}
                            <span style={{ fontWeight: 600 }}>{panel.voltage}</span>
                          </div>
                        )}
                        {panel.phases && (
                          <div>
                            <span style={{ color: '#666', fontWeight: 500 }}>Phases:</span>{' '}
                            <span style={{ fontWeight: 600 }}>{panel.phases}</span>
                          </div>
                        )}
                        {panel.circuits && (
                          <div>
                            <span style={{ color: '#666', fontWeight: 500 }}>Circuits:</span>{' '}
                            <span style={{ fontWeight: 600 }}>{panel.circuits}</span>
                          </div>
                        )}
                        {panel.feedFrom && (
                          <div>
                            <span style={{ color: '#666', fontWeight: 500 }}>Fed From:</span>{' '}
                            <span style={{ fontWeight: 600 }}>{panel.feedFrom}</span>
                          </div>
                        )}
                      </div>
                      {panel.notes && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px',
                          background: '#f0f9ff',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#0c4a6e'
                        }}>
                          <strong>Notes:</strong> {panel.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '48px',
                  textAlign: 'center',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>No panel schedule found in drawings</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'drawings' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                📄 Drawing Page Analysis
              </h3>
              {analysis.drawingPages && analysis.drawingPages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analysis.drawingPages.map((page, idx) => (
                    <div key={idx} style={{
                      padding: '20px',
                      background: '#fff',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          padding: '6px 12px',
                          background: '#2563eb',
                          color: '#fff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          Page {page.pageNumber}
                        </div>
                        <div style={{
                          padding: '4px 10px',
                          background: getPageTypeColor(page.pageType),
                          color: '#fff',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {page.pageType.replace('_', ' ')}
                        </div>
                        {page.title && (
                          <h4 style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#333'
                          }}>
                            {page.title}
                          </h4>
                        )}
                      </div>
                      <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.5'
                      }}>
                        {page.description}
                      </p>
                      {page.findings && page.findings.length > 0 && (
                        <div>
                          <h5 style={{
                            margin: '0 0 8px 0',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#444'
                          }}>
                            Key Findings:
                          </h5>
                          <ul style={{
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '13px',
                            color: '#555'
                          }}>
                            {page.findings.map((finding, findingIdx) => (
                              <li key={findingIdx} style={{ marginBottom: '4px' }}>
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '48px',
                  textAlign: 'center',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>No drawing analysis available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scope' && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                  ✅ Included Work
                </h3>
                <div style={{
                  padding: '16px',
                  background: '#e8f5e9',
                  border: '1px solid #c8e6c9',
                  borderRadius: '8px'
                }}>
                  {analysis.scope.includedWork.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1b5e20' }}>
                      {analysis.scope.includedWork.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>No included work specified</p>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                  ❌ Excluded Work
                </h3>
                <div style={{
                  padding: '16px',
                  background: '#ffebee',
                  border: '1px solid #ffcdd2',
                  borderRadius: '8px'
                }}>
                  {analysis.scope.excludedWork.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#c62828' }}>
                      {analysis.scope.excludedWork.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', fontStyle: 'italic' }}>No excluded work specified</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getPageTypeColor(pageType: string): string {
  const colors: Record<string, string> = {
    'lighting_schedule': '#f97316',
    'panel_schedule': '#2563eb',
    'floor_plan': '#16a34a',
    'details': '#ca8a04',
    'notes': '#9333ea',
    'cover': '#6b7280',
    'unknown': '#94a3b8'
  };
  return colors[pageType] || colors.unknown;
}

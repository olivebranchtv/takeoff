/**
 * AI Analysis Results Panel (Improved for Electrical Takeoff)
 * - Zero-guessing presentation: shows scan coverage, missing data, and assumptions explicitly
 * - Scans every page: page-by-page audit, OCR confidence, and unparsed items
 * - Thorough categories: Lighting, Panels, Gear, Devices, Raceway/Wire, Scope, Assumptions, QA/RFIs
 * - Defensive rendering with safe defaults (never crashes if fields are missing)
 * - Export hook preserved; props API unchanged
 */

import { useMemo, useState } from 'react';
import type { ProjectAnalysis } from '@/utils/openaiAnalysis';

interface AIAnalysisPanelProps {
  analysis: ProjectAnalysis;
  onClose: () => void;
  onExport?: () => void;
}

export function AIAnalysisPanel({ analysis, onClose, onExport }: AIAnalysisPanelProps) {
  // --- Safe defaults (no runtime errors if any section is undefined) ---
  const safe = useMemo(() => normalizeAnalysis(analysis), [analysis]);

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'assumptions'
    | 'lighting'
    | 'panels'
    | 'gear'
    | 'devices'
    | 'raceways'
    | 'scope'
    | 'drawings'
    | 'qa'
  >('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'assumptions', label: 'Assumptions', icon: '📌' },
    { id: 'drawings', label: 'Drawings', icon: '📄' },
    { id: 'lighting', label: 'Lighting', icon: '💡' },
    { id: 'panels', label: 'Panels', icon: '⚡' },
    { id: 'gear', label: 'Gear', icon: '🧰' },
    { id: 'devices', label: 'Devices', icon: '🔌' },
    { id: 'raceways', label: 'Raceway & Wire', icon: '📏' },
    { id: 'scope', label: 'Scope', icon: '📝' },
    { id: 'qa', label: 'QA / RFIs', icon: '🔎' },
  ] as const;

  const coverage = useMemo(() => computeCoverage(safe), [safe]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '95%',
          maxWidth: '1400px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '2px solid #e0e0e0',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            color: '#fff',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>🤖 AI Document Analysis</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Zero-guess | Page-by-page audit | Electrical takeoff ready</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Coverage badges */}
            <Badge label={`Pages scanned: ${coverage.pagesScanned}/${coverage.pagesTotal}`} tone="blue" />
            <Badge label={`Assumptions: ${coverage.assumptionCount}`} tone="amber" />
            <Badge label={`Flags: ${coverage.flagCount}`} tone={coverage.flagCount > 0 ? 'red' : 'green'} />
            {onExport && (
              <button
                onClick={onExport}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                📥 Export Report
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '10px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '10px 16px',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#0ea5e9' : '#64748b',
                border: activeTab === tab.id ? '1px solid #e2e8f0' : '1px solid transparent',
                borderBottom: activeTab === tab.id ? '2px solid #0ea5e9' : 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Zero-guessing banner */}
        <div style={{ background: '#fefce8', borderBottom: '1px solid #fde68a', padding: 10 }}>
          <strong>🔒 No Guessing:</strong> This report only shows data explicitly found in the drawings/specs. Any inference or missing values are listed as <em>Assumptions</em> or <em>RFIs</em>.
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {activeTab === 'overview' && (
            <div>
              {/* Responsibility */}
              <SectionTitle title="🔧 Fixture Responsibility" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24 }}>
                <PillCard title="Owner Provided" tone="green">
                  <List items={safe.fixtureResponsibility.ownerProvided} empty="None specified" color="#1b5e20" />
                </PillCard>
                <PillCard title="Contractor Provided" tone="blue">
                  <List items={safe.fixtureResponsibility.contractorProvided} empty="None specified" color="#0d47a1" />
                </PillCard>
              </div>
              {safe.fixtureResponsibility.notes && (
                <Note tone="amber">{safe.fixtureResponsibility.notes}</Note>
              )}

              {/* Coverage snapshot */}
              <SectionTitle title="🧭 Coverage Snapshot" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
                <Stat label="Lighting Types" value={safe.lightingSchedule.length} />
                <Stat label="Panels Found" value={safe.panelSchedule.length} />
                <Stat label="Gear Items" value={safe.gearSchedule.length} />
                <Stat label="Drawing Pages" value={safe.drawingPages.length} />
              </div>

              <SectionTitle title="📝 Key Notes" />
              <PillCard tone="purple">
                <List items={safe.keyNotes} empty="No key notes found" />
              </PillCard>
            </div>
          )}

          {activeTab === 'assumptions' && (
            <div>
              <SectionTitle title="📌 Assumptions & Clarifications" />
              <Block title="Fixture Supply & Responsibility" tone="indigo" items={safe.assumptions.fixtureSupply} />
              <Block title="Electrical Contractor Scope" tone="indigo" items={safe.assumptions.electricalScope} />
              <Block title="Lighting Fixture Schedule" tone="indigo" items={safe.assumptions.lightingScheduleNotes} />
              <Block title="Fixtures Listed" tone="amber" items={safe.assumptions.fixturesList} />
              <Block title="Other Pages" tone="indigo" items={safe.assumptions.otherPages} />
              <Block title="Lighting Controls (Devices)" tone="teal" items={safe.assumptions.lightingControls} />
              <Block title="Fixture Counts" tone="indigo" items={safe.assumptions.fixtureCountsBasis} />
              <Block title="Waste Factors / Labor Basis" tone="yellow" items={safe.assumptions.wasteFactors} />
              <Block title="Labor Rate & Unit References" tone="yellow" items={safe.assumptions.laborRates} />
              <Block title="QA Notes" tone="amber" items={safe.assumptions.qaNotes} />
              <Block title="Other Assumptions" tone="indigo" items={safe.assumptions.other} />
              {isAllEmpty([
                safe.assumptions.fixtureSupply,
                safe.assumptions.electricalScope,
                safe.assumptions.lightingScheduleNotes,
                safe.assumptions.fixturesList,
                safe.assumptions.otherPages,
                safe.assumptions.lightingControls,
                safe.assumptions.fixtureCountsBasis,
                safe.assumptions.wasteFactors,
                safe.assumptions.laborRates,
                safe.assumptions.qaNotes,
                safe.assumptions.other,
              ]) && <Empty icon="📌" text="No assumptions extracted from drawings" />}
            </div>
          )}

          {activeTab === 'lighting' && (
            <div>
              <SectionTitle title="💡 Lighting Schedule" />
              {safe.lightingSchedule.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#f97316', color: '#fff' }}>
                        <th style={th}>Type</th>
                        <th style={th}>Description</th>
                        <th style={th}>Manufacturer</th>
                        <th style={th}>Model</th>
                        <th style={{ ...th, textAlign: 'center' }}>Qty</th>
                        <th style={th}>Wattage</th>
                        <th style={th}>Voltage</th>
                        <th style={th}>Mounting</th>
                        <th style={th}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safe.lightingSchedule.map((fx, idx) => (
                        <tr key={idx} style={tr(idx)}>
                          <td style={tdStrongOrng}>{fx.type}</td>
                          <td style={td}>{fx.description || '—'}</td>
                          <td style={td}>{fx.manufacturer || '—'}</td>
                          <td style={{ ...td, fontSize: 12 }}>{fx.model || '—'}</td>
                          <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{fx.quantity ?? '—'}</td>
                          <td style={td}>{fx.wattage || '—'}</td>
                          <td style={td}>{fx.voltage || '—'}</td>
                          <td style={td}>{fx.mounting || '—'}</td>
                          <td style={{ ...td, fontSize: 11, color: '#666' }}>{fx.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty icon="💡" text="No lighting schedule found in drawings" />
              )}
            </div>
          )}

          {activeTab === 'panels' && (
            <div>
              <SectionTitle title="⚡ Panel Schedules" />
              {safe.panelSchedule.length > 0 ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  {safe.panelSchedule.map((panel, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 20,
                        background: '#fff',
                        border: '2px solid #2563eb',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#2563eb' }}>Panel {panel.panelId || '—'}</h4>
                        <div style={{ padding: '4px 10px', background: '#dbeafe', borderRadius: 12, fontSize: 12, fontWeight: 700, color: '#1e40af' }}>
                          {panel.main || '—'}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13 }}>
                        {panel.location && <Field label="Location" value={panel.location} />}
                        {panel.voltage && <Field label="Voltage" value={panel.voltage} />}
                        {panel.phases && <Field label="Phases" value={panel.phases} />}
                        {panel.circuits && <Field label="Circuits" value={panel.circuits} />}
                        {panel.feedFrom && <Field label="Fed From" value={panel.feedFrom} />}
                      </div>
                      {panel.notes && <Note tone="blue">{panel.notes}</Note>}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon="⚡" text="No panel schedule found in drawings" />
              )}
            </div>
          )}

          {activeTab === 'gear' && (
            <div>
              <SectionTitle title="🧰 Gear Schedule" />
              {safe.gearSchedule.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#0ea5e9', color: '#fff' }}>
                        <th style={th}>Equipment</th>
                        <th style={th}>Tag/Name</th>
                        <th style={th}>Voltage</th>
                        <th style={th}>Phase</th>
                        <th style={th}>AIC</th>
                        <th style={th}>Bus (A)</th>
                        <th style={th}>Feed From</th>
                        <th style={th}>Location</th>
                        <th style={th}>kVA</th>
                        <th style={th}>Primary/Secondary</th>
                        <th style={th}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safe.gearSchedule.map((g, i) => (
                        <tr key={i} style={tr(i)}>
                          <td style={td}>{g.equipment || '—'}</td>
                          <td style={td}>{g.tag || g.name || '—'}</td>
                          <td style={td}>{g.voltage || '—'}</td>
                          <td style={td}>{g.phase || '—'}</td>
                          <td style={td}>{g.aic || '—'}</td>
                          <td style={td}>{g.bus || '—'}</td>
                          <td style={td}>{g.feedFrom || '—'}</td>
                          <td style={td}>{g.location || '—'}</td>
                          <td style={td}>{g.kva || '—'}</td>
                          <td style={td}>{g.primarySecondary || '—'}</td>
                          <td style={{ ...td, fontSize: 12, color: '#555' }}>{g.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty icon="🧰" text="No gear schedule found in drawings" />
              )}
            </div>
          )}

          {activeTab === 'devices' && (
            <div>
              <SectionTitle title="🔌 Devices" />
              {safe.devices.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#10b981', color: '#fff' }}>
                        <th style={th}>Type</th>
                        <th style={th}>Symbol</th>
                        <th style={th}>Mounting Height</th>
                        <th style={th}>Qty</th>
                        <th style={th}>Plate/Accessory</th>
                        <th style={th}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safe.devices.map((d, i) => (
                        <tr key={i} style={tr(i)}>
                          <td style={td}>{d.deviceType || '—'}</td>
                          <td style={td}>{d.symbol || '—'}</td>
                          <td style={td}>{d.mountingHeight || '—'}</td>
                          <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{d.qty ?? '—'}</td>
                          <td style={td}>{d.plate || '—'}</td>
                          <td style={{ ...td, fontSize: 12, color: '#555' }}>{d.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty icon="🔌" text="No devices found in drawings" />
              )}
            </div>
          )}

          {activeTab === 'raceways' && (
            <div>
              <SectionTitle title="📏 Raceway & Wire" />
              {safe.racewayWire.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: '#22c55e', color: '#fff' }}>
                        <th style={th}>System</th>
                        <th style={th}>From</th>
                        <th style={th}>To</th>
                        <th style={th}>Circuit/Feeder</th>
                        <th style={th}>Raceway Type</th>
                        <th style={th}>Size</th>
                        <th style={th}>Length (LF)</th>
                        <th style={th}>Conductors</th>
                        <th style={th}>Wire Length (LF)</th>
                        <th style={th}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safe.racewayWire.map((r, i) => (
                        <tr key={i} style={tr(i)}>
                          <td style={td}>{r.system || '—'}</td>
                          <td style={td}>{r.from || '—'}</td>
                          <td style={td}>{r.to || '—'}</td>
                          <td style={td}>{r.id || r.circuit || '—'}</td>
                          <td style={td}>{r.racewayType || '—'}</td>
                          <td style={td}>{r.racewaySize || '—'}</td>
                          <td style={tdNum}>{num(r.lengthLf)}</td>
                          <td style={td}>{r.conductors || '—'}</td>
                          <td style={tdNum}>{num(r.wireLengthLf)}</td>
                          <td style={{ ...td, fontSize: 12, color: '#555' }}>{r.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty icon="📏" text="No raceway/wire items found" />
              )}
            </div>
          )}

          {activeTab === 'drawings' && (
            <div>
              <SectionTitle title="📄 Drawing Page Analysis" />
              {safe.drawingPages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {safe.drawingPages.map((page, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 20,
                        background: '#fff',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                          Page {page.pageNumber ?? idx + 1}
                        </div>
                        <div style={{ padding: '4px 10px', background: getPageTypeColor(page.pageType), color: '#fff', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                          {(page.pageType || 'unknown').replace('_', ' ')}
                        </div>
                        {page.title && <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{page.title}</h4>}
                        <Badge label={`OCR ${(page.ocrConfidence ?? 0) * 100}%`} tone={ocrTone(page.ocrConfidence)} />
                        <Badge label={page.parsed ? 'Parsed' : 'Unparsed'} tone={page.parsed ? 'green' : 'red'} />
                      </div>
                      {page.description && (
                        <p style={{ margin: '0 0 10px 0', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{page.description}</p>
                      )}
                      {page.findings && page.findings.length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, color: '#334155' }}>Key Findings:</h5>
                          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#374151' }}>
                            {page.findings.map((f, fi) => (
                              <li key={fi} style={{ marginBottom: 4 }}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(page.unparsedTables?.length || 0) > 0 && (
                        <Note tone="red">Unparsed tables: {page.unparsedTables?.join(', ')}</Note>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon="📄" text="No drawing analysis available" />
              )}
            </div>
          )}

          {activeTab === 'scope' && (
            <div>
              <SectionTitle title="📦 Scope Summary" />
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 800, color: '#111827' }}>✅ Included Work</h4>
                <Pill tone="#e8f5e9" border="#c8e6c9">
                  <List items={safe.scope.includedWork} empty="No included work specified" color="#1b5e20" />
                </Pill>
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 800, color: '#111827' }}>❌ Excluded Work</h4>
                <Pill tone="#ffebee" border="#ffcdd2">
                  <List items={safe.scope.excludedWork} empty="No excluded work specified" color="#b91c1c" />
                </Pill>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div>
              <SectionTitle title="🔎 QA / RFIs" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                <PillCard title="Validation Flags" tone="red">
                  <List items={safe.validation.flags} empty="No validation flags" />
                </PillCard>
                <PillCard title="Suggested RFIs" tone="amber">
                  <List items={safe.validation.rfis} empty="No RFIs" />
                </PillCard>
              </div>
              <div style={{ marginTop: 16 }}>
                <PillCard title="Cross-Checks" tone="blue">
                  <List items={safe.validation.crossChecks} empty="No cross-check notes" />
                </PillCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------- helpers & UI atoms -----------------------

function normalizeAnalysis(a: any) {
  const defArr: any[] = [];
  const defObj = {} as any;
  return {
    // responsibilities
    fixtureResponsibility: {
      ownerProvided: a?.fixtureResponsibility?.ownerProvided ?? defArr,
      contractorProvided: a?.fixtureResponsibility?.contractorProvided ?? defArr,
      notes: a?.fixtureResponsibility?.notes ?? '',
    },

    // assumptions buckets
    assumptions: {
      fixtureSupply: a?.assumptions?.fixtureSupply ?? defArr,
      electricalScope: a?.assumptions?.electricalScope ?? defArr,
      lightingScheduleNotes: a?.assumptions?.lightingScheduleNotes ?? defArr,
      fixturesList: a?.assumptions?.fixturesList ?? defArr,
      otherPages: a?.assumptions?.otherPages ?? defArr,
      lightingControls: a?.assumptions?.lightingControls ?? defArr,
      fixtureCountsBasis: a?.assumptions?.fixtureCountsBasis ?? defArr,
      wasteFactors: a?.assumptions?.wasteFactors ?? defArr,
      laborRates: a?.assumptions?.laborRates ?? defArr,
      qaNotes: a?.assumptions?.qaNotes ?? defArr,
      other: a?.assumptions?.other ?? defArr,
    },

    // schedules & data
    lightingSchedule: a?.lightingSchedule ?? defArr,
    panelSchedule: a?.panelSchedule ?? defArr,
    gearSchedule: a?.gearSchedule ?? defArr,
    devices: a?.devices ?? defArr,
    racewayWire: a?.racewayWire ?? defArr,

    // drawings
    drawingPages: a?.drawingPages ?? defArr,

    // scope
    scope: {
      includedWork: a?.scope?.includedWork ?? defArr,
      excludedWork: a?.scope?.excludedWork ?? defArr,
    },

    // validation & QA
    validation: {
      flags: a?.validation?.flags ?? defArr,
      rfis: a?.validation?.rfis ?? defArr,
      crossChecks: a?.validation?.crossChecks ?? defArr,
    },

    // notes
    keyNotes: a?.keyNotes ?? defArr,

    // meta
    meta: a?.meta ?? defObj,
  };
}

function computeCoverage(a: ReturnType<typeof normalizeAnalysis>) {
  const pagesScanned = a.drawingPages.length;
  const pagesTotal = a.meta?.pagesTotal ?? pagesScanned;
  const assumptionCount = [
    a.assumptions.fixtureSupply,
    a.assumptions.electricalScope,
    a.assumptions.lightingScheduleNotes,
    a.assumptions.fixturesList,
    a.assumptions.otherPages,
    a.assumptions.lightingControls,
    a.assumptions.fixtureCountsBasis,
    a.assumptions.wasteFactors,
    a.assumptions.laborRates,
    a.assumptions.qaNotes,
    a.assumptions.other,
  ].reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const flagCount = (a.validation.flags?.length || 0) + (a.validation.rfis?.length || 0);

  return { pagesScanned, pagesTotal, assumptionCount, flagCount };
}

function isAllEmpty(groups: any[][]) {
  return groups.every((g) => !g || g.length === 0);
}

function num(v: any) {
  if (v === null || v === undefined || isNaN(Number(v))) return '—';
  const n = Number(v);
  return Number.isInteger(n) ? n : n.toFixed(2);
}

function ocrTone(conf?: number) {
  const c = (conf ?? 0) * 100;
  if (c >= 95) return 'green';
  if (c >= 80) return 'blue';
  if (c >= 60) return 'amber';
  return 'red';
}

function getPageTypeColor(pageType: string): string {
  const colors: Record<string, string> = {
    lighting_schedule: '#f97316',
    panel_schedule: '#2563eb',
    floor_plan: '#16a34a',
    details: '#ca8a04',
    notes: '#9333ea',
    cover: '#6b7280',
    unknown: '#94a3b8',
  };
  return colors[pageType as keyof typeof colors] || colors.unknown;
}

// --- presentational atoms ---
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  borderRadius: 8,
  overflow: 'hidden',
};
const th: React.CSSProperties = { padding: 12, textAlign: 'left', fontWeight: 700 };
const td: React.CSSProperties = { padding: 12 };
const tdStrongOrng: React.CSSProperties = { ...td, fontWeight: 800, color: '#f97316' };
const tdNum: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
const tr = (idx: number): React.CSSProperties => ({ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' });

function SectionTitle({ title }: { title: string }) {
  return <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: '#111827' }}>{title}</h3>;
}

function PillCard({ title, children, tone }: { title?: string; children: React.ReactNode; tone: 'green' | 'blue' | 'purple' | 'red' | 'amber' }) {
  const palette: Record<string, { bg: string; border: string; color: string }> = {
    green: { bg: '#e8f5e9', border: '#c8e6c9', color: '#1b5e20' },
    blue: { bg: '#e3f2fd', border: '#bbdefb', color: '#0d47a1' },
    purple: { bg: '#f3e5f5', border: '#e1bee7', color: '#4a148c' },
    red: { bg: '#fee2e2', border: '#fecaca', color: '#991b1b' },
    amber: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
  };
  const c = palette[tone];
  return (
    <div style={{ padding: 16, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, color: c.color }}>
      {title && <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{title}</h4>}
      {children}
    </div>
  );
}

function Pill({ tone, border, children }: { tone: string; border: string; children: React.ReactNode }) {
  return <div style={{ padding: 16, background: tone, border: `1px solid ${border}`, borderRadius: 8 }}>{children}</div>;
}

function Note({ tone, children }: { tone: 'amber' | 'blue' | 'red'; children: React.ReactNode }) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    amber: { bg: '#fff7ed', border: '#fed7aa', color: '#7c2d12' },
    blue: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e3a8a' },
    red: { bg: '#fef2f2', border: '#fecaca', color: '#7f1d1d' },
  };
  const s = styles[tone];
  return (
    <div style={{ marginTop: 12, padding: 12, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, fontSize: 13, color: s.color }}>
      <strong>Note:</strong> {children}
    </div>
  );
}

function List({ items, empty, color }: { items: any[]; empty?: string; color?: string }) {
  if (!items || items.length === 0) return <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>{empty || 'None'}</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: color || '#111827' }}>
      {items.map((item, idx) => (
        <li key={idx} style={{ marginBottom: 6 }}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
      ))}
    </ul>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span style={{ color: '#64748b', fontWeight: 700 }}>{label}:</span> <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: 'blue' | 'green' | 'amber' | 'red' }) {
  const palette: Record<string, { bg: string; color: string; border: string }> = {
    blue: { bg: '#e0f2fe', color: '#075985', border: '#7dd3fc' },
    green: { bg: '#dcfce7', color: '#065f46', border: '#86efac' },
    amber: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    red: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  };
  const c = palette[tone];
  return (
    <span style={{ padding: '4px 10px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
      {label}
    </span>
  );
}

function Block({ title, tone, items }: { title: string; tone: 'indigo' | 'amber' | 'yellow' | 'teal' | 'orange'; items: any[] }) {
  const palette: Record<string, { bg: string; border: string }> = {
    indigo: { bg: '#eef2ff', border: '#c7d2fe' },
    amber: { bg: '#fffbeb', border: '#fde68a' },
    yellow: { bg: '#fef9c3', border: '#fde68a' },
    teal: { bg: '#ecfeff', border: '#a5f3fc' },
    orange: { bg: '#fff7ed', border: '#fed7aa' },
  };
  const p = palette[tone];
  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 8px 0', color: '#3730a3' }}>{title}</h4>
      <div style={{ padding: 16, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 8 }}>
        <List items={items} empty={`No ${title.toLowerCase()} found`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0ea5e9', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center', background: '#f9fafb', borderRadius: 8, color: '#6b7280' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}

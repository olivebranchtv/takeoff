// src/components/MeasureDialog.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { MeasureOptions, EMTSize, WireSize, ConductorSpec } from '@/types';
import { useStore } from '@/state/store';

/** EMT sizes for raceway */
const EMT_SIZES: EMTSize[] = [
  '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"',
  '2-1/2"', '3"', '3-1/2"', '4"', ''
] as const;

/** Commercial wire sizes commonly used (AWG + kcmil) */
const WIRE_SIZES = [
  '18','16','14','12','10','8','6','4','3','2','1','1/0','2/0','3/0','4/0',
  '250','300','350','400','500','600','750','1000'
] as const;

/** Conductor insulation types (expand as needed) */
const INSULATION_TYPES = [
  'THHN/THWN-2',
  'XHHW-2',
  'RHH/RHW-2',
  'MTW'
] as const;

/** Wire materials */
const WIRE_MATERIALS = ['CU','AL'] as const;

/** Keep exactly 3 conductor groups; fill defaults */
function normalizeConductor3(
  incoming?: MeasureOptions['conductors']
): MeasureOptions['conductors'] {
  const base: MeasureOptions['conductors'] = [
    { count: 0, size: '', insulation: 'THHN/THWN-2', material: 'CU' },
    { count: 0, size: '', insulation: 'THHN/THWN-2', material: 'CU' },
    { count: 0, size: '', insulation: 'THHN/THWN-2', material: 'CU' },
  ];
  if (!Array.isArray(incoming)) return base;
  const out = [
    { ...base[0], ...(incoming[0] ?? {}) },
    { ...base[1], ...(incoming[1] ?? {}) },
    { ...base[2], ...(incoming[2] ?? {}) },
  ] as MeasureOptions['conductors'];
  // sanitize: if count is 0 clear size
  for (const g of out) if (!g.count) g.size = '';
  return out;
}

type Props = {
  open: boolean;
  /** Optional seed values (else uses store.lastMeasureOptions) */
  initial?: Partial<MeasureOptions>;
  /** Called if the user cancels (or presses Esc) */
  onCancel: () => void;
  /** Called with normalized MeasureOptions on Save */
  onSubmit: (opts: MeasureOptions) => void;
  /** Title override (default: "Measurement Options") */
  title?: string;
};

export default function MeasureDialog({
  open,
  initial,
  onCancel,
  onSubmit,
  title = 'Measurement Options',
}: Props) {
  const last = useStore(s => s.lastMeasureOptions);
  const setLast = useStore(s => s.setLastMeasureOptions);
  const resetLast = useStore(s => s.resetLastMeasureOptions);

  /** Prefill from initial → lastMeasureOptions → hard defaults */
  const seeded: MeasureOptions = useMemo(() => {
    const seed: MeasureOptions = {
      // raceway
      emtSize: (initial?.emtSize ?? last?.emtSize) as EMTSize | undefined,
      extraRacewayPerPoint: toNum(initial?.extraRacewayPerPoint, last?.extraRacewayPerPoint, 0),

      // conductors
      conductors: normalizeConductor3(initial?.conductors ?? last?.conductors),

      extraConductorPerPoint: toNum(initial?.extraConductorPerPoint, last?.extraConductorPerPoint, 0),
      boxesPerPoint: toNum(initial?.boxesPerPoint, last?.boxesPerPoint, 0),

      // NOTE: store.ts uses wasteFactor (factor like 1.05), not wastePct
      wasteFactor: clampMin(initial?.wasteFactor ?? last?.wasteFactor ?? 1, 1),

      // display
      lineColor: String(initial?.lineColor ?? last?.lineColor ?? '#000000'),
      pointColor: String(initial?.pointColor ?? last?.pointColor ?? '#000000'),
      lineWeight: toNum(initial?.lineWeight, last?.lineWeight, 2),
      opaquePoints: Boolean(initial?.opaquePoints ?? last?.opaquePoints ?? false),
    };
    return seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // re-seed when opening

  const [form, setForm] = useState<MeasureOptions>(seeded);

  useEffect(() => {
    if (open) setForm(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // keyboard: Enter = submit, Esc = cancel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit() {
    // normalize & sanitize
    const conductors = normalizeConductor3(form.conductors).map(g => ({
      count: clampNonNegInt(g.count),
      size: (g.count ?? 0) > 0 ? String(g.size ?? '') as WireSize : '' as WireSize,
      insulation: (g.count ?? 0) > 0 ? (g.insulation || 'THHN/THWN-2') : 'THHN/THWN-2',
      material: (g.count ?? 0) > 0 ? (g.material || 'CU') : 'CU',
    })) as [ConductorSpec, ConductorSpec, ConductorSpec];

    const clean: MeasureOptions = {
      emtSize: form.emtSize ?? '',
      extraRacewayPerPoint: clampNonNeg(form.extraRacewayPerPoint),
      conductors,
      extraConductorPerPoint: clampNonNeg(form.extraConductorPerPoint),
      boxesPerPoint: clampNonNegInt(form.boxesPerPoint),
      wasteFactor: clampMin(form.wasteFactor ?? 1, 1),
      lineColor: form.lineColor || '#000000',
      pointColor: form.pointColor || '#000000',
      lineWeight: clampNonNeg(form.lineWeight || 1),
      opaquePoints: !!form.opaquePoints,
    };

    // persist for the next run
    setLast(clean);
    onSubmit(clean);
  }

  if (!open) return null;

  return (
    <div style={backdropStyle} onMouseDown={(e) => {
      if (e.target === e.currentTarget) onCancel(); // click outside = cancel
    }}>
      <div style={panelStyle} onMouseDown={(e)=>e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button className="btn" onClick={onCancel} title="Close">×</button>
        </div>

        <div style={bodyStyle}>
          {/* RACEWAY */}
          <Section title="Raceway (EMT)">
            <div className="grid">
              <label>EMT Size</label>
              <select
                value={form.emtSize ?? ''}
                onChange={(e)=>setForm(f=>({...f, emtSize: e.target.value as EMTSize}))}
              >
                <option value="">— Select —</option>
                {EMT_SIZES.filter(s => s !== '').map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>

              <label>Extra per Point (ft)</label>
              <NumberInput
                value={form.extraRacewayPerPoint}
                min={0}
                step={0.1}
                onValue={(v)=>setForm(f=>({...f, extraRacewayPerPoint: v}))}
              />

              <label>Waste Factor</label>
              <NumberInput
                value={form.wasteFactor ?? 1}
                min={1}
                step={0.01}
                onValue={(v)=>setForm(f=>({...f, wasteFactor: clampMin(v, 1)}))}
              />
            </div>
          </Section>

          {/* CONDUCTORS */}
          <Section title="Conductors (up to 3 groups)">
            <div className="grid">
              {normalizeConductor3(form.conductors).map((g, i) => {
                const disabled = (g.count ?? 0) <= 0;
                return (
                  <React.Fragment key={i}>
                    <label>Group {i+1} — Qty</label>
                    <NumberInput
                      value={g.count}
                      min={0}
                      step={1}
                      onValue={(v)=>setForm(f=>{
                        const list = normalizeConductor3(f.conductors);
                        const qty = clampNonNegInt(v);
                        list[i] = {
                          ...list[i],
                          count: qty,
                          size: qty === 0 ? '' : (list[i].size || ''),
                        };
                        return { ...f, conductors: list };
                      })}
                    />

                    <label>Wire Size</label>
                    <select
                      value={g.size ?? ''}
                      onChange={(e)=>setForm(f=>{
                        const list = normalizeConductor3(f.conductors);
                        list[i] = { ...list[i], size: e.target.value as (typeof WIRE_SIZES)[number] | '' };
                        return { ...f, conductors: list };
                      })}
                      disabled={disabled}
                    >
                      <option value="">— Select —</option>
                      {WIRE_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>

                    <label>Material</label>
                    <select
                      value={g.material ?? 'CU'}
                      onChange={(e)=>setForm(f=>{
                        const list = normalizeConductor3(f.conductors);
                        list[i] = { ...list[i], material: e.target.value as (typeof WIRE_MATERIALS)[number] };
                        return { ...f, conductors: list };
                      })}
                      disabled={disabled}
                    >
                      {WIRE_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <label>Insulation</label>
                    <select
                      value={g.insulation ?? 'THHN/THWN-2'}
                      onChange={(e)=>setForm(f=>{
                        const list = normalizeConductor3(f.conductors);
                        list[i] = { ...list[i], insulation: e.target.value as (typeof INSULATION_TYPES)[number] };
                        return { ...f, conductors: list };
                      })}
                      disabled={disabled}
                    >
                      {INSULATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </React.Fragment>
                );
              })}

              <label>Extra per Point (ft) — Each Conductor</label>
              <NumberInput
                value={form.extraConductorPerPoint}
                min={0}
                step={0.1}
                onValue={(v)=>setForm(f=>({...f, extraConductorPerPoint: v}))}
              />

              <label>Boxes per Point</label>
              <NumberInput
                value={form.boxesPerPoint}
                min={0}
                step={1}
                onValue={(v)=>setForm(f=>({...f, boxesPerPoint: clampNonNegInt(v)}))}
              />
            </div>
          </Section>

          {/* DISPLAY */}
          <Section title="Display">
            <div className="grid">
              <label>Line Color</label>
              <input
                type="color"
                value={form.lineColor}
                onChange={(e)=>setForm(f=>({...f, lineColor: e.target.value}))}
              />
              <label>Point Color</label>
              <input
                type="color"
                value={form.pointColor}
                onChange={(e)=>setForm(f=>({...f, pointColor: e.target.value}))}
              />
              <label>Line Weight (px)</label>
              <NumberInput
                value={form.lineWeight}
                min={0}
                step={1}
                onValue={(v)=>setForm(f=>({...f, lineWeight: clampNonNegInt(v)}))}
              />
              <label>Opaque Points</label>
              <input
                type="checkbox"
                checked={!!form.opaquePoints}
                onChange={(e)=>setForm(f=>({...f, opaquePoints: e.target.checked}))}
              />
            </div>
          </Section>
        </div>

        <div style={footerStyle}>
          <button
            className="btn"
            onClick={() => {
              resetLast();
              setForm({
                emtSize: '',
                extraRacewayPerPoint: 0,
                conductors: normalizeConductor3(),
                extraConductorPerPoint: 0,
                boxesPerPoint: 0,
                wasteFactor: 1.05,
                lineColor: '#000000',
                pointColor: '#000000',
                lineWeight: 2,
                opaquePoints: false,
              });
            }}
            title="Restore saved defaults"
          >
            Restore Defaults
          </button>

          <div style={{flex:1}} />

          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={handleSubmit}>Save</button>
        </div>
      </div>

      {/* Inline styles for the simple grid */}
      <style>{`
        .grid {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 10px 12px;
          align-items: center;
        }
        .btn {
          background: #f6f6f6;
          border: 1px solid #ccc;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn:hover { background: #eee; }
        .btn.primary {
          background: #0d6efd;
          color: #fff;
          border-color:#0b5ed7;
        }
        .btn.primary:hover { background:#0b5ed7; }
        input[type="number"], select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}

/* ------------------- Small helpers & subcomponents ------------------- */

function Section({ title, children }:{ title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  min,
  max,
  step,
  onValue,
}: {
  value: number | undefined;
  min?: number;
  max?: number;
  step?: number;
  onValue: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value ?? 0}
      min={min ?? 0}
      max={max}
      step={step ?? 1}
      onChange={(e) => onValue(num((e.target as HTMLInputElement).value, min, max))}
    />
  );
}

// coercion helpers
function num(v: string | number | undefined | null, min?: number, max?: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '0'));
  const x = Number.isFinite(n) ? n : 0;
  if (typeof min === 'number' && x < min) return min;
  if (typeof max === 'number' && x > max) return max;
  return x;
}
function toNum(a?: number, b?: number, d = 0) {
  const x = typeof a === 'number' ? a : (typeof b === 'number' ? b : d);
  return Number.isFinite(x) ? x : d;
}
function clampMin(v: number, min = 0) { return Number.isFinite(v) && v >= min ? v : min; }
function clampNonNeg(v: number) { return Number.isFinite(v) && v >= 0 ? v : 0; }
function clampNonNegInt(v: number) { return Math.max(0, Math.floor(Number.isFinite(v) ? v : 0)); }

/* ------------------- Inline styles ------------------- */

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const panelStyle: React.CSSProperties = {
  width: 680,
  maxWidth: '96vw',
  maxHeight: '90vh',
  overflow: 'auto',
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #ddd',
  boxShadow: '0 12px 40px rgba(0,0,0,.25)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderBottom: '1px solid #eee',
};

const bodyStyle: React.CSSProperties = {
  padding: 14,
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  borderTop: '1px solid #eee',
};

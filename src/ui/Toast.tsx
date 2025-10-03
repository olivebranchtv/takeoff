// src/ui/Toast.tsx
import React, { createContext, useCallback, useContext, useState } from 'react';

type Toast = { id: string; msg: string; kind?: 'info' | 'error' };
type Ctx = { addToast: (msg: string, kind?: Toast['kind']) => void };

const ToastCtx = createContext<Ctx | null>(null);

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((msg: string, kind: Toast['kind'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 4500);
  }, []);

  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: t.kind === 'error' ? '#7f1d1d' : '#0f172a',
              color: 'white',
              borderRadius: 10,
              padding: '10px 14px',
              boxShadow: '0 6px 18px rgba(0,0,0,.25)',
              maxWidth: 360
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

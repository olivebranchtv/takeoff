import React from 'react';
export function PricingPanel({ pages, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Pricing</h2>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>
      </div>
    </div>
  );
}

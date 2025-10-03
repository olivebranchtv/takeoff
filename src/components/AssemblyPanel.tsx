import React from 'react';
import type { Assembly } from '@/types';

interface AssemblyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  assemblies: Assembly[];
}

export function AssemblyPanel({ isOpen, onClose, assemblies }: AssemblyPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Assembly Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div>
          <p className="text-gray-600">Assembly management interface</p>
          <p className="text-sm text-gray-500 mt-2">Total assemblies: {assemblies.length}</p>
        </div>
      </div>
    </div>
  );
}

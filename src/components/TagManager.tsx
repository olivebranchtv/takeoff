import React from 'react';
import type { Tag } from '@/types';
interface TagManagerProps {
  open: boolean;
  onClose: () => void;
  onAddToProject: (tag: Tag) => void;
}
export default function TagManager({ open, onClose, onAddToProject }: TagManagerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Tag Manager</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
      </div>
    </div>
  );
}

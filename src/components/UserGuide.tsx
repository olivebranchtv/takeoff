import React from 'react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserGuide({ isOpen, onClose }: UserGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">User Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div>
          <p className="text-gray-600">User guide and documentation</p>
        </div>
      </div>
    </div>
  );
}

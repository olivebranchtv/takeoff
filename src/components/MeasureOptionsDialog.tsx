import React, { useState, useEffect } from 'react';
import type { MeasureOptions } from '@/types';

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (options: MeasureOptions) => void;
  initialOptions: MeasureOptions;
};

const EMT_SIZES = ['½″', '¾″', '1″', '1¼″', '1½″', '2″', '2½″', '3″', '3½″', '4″'];

export default function MeasureOptionsDialog({ open, onClose, onApply, initialOptions }: Props) {
  const [options, setOptions] = useState<MeasureOptions>(initialOptions);

  useEffect(() => {
    if (open) {
      setOptions(initialOptions);
    }
  }, [open, initialOptions]);

  if (!open) return null;

  const handleApply = () => {
    onApply(options);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Set Measure Options</h2>
        
        <div className="space-y-4">
          {/* Extra footage for raceway per point */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Extra footage for raceway per point
            </label>
            <input
              type="number"
              value={options.extraFootagePerPoint}
              onChange={(e) => setOptions(prev => ({ ...prev, extraFootagePerPoint: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.1"
            />
          </div>

          {/* Conductor #1 */}
          <div>
            <label className="block text-sm font-medium mb-1">Number of conductors #1</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={options.conductor1Count}
                onChange={(e) => setOptions(prev => ({ ...prev, conductor1Count: Number(e.target.value) }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
              <select
                value={options.conductor1Size}
                onChange={(e) => setOptions(prev => ({ ...prev, conductor1Size: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {EMT_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conductor #2 */}
          <div>
            <label className="block text-sm font-medium mb-1">Number of conductors #2</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={options.conductor2Count}
                onChange={(e) => setOptions(prev => ({ ...prev, conductor2Count: Number(e.target.value) }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
              <select
                value={options.conductor2Size}
                onChange={(e) => setOptions(prev => ({ ...prev, conductor2Size: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {EMT_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conductor #3 */}
          <div>
            <label className="block text-sm font-medium mb-1">Number of conductors #3</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={options.conductor3Count}
                onChange={(e) => setOptions(prev => ({ ...prev, conductor3Count: Number(e.target.value) }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
              <select
                value={options.conductor3Size}
                onChange={(e) => setOptions(prev => ({ ...prev, conductor3Size: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {EMT_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Extra footage for conductor per point */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Extra footage for conductor per point
            </label>
            <input
              type="number"
              value={options.extraConductorFootagePerPoint}
              onChange={(e) => setOptions(prev => ({ ...prev, extraConductorFootagePerPoint: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.1"
            />
          </div>

          {/* Boxes per point */}
          <div>
            <label className="block text-sm font-medium mb-1">Boxes per point</label>
            <input
              type="number"
              value={options.boxesPerPoint}
              onChange={(e) => setOptions(prev => ({ ...prev, boxesPerPoint: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.1"
            />
          </div>

          {/* Line color */}
          <div>
            <label className="block text-sm font-medium mb-1">Line color</label>
            <input
              type="color"
              value={options.lineColor}
              onChange={(e) => setOptions(prev => ({ ...prev, lineColor: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>

          {/* Point color */}
          <div>
            <label className="block text-sm font-medium mb-1">Point color</label>
            <input
              type="color"
              value={options.pointColor}
              onChange={(e) => setOptions(prev => ({ ...prev, pointColor: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>

          {/* Line weight */}
          <div>
            <label className="block text-sm font-medium mb-1">Line weight</label>
            <input
              type="number"
              value={options.lineWeight}
              onChange={(e) => setOptions(prev => ({ ...prev, lineWeight: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              max="10"
            />
          </div>

          {/* Opaque points checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="opaquePoints"
              checked={options.opaquePoints}
              onChange={(e) => setOptions(prev => ({ ...prev, opaquePoints: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="opaquePoints" className="text-sm font-medium">
              Opaque points
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
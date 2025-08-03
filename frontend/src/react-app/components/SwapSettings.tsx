import { useState } from 'react';
import { Settings } from 'lucide-react';

interface SwapSettingsProps {
  slippageTolerance: number;
  onSlippageChange: (value: number) => void;
  minimumReceive: string;
  onMinimumReceiveChange: (value: string) => void;
}

export default function SwapSettings({ 
  slippageTolerance, 
  onSlippageChange, 
  minimumReceive, 
  onMinimumReceiveChange 
}: SwapSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presetSlippages = [0.1, 0.5, 1.0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        title="Swap Settings"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slippage Tolerance
              </label>
              <div className="flex gap-2 mb-2">
                {presetSlippages.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => onSlippageChange(preset)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                      slippageTolerance === preset
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={slippageTolerance}
                  onChange={(e) => onSlippageChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.50"
                  step="0.1"
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Receive
              </label>
              <input
                type="text"
                value={minimumReceive}
                onChange={(e) => onMinimumReceiveChange(e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your transaction will revert if there is an unfavorable rate change
              </p>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

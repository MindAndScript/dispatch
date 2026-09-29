'use client';

import React, { useState } from 'react';
import { DispatchDataset } from '../types/dispatch';
import { X, Check, RotateCcw, AlertTriangle, Copy, UploadCloud } from 'lucide-react';
import { getTelanganaDataset } from '../data/mockTelanganaData';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDataset: DispatchDataset;
  onSaveDataset: (newDataset: DispatchDataset) => void;
}

export const DatasetModal: React.FC<DatasetModalProps> = ({
  isOpen,
  onClose,
  currentDataset,
  onSaveDataset,
}) => {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(currentDataset, null, 2));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);

      if (!parsed.office || typeof parsed.office.lat !== 'number' || typeof parsed.office.lng !== 'number') {
        throw new Error('Missing or invalid office location (requires lat and lng numbers).');
      }

      if (!Array.isArray(parsed.employees)) {
        throw new Error('Dataset must contain an "employees" array.');
      }

      for (let i = 0; i < Math.min(parsed.employees.length, 50); i++) {
        const e = parsed.employees[i];
        if (typeof e.lat !== 'number' || typeof e.lng !== 'number') {
          throw new Error(`Employee at index ${i} has invalid lat or lng.`);
        }
      }

      setErrorMessage(null);
      onSaveDataset(parsed);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Invalid JSON syntax');
      }
    }
  };

  const handleResetToTelangana = () => {
    const defaultData = getTelanganaDataset();
    setJsonText(JSON.stringify(defaultData, null, 2));
    setErrorMessage(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-sky-400" />
              Dataset Configuration & API Payload
            </h2>
            <p className="text-xs text-slate-400">
              Provide or paste any region/city coordinates (supports 500+ records)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>JSON Editor ({currentDataset.employees.length} employees currently loaded)</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Schema'}</span>
              </button>
              <button
                onClick={handleResetToTelangana}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Telangana (500+ pts)</span>
              </button>
            </div>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full flex-1 p-3 bg-slate-950 font-mono text-xs text-slate-300 rounded-lg border border-slate-800 focus:outline-none focus:border-sky-500 resize-none overflow-y-auto leading-relaxed"
            rows={18}
            spellCheck={false}
          />
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Note: Changing the coordinate bounds will automatically recalculate the wall map grid and auto-fit.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md"
            >
              <Check className="w-4 h-4" />
              Apply Dataset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { importJsonDeck, importApkgFile } from '../services/apkgImporter';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(null);

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        const res = await importJsonDeck(text);
        setLoading(false);
        setStatusMessage({ success: res.success, text: res.message });
        if (res.success) onImportComplete();
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.apkg')) {
      const res = await importApkgFile(file);
      setLoading(false);
      setStatusMessage({ success: res.success, text: res.message });
      if (res.success) onImportComplete();
    } else {
      setLoading(false);
      setStatusMessage({ success: false, text: 'Please select a valid .apkg or .json deck file.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-white">Import Custom Deck</h3>
            <p className="text-xs text-gray-400">Support for Anki (.apkg) & JSON formats.</p>
          </div>
        </div>

        <div className="mt-6 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-8 text-center bg-slate-950/40 transition">
          <FileText className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-semibold text-white">Drag & drop deck file here or click to browse</p>
          <p className="text-xs text-gray-500 mt-1">Accepts .apkg (Anki package) or .json cards array</p>

          <input
            type="file"
            accept=".apkg,.json"
            onChange={handleFileUpload}
            disabled={loading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        {loading && (
          <div className="mt-4 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Parsing and storing deck data into IndexedDB...
          </div>
        )}

        {statusMessage && (
          <div
            className={`mt-4 p-4 rounded-2xl text-xs flex items-center gap-2 ${
              statusMessage.success
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/40 border border-red-500/30 text-red-300'
            }`}
          >
            {statusMessage.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {statusMessage.text}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

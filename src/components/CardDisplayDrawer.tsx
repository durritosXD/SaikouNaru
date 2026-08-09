import React from 'react';
import { X, Eye, EyeOff, Layers, Sliders } from 'lucide-react';
import { CardDisplaySettings } from '../types';

interface CardDisplayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CardDisplaySettings;
  onSave: (newSettings: CardDisplaySettings) => void;
}

export const CardDisplayDrawer: React.FC<CardDisplayDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  if (!isOpen) return null;

  const toggleField = (face: 'front' | 'back', field: keyof CardDisplaySettings['front']) => {
    const updated = {
      ...settings,
      [face]: {
        ...settings[face],
        [field]: !settings[face][field],
      },
    };
    onSave(updated);
  };

  const fields: { key: keyof CardDisplaySettings['front']; label: string; desc: string }[] = [
    { key: 'showKanji', label: 'Kanji Character', desc: 'Display main Kanji glyph' },
    { key: 'showKeyword', label: 'RTK Keyword', desc: 'Display RTK English keyword' },
    { key: 'showMeaning', label: 'English Meaning', desc: 'Detailed English definitions' },
    { key: 'showKoohii', label: 'Koohii Mnemonics', desc: 'Community memory stories (Story 1 & 2)' },
    { key: 'showReadings', label: 'Onyomi & Kunyomi', desc: 'Katakana & Hiragana readings' },
    { key: 'showStrokes', label: 'Stroke Order Animation', desc: 'Animated Kanji GIF' },
    { key: 'showSampleWords', label: 'Sample Vocabulary', desc: 'Example words with readings' },
    { key: 'showAudio', label: 'Japanese Audio TTS', desc: 'Pronunciation audio button' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sliders className="w-5 h-5" />
            <h3 className="font-bold text-lg text-theme-text">Live Card Customization</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-theme-text hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Configure exactly what displays on the <span className="text-indigo-400 font-semibold">Front</span> and <span className="text-pink-400 font-semibold">Back</span> of flashcards for this instance.
        </p>

        {/* Front Settings */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg w-fit">
            <Layers className="w-4 h-4" />
            Front Face Visible Fields
          </div>
          {fields.map((f) => {
            const isVisible = settings.front[f.key];
            return (
              <div
                key={`front_${f.key}`}
                onClick={() => toggleField('front', f.key)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  isVisible
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-theme-text'
                    : 'bg-slate-800/40 border-slate-700/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
                {isVisible ? (
                  <Eye className="w-5 h-5 text-indigo-400 shrink-0" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-500 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Back Settings */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-3 py-1.5 rounded-lg w-fit">
            <Layers className="w-4 h-4" />
            Back Face Visible Fields
          </div>
          {fields.map((f) => {
            const isVisible = settings.back[f.key];
            return (
              <div
                key={`back_${f.key}`}
                onClick={() => toggleField('back', f.key)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  isVisible
                    ? 'bg-pink-950/40 border-pink-500/40 text-theme-text'
                    : 'bg-slate-800/40 border-slate-700/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
                {isVisible ? (
                  <Eye className="w-5 h-5 text-pink-400 shrink-0" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-500 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-theme-text font-medium rounded-xl text-sm transition shadow-lg shadow-indigo-600/30"
          >
            Done Customizing
          </button>
        </div>
      </div>
    </div>
  );
};

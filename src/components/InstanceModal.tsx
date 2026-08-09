import React, { useState, useEffect } from 'react';
import { X, Layers, Settings, Check, Plus, BookOpen } from 'lucide-react';
import { DeckInstance, CardDisplaySettings } from '../types';
import { DEFAULT_DISPLAY_SETTINGS, saveDeckInstance } from '../services/db';

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceToEdit?: DeckInstance | null;
  onSaved: (savedInstance: DeckInstance) => void;
  onDelete?: (id: string) => void;
}

export const InstanceModal: React.FC<InstanceModalProps> = ({
  isOpen,
  onClose,
  instanceToEdit,
  onSaved,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['N5']);
  const [selectedTypes, setSelectedTypes] = useState<('kanji' | 'vocab' | 'grammar')[]>(['kanji', 'vocab', 'grammar']);
  const [dailyNewLimit, setDailyNewLimit] = useState(15);
  const [dailyReviewLimit, setDailyReviewLimit] = useState(100);
  const [displaySettings, setDisplaySettings] = useState<CardDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);

  useEffect(() => {
    if (instanceToEdit) {
      setName(instanceToEdit.name);
      setDescription(instanceToEdit.description);
      setSelectedLevels(instanceToEdit.jlptLevels);
      setSelectedTypes((instanceToEdit.cardTypes as any) || ['kanji', 'vocab', 'grammar']);
      setDailyNewLimit(instanceToEdit.dailyNewLimit);
      setDailyReviewLimit(instanceToEdit.dailyReviewLimit);
      setDisplaySettings(instanceToEdit.displaySettings || DEFAULT_DISPLAY_SETTINGS);
    } else {
      setName('Custom JLPT Study Deck');
      setDescription('Custom instance tailored for my study goals.');
      setSelectedLevels(['N5']);
      setSelectedTypes(['kanji', 'vocab', 'grammar']);
      setDailyNewLimit(15);
      setDailyReviewLimit(100);
      setDisplaySettings(JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)));
    }
  }, [instanceToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleLevel = (lvl: string) => {
    if (selectedLevels.includes(lvl)) {
      if (selectedLevels.length > 1) {
        setSelectedLevels(selectedLevels.filter(l => l !== lvl));
      }
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const toggleType = (t: 'kanji' | 'vocab' | 'grammar') => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(x => x !== t));
      }
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newInstance: DeckInstance = {
      id: instanceToEdit ? instanceToEdit.id : `instance_${Date.now()}`,
      name,
      description,
      jlptLevels: selectedLevels,
      cardTypes: selectedTypes,
      displaySettings,
      dailyNewLimit,
      dailyReviewLimit,
      createdDate: instanceToEdit ? instanceToEdit.createdDate : Date.now(),
    };

    await saveDeckInstance(newInstance);
    onSaved(newInstance);
    onClose();
  };

  const allLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-theme-card border border-theme-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-theme-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-theme-surface border border-theme-border rounded-xl text-theme-text">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-theme-text">
                {instanceToEdit ? 'Configure Study Instance' : 'Create New Deck Instance'}
              </h3>
              <p className="text-xs text-theme-textMuted">
                Filter by JLPT levels & card types (Kanji, Vocab, Grammar).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-theme-textMuted hover:text-theme-text hover:bg-theme-border transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Name & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-theme-text mb-1.5">
                Instance Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border rounded-xl text-theme-text placeholder-gray-500 focus:outline-none focus:border-white text-sm transition"
                placeholder="e.g., N5 & N4 Core Vocab & Grammar"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-theme-text mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border rounded-xl text-theme-text placeholder-gray-500 focus:outline-none focus:border-white text-sm transition"
                placeholder="Brief summary of study targets..."
              />
            </div>
          </div>

          {/* Card Types Selection */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-theme-primary mb-2">
              Card Types Included
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { type: 'kanji' as const, label: 'Kanji Cards' },
                { type: 'vocab' as const, label: 'Vocab Cards' },
                { type: 'grammar' as const, label: 'Grammar Cards' },
              ].map(({ type, label }) => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`py-3 rounded-2xl font-bold text-xs border flex flex-col items-center justify-center gap-1 transition ${
                      isSelected
                        ? 'bg-white border-white text-black font-bold shadow-lg'
                        : 'bg-theme-surface border-theme-border text-theme-textMuted hover:bg-theme-border hover:text-theme-text'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Check className="w-4 h-4 text-black" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* JLPT Levels Selection */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-theme-text mb-2">
              JLPT Levels Included
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {allLevels.map((lvl) => {
                const isSelected = selectedLevels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleLevel(lvl)}
                    className={`py-3 rounded-2xl font-bold text-sm border flex flex-col items-center justify-center gap-1 transition ${
                      isSelected
                        ? 'bg-white border-white text-black font-bold shadow-lg'
                        : 'bg-theme-surface border-theme-border text-theme-textMuted hover:bg-theme-border hover:text-theme-text'
                    }`}
                  >
                    <span>{lvl}</span>
                    {isSelected && <Check className="w-4 h-4 text-black" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-theme-textMuted mt-2 font-mono">
              Selected levels: <span className="text-theme-text font-bold">{selectedLevels.join(', ')}</span>
            </p>
          </div>

          {/* Daily Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-theme-text mb-1.5">
                Daily New Cards Limit
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={dailyNewLimit}
                onChange={(e) => setDailyNewLimit(Number(e.target.value))}
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border rounded-xl text-theme-text text-sm focus:outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-theme-text mb-1.5">
                Daily Reviews Limit
              </label>
              <input
                type="number"
                min="5"
                max="1000"
                value={dailyReviewLimit}
                onChange={(e) => setDailyReviewLimit(Number(e.target.value))}
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border rounded-xl text-theme-text text-sm focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Buttons Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-theme-border">
            <div>
              {instanceToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${instanceToEdit.name}" and all its progress & stats?`)) {
                      onDelete(instanceToEdit.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-red-950/40 border border-red-500/30 hover:bg-red-900/60 text-red-400 font-bold rounded-xl text-xs transition"
                >
                  Delete Instance
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs text-theme-textMuted hover:text-theme-text font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-white text-black hover:bg-gray-200 font-bold rounded-xl text-xs transition"
              >
                {instanceToEdit ? 'Save Changes' : 'Create Instance'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

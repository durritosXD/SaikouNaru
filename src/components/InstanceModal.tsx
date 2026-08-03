import React, { useState, useEffect } from 'react';
import { X, Layers, Settings, Check, Plus, BookOpen } from 'lucide-react';
import { DeckInstance, CardDisplaySettings } from '../types';
import { DEFAULT_DISPLAY_SETTINGS, saveDeckInstance } from '../services/db';

interface InstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceToEdit?: DeckInstance | null;
  onSaved: (savedInstance: DeckInstance) => void;
}

export const InstanceModal: React.FC<InstanceModalProps> = ({
  isOpen,
  onClose,
  instanceToEdit,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['N5']);
  const [dailyNewLimit, setDailyNewLimit] = useState(15);
  const [dailyReviewLimit, setDailyReviewLimit] = useState(100);
  const [displaySettings, setDisplaySettings] = useState<CardDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);

  useEffect(() => {
    if (instanceToEdit) {
      setName(instanceToEdit.name);
      setDescription(instanceToEdit.description);
      setSelectedLevels(instanceToEdit.jlptLevels);
      setDailyNewLimit(instanceToEdit.dailyNewLimit);
      setDailyReviewLimit(instanceToEdit.dailyReviewLimit);
      setDisplaySettings(instanceToEdit.displaySettings || DEFAULT_DISPLAY_SETTINGS);
    } else {
      setName('Custom JLPT Study Deck');
      setDescription('Custom Kanji instance tailored for my study goals.');
      setSelectedLevels(['N5']);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newInstance: DeckInstance = {
      id: instanceToEdit ? instanceToEdit.id : `instance_${Date.now()}`,
      name,
      description,
      jlptLevels: selectedLevels,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">
                {instanceToEdit ? 'Configure Study Instance' : 'Create New Deck Instance'}
              </h3>
              <p className="text-xs text-gray-400">
                Filter Kanji by JLPT level & customize exact card field visibility.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Name & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Instance Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm transition"
                placeholder="e.g., N5 & N4 Core Kanji"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm transition"
                placeholder="Brief summary of study targets..."
              />
            </div>
          </div>

          {/* JLPT Levels Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
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
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-800/40 border-slate-700 text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{lvl}</span>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Selected levels: <span className="text-indigo-400 font-semibold">{selectedLevels.join(', ')}</span>
            </p>
          </div>

          {/* Daily Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Daily New Cards Limit
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={dailyNewLimit}
                onChange={(e) => setDailyNewLimit(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Daily Reviews Limit
              </label>
              <input
                type="number"
                min="5"
                max="1000"
                value={dailyReviewLimit}
                onChange={(e) => setDailyReviewLimit(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Display Settings Quick Summary */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Card Face Customization
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  You can toggle Koohii mnemonics, stroke animations, Onyomi/Kunyomi, and meanings on Front/Back during study anytime!
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/30 transition transform hover:scale-105 active:scale-95"
            >
              {instanceToEdit ? 'Save Changes' : 'Create Instance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

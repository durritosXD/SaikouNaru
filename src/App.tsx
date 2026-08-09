import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  initializeDatabase,
  getAllCards,
  getAllDeckInstances,
  getAllSRSRecordsForInstance,
  getAllReviewLogs,
  saveDeckInstance,
  deleteDeckInstance
} from './services/db';
import { AnyCard, KanjiCard, DeckInstance, SRSRecord, ReviewLog, CardDisplaySettings } from './types';
import { Navbar } from './components/Navbar';
import { DeckLandingPage } from './components/DeckLandingPage';
import { StudySession } from './components/StudySession';
import { StrokeCanvas } from './components/StrokeCanvas';
import { KanjiExplorer } from './components/KanjiExplorer';
import { GrammarVocabExplorer } from './components/GrammarVocabExplorer';
import { AnalyticsView } from './components/AnalyticsView';
import { InstanceModal } from './components/InstanceModal';
import { DictionaryView } from './components/DictionaryView';
import { CardDisplayDrawer } from './components/CardDisplayDrawer';
import { ImportModal } from './components/ImportModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { MobileBottomNav } from './components/MobileBottomNav';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'study' | 'canvas' | 'explorer' | 'grammarVocab' | 'analytics' | 'dictionary'>('home');
  const [theme, setTheme] = useState<'dark' | 'pink'>('dark');
  
  const [cards, setCards] = useState<AnyCard[]>([]);
  const [instances, setInstances] = useState<DeckInstance[]>([]);
  const [activeInstance, setActiveInstance] = useState<DeckInstance | null>(null);
  const [srsRecords, setSrsRecords] = useState<Map<string, SRSRecord>>(new Map());
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);

  // Filter kanji-only cards for components that strictly require KanjiCard (StrokeCanvas, KanjiExplorer)
  const kanjiCards = useMemo(() => {
    return cards.filter(c => c.type === 'kanji') as KanjiCard[];
  }, [cards]);

  // Modals state
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [instanceToEdit, setInstanceToEdit] = useState<DeckInstance | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Load database & data
  const loadData = useCallback(async () => {
    try {
      await initializeDatabase();
      const allCards = await getAllCards();
      const allInstances = await getAllDeckInstances();
      const logs = await getAllReviewLogs();

      setCards(allCards);
      setInstances(allInstances);
      setReviewLogs(logs);

      if (allInstances.length > 0) {
        const current = activeInstance
          ? allInstances.find(i => i.id === activeInstance.id) || allInstances[0]
          : allInstances[0];
        
        setActiveInstance(current);

        // Fetch SRS records for active instance
        const records = await getAllSRSRecordsForInstance(current.id);
        const map = new Map<string, SRSRecord>();
        records.forEach(r => map.set(r.cardId, r));
        setSrsRecords(map);
      }
    } catch (err) {
      console.error('Error initializing database:', err);
    } finally {
      setLoading(false);
    }
  }, [activeInstance]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (theme === 'pink') {
      document.documentElement.classList.add('theme-pink');
    } else {
      document.documentElement.classList.remove('theme-pink');
    }
  }, [theme]);

  const handleSelectInstance = async (inst: DeckInstance) => {
    setActiveInstance(inst);
    const records = await getAllSRSRecordsForInstance(inst.id);
    const map = new Map<string, SRSRecord>();
    records.forEach(r => map.set(r.cardId, r));
    setSrsRecords(map);
  };

  const refreshRecords = async () => {
    if (!activeInstance) return;
    const records = await getAllSRSRecordsForInstance(activeInstance.id);
    const map = new Map<string, SRSRecord>();
    records.forEach(r => map.set(r.cardId, r));
    setSrsRecords(map);
    const logs = await getAllReviewLogs();
    setReviewLogs(logs);
  };

  const handleSaveDisplaySettings = async (newSettings: CardDisplaySettings) => {
    if (!activeInstance) return;
    const updated = {
      ...activeInstance,
      displaySettings: newSettings,
    };
    setActiveInstance(updated);
    // Save instance update
    await saveDeckInstance(updated);
    // Refresh instances list
    const all = await getAllDeckInstances();
    setInstances(all);
  };

  const handleDeleteInstance = async (id: string) => {
    await deleteDeckInstance(id);
    const updatedInstances = await getAllDeckInstances();
    setInstances(updatedInstances);
    if (activeInstance?.id === id) {
      if (updatedInstances.length > 0) {
        setActiveInstance(updatedInstances[0]);
      } else {
        setActiveInstance(null);
      }
    }
    await refreshRecords();
  };

  // Calculate streak based on reviewLogs
  const streak = React.useMemo(() => {
    if (reviewLogs.length === 0) return 0;
    const uniqueDays = new Set(
      reviewLogs.map(l => new Date(l.timestamp).toISOString().split('T')[0])
    );
    return uniqueDays.size;
  }, [reviewLogs]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-bg text-theme-text p-6">
        <div className="w-12 h-12 border-4 border-theme-border border-t-white rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-mono font-bold tracking-wider">Loading SaikouNaru...</h2>
        <p className="text-xs text-gray-500 mt-1 font-jp">最高成 Japanese SRS Studio</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text nothing-dot-bg font-sans selection:bg-white selection:text-black transition-colors duration-300">
      {/* PWA Install Popup */}
      <PwaInstallPrompt />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        instances={instances}
        activeInstance={activeInstance}
        onSelectInstance={handleSelectInstance}
        onOpenCreateInstance={() => {
          setInstanceToEdit(null);
          setIsInstanceModalOpen(true);
        }}
        onOpenEditInstance={() => {
          setInstanceToEdit(activeInstance);
          setIsInstanceModalOpen(true);
        }}
        onOpenImport={() => setIsImportOpen(true)}
        streak={streak}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <DeckLandingPage
            instances={instances}
            cards={cards}
            srsRecords={srsRecords}
            onSelectInstance={(inst) => {
              handleSelectInstance(inst);
              setActiveTab('study');
            }}
            onOpenCreateInstance={() => {
              setInstanceToEdit(null);
              setIsInstanceModalOpen(true);
            }}
            onOpenEditInstance={(inst) => {
              setInstanceToEdit(inst);
              setIsInstanceModalOpen(true);
            }}
            onDeleteInstance={handleDeleteInstance}
            streak={streak}
            theme={theme}
          />
        )}

        {activeTab === 'study' && activeInstance && (
          <StudySession
            cards={cards}
            activeInstance={activeInstance}
            srsRecords={srsRecords}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
            onRefreshRecords={refreshRecords}
            onExitSession={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'grammarVocab' && (
          <GrammarVocabExplorer cards={cards} />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryView />
        )}

        {activeTab === 'canvas' && (
          <StrokeCanvas cards={kanjiCards} />
        )}

        {activeTab === 'explorer' && (
          <KanjiExplorer cards={kanjiCards} />
        )}

        {activeTab === 'analytics' && activeInstance && (
          <AnalyticsView
            cards={kanjiCards}
            activeInstance={activeInstance}
            srsRecords={srsRecords}
            reviewLogs={reviewLogs}
            streak={streak}
          />
        )}
      </main>

      {/* Instance Create / Edit Modal */}
      <InstanceModal
        isOpen={isInstanceModalOpen}
        onClose={() => setIsInstanceModalOpen(false)}
        instanceToEdit={instanceToEdit}
        onSaved={async (savedInstance) => {
          await loadData();
          handleSelectInstance(savedInstance);
        }}
        onDelete={handleDeleteInstance}
      />

      {/* Live Card Display Customization Drawer */}
      {activeInstance && (
        <CardDisplayDrawer
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
          settings={activeInstance.displaySettings}
          onSave={handleSaveDisplaySettings}
        />
      )}

      {/* Custom Deck Importer Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={loadData}
      />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

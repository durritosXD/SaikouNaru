import React, { useState, useEffect, useCallback } from 'react';
import {
  initializeDatabase,
  getAllCards,
  getAllDeckInstances,
  getAllSRSRecordsForInstance,
  getAllReviewLogs,
  saveDeckInstance
} from './services/db';
import { KanjiCard, DeckInstance, SRSRecord, ReviewLog, CardDisplaySettings } from './types';
import { Navbar } from './components/Navbar';
import { DeckLandingPage } from './components/DeckLandingPage';
import { StudySession } from './components/StudySession';
import { StrokeCanvas } from './components/StrokeCanvas';
import { KanjiExplorer } from './components/KanjiExplorer';
import { AnalyticsView } from './components/AnalyticsView';
import { InstanceModal } from './components/InstanceModal';
import { CardDisplayDrawer } from './components/CardDisplayDrawer';
import { ImportModal } from './components/ImportModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { MobileBottomNav } from './components/MobileBottomNav';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'study' | 'canvas' | 'explorer' | 'analytics'>('home');
  
  const [cards, setCards] = useState<KanjiCard[]>([]);
  const [instances, setInstances] = useState<DeckInstance[]>([]);
  const [activeInstance, setActiveInstance] = useState<DeckInstance | null>(null);
  const [srsRecords, setSrsRecords] = useState<Map<string, SRSRecord>>(new Map());
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F19] text-white">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-3xl font-jp font-extrabold shadow-2xl animate-pulse">
          成
        </div>
        <h2 className="text-xl font-extrabold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-400">
          SaikouNaru <span className="text-sm font-normal text-indigo-300">最高成</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">Initializing 3,000 Kanji SRS Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-100">
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
            streak={streak}
          />
        )}

        {activeTab === 'study' && activeInstance && (
          <StudySession
            cards={cards}
            activeInstance={activeInstance}
            srsRecords={srsRecords}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
            onRefreshRecords={refreshRecords}
          />
        )}

        {activeTab === 'canvas' && (
          <StrokeCanvas cards={cards} />
        )}

        {activeTab === 'explorer' && (
          <KanjiExplorer cards={cards} />
        )}

        {activeTab === 'analytics' && activeInstance && (
          <AnalyticsView
            cards={cards}
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

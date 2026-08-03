import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw, Eye, EyeOff, Play, Volume2, Sparkles } from 'lucide-react';
import { KanjiCard } from '../types';

interface StrokeCanvasProps {
  cards: KanjiCard[];
}

export const StrokeCanvas: React.FC<StrokeCanvasProps> = ({ cards }) => {
  const [selectedKanjiIndex, setSelectedKanjiIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#6366f1');
  const [strokeWidth, setStrokeWidth] = useState(12);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentCard = cards[selectedKanjiIndex] || cards[0];

  useEffect(() => {
    clearCanvas();
  }, [selectedKanjiIndex]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const playAudio = () => {
    if (!currentCard || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentCard.kanji);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          Kanji Stroke Drawing Studio
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Practice muscle memory and stroke order for Japanese Kanji.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Drawing Canvas Area */}
        <div className="flex flex-col items-center">
          <div className="relative w-[320px] h-[320px] bg-slate-900 border-2 border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl">
            {/* Background Grid Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 stroke-indigo-400 stroke-dasharray">
              <line x1="160" y1="0" x2="160" y2="320" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="320" y2="160" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="0" x2="320" y2="320" strokeWidth="1" strokeDasharray="2 4" />
              <line x1="320" y1="0" x2="0" y2="320" strokeWidth="1" strokeDasharray="2 4" />
            </svg>

            {/* Translucent Guide Kanji */}
            {showGuide && currentCard && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[200px] font-jp font-bold text-indigo-500/20 leading-none">
                  {currentCard.kanji}
                </span>
              </div>
            )}

            {/* Drawing Canvas Layer */}
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />
          </div>

          {/* Canvas Controls */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              Clear Canvas
            </button>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              {showGuide ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              {showGuide ? 'Hide Template' : 'Show Template'}
            </button>
          </div>
        </div>

        {/* Kanji Reference & Stroke GIF Guide */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Target Kanji ({selectedKanjiIndex + 1} of {cards.length})
            </span>
            <button
              onClick={playAudio}
              className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 hover:bg-indigo-500/20 transition"
              title="Pronounce Kanji"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-6xl font-jp font-bold text-white">{currentCard?.kanji}</h1>
            <div>
              <h3 className="text-xl font-bold text-indigo-300">{currentCard?.keyword}</h3>
              <p className="text-xs text-gray-400">
                JLPT {currentCard?.jlpt} • RTK #{currentCard?.rtkNum}
              </p>
            </div>
          </div>

          {/* Stroke GIF Reference */}
          {currentCard?.strokeGif && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Animated Stroke Order Guide
              </span>
              <img
                src={`/strokes/${currentCard.strokeGif}`}
                alt={`${currentCard.kanji} stroke order animation`}
                className="w-32 h-32 object-contain invert brightness-200"
                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
              />
            </div>
          )}

          {/* Next / Prev Card Navigator */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setSelectedKanjiIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedKanjiIndex === 0}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition"
            >
              Previous Kanji
            </button>
            <button
              onClick={() => setSelectedKanjiIndex(prev => Math.min(cards.length - 1, prev + 1))}
              disabled={selectedKanjiIndex === cards.length - 1}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
            >
              Next Kanji
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

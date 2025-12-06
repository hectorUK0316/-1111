import React, { useState } from 'react';
import { generateLuxuryWish } from '../services/geminiService';
import { WishData, TreeMorphState } from '../types';

interface OverlayProps {
  morphState: TreeMorphState;
  setMorphState: (state: TreeMorphState) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ morphState, setMorphState }) => {
  const [wish, setWish] = useState<WishData | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  const handleGenerateWish = async () => {
    setLoading(true);
    const data = await generateLuxuryWish();
    setWish(data);
    setLoading(false);
  };

  const toggleMorph = () => {
    setMorphState(
      morphState === TreeMorphState.TREE_SHAPE 
        ? TreeMorphState.SCATTERED 
        : TreeMorphState.TREE_SHAPE
    );
  };

  if (!visible) {
    return (
      <button 
        onClick={() => setVisible(true)}
        className="absolute bottom-8 right-8 text-white/50 hover:text-white transition-colors z-20"
      >
        Show Controls
      </button>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-16 z-10">
      {/* Header */}
      <header className="flex justify-between items-start pointer-events-auto">
        <div className="text-left group">
          <h1 className="font-cinzel text-3xl md:text-5xl text-red-500 tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            MERRY
          </h1>
          <p className="font-cinzel text-yellow-400 text-xl md:text-3xl tracking-[0.2em] mt-1 pl-1 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            CHRISTMAS
          </p>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-3"></div>
          <p className="font-serif-luxury text-emerald-100/80 text-lg md:text-xl tracking-wide italic">
            For Mountain Zhou
          </p>
        </div>
        
        <button 
            onClick={() => setVisible(false)}
            className="text-white/30 hover:text-white transition-colors text-sm"
        >
            Hide Interface
        </button>
      </header>

      {/* Middle Content - Generated Wish */}
      <div className="flex-1 flex items-center justify-center md:justify-end pointer-events-none">
        {wish && (
          <div className="pointer-events-auto max-w-md bg-black/40 backdrop-blur-md border border-yellow-500/20 p-8 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all duration-700 animate-in fade-in slide-in-from-bottom-10">
            <div className="flex justify-center mb-4">
               <div className="w-1 h-8 bg-gradient-to-b from-transparent via-yellow-500 to-transparent opacity-50"></div>
            </div>
            <h2 className="font-serif-luxury text-2xl text-yellow-100 mb-4 text-center italic">
              {wish.title}
            </h2>
            <p className="font-sans text-emerald-50/80 leading-relaxed text-center font-light tracking-wide">
              {wish.body}
            </p>
             <div className="mt-6 flex justify-center">
               <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <footer className="pointer-events-auto flex flex-col items-end md:flex-row md:items-center justify-end gap-6 w-full">
        <div className="flex gap-4">
            {/* Morph Toggle */}
            <button
                onClick={toggleMorph}
                className="group relative px-6 py-3 border border-emerald-500/30 hover:border-emerald-400/80 bg-emerald-950/30 backdrop-blur-sm transition-all duration-300"
            >
                <span className="font-cinzel text-xs tracking-widest text-emerald-100 group-hover:text-white transition-colors">
                    {morphState === TreeMorphState.TREE_SHAPE ? 'DECONSTRUCT' : 'ASSEMBLE'}
                </span>
            </button>

            {/* Wish Generator */}
            <button
            onClick={handleGenerateWish}
            disabled={loading}
            className={`
                group relative px-8 py-3 overflow-hidden bg-transparent transition-all duration-300
                border border-yellow-500/30 hover:border-yellow-500/80
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
            >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-900/0 via-emerald-800/30 to-emerald-900/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            <span className={`relative font-cinzel text-sm tracking-widest ${loading ? 'text-yellow-500/50' : 'text-yellow-500'} group-hover:text-yellow-300 transition-colors`}>
                {loading ? 'Consulting Stars...' : 'Reveal Blessing'}
            </span>
            </button>
        </div>
      </footer>
    </div>
  );
};
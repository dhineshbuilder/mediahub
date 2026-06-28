'use client';

import { useState, useEffect } from 'react';
import { MediaFormat } from '../types/media';
import { Video, Music, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface FormatSelectorProps {
  formats: MediaFormat[];
  selected: MediaFormat | null;
  onSelect: (fmt: MediaFormat) => void;
}

type TabType = 'video' | 'audio';

export function FormatSelector({ formats, selected, onSelect }: FormatSelectorProps) {
  // Determine if we actually have audio-only formats
  const hasAudioFormats = formats.some((f) => f.type === 'audio');
  
  // Default to video tab
  const [activeTab, setActiveTab] = useState<TabType>('video');

  // Filter formats based on active tab
  const filteredFormats = formats.filter((fmt) => {
    if (activeTab === 'video') return fmt.type === 'both';
    if (activeTab === 'audio') return fmt.type === 'audio';
    return true;
  });

  // Auto-select the first format if the user switches tabs and their selection is now hidden
  useEffect(() => {
    if (filteredFormats.length > 0) {
      const isSelectedInView = filteredFormats.some(
        (f) => f.quality === selected?.quality && f.type === selected?.type
      );
      if (!isSelectedInView) {
        onSelect(filteredFormats[0]);
      }
    }
  }, [activeTab, formats]); // Intentionally omitting `selected` and `onSelect` to prevent infinite loops on selection change

  if (!formats || formats.length === 0) {
    return (
      <div className="text-sm text-zinc-500 italic p-3 border border-dashed border-zinc-800 rounded-xl text-center">
        No specific formats available. Default streaming will be used.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Choose Format
        </label>

        {hasAudioFormats && (
          <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors z-10 ${
                activeTab === 'video' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video
              {activeTab === 'video' && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-primary/80 rounded-md -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors z-10 ${
                activeTab === 'audio' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              Audio
              {activeTab === 'audio' && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-primary/80 rounded-md -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-2 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredFormats.map((fmt, idx) => {
          const isSelected = selected?.quality === fmt.quality && selected?.type === fmt.type;
          const isAudio = fmt.type === 'audio';

          return (
            <button
              key={`${fmt.quality}-${fmt.type}-${idx}`}
              type="button"
              onClick={() => onSelect(fmt)}
              className={`w-full text-left rounded-xl px-4 py-3 border flex items-center justify-between transition-all duration-200 backdrop-blur-md ${
                isSelected
                  ? 'border-primary bg-primary/10 text-white dark:text-white light:text-primary shadow-md shadow-primary/5'
                  : 'border-borderDark/30 dark:border-borderDark/30 light:border-borderLight hover:border-zinc-700 bg-cardDark/30 dark:bg-cardDark/30 light:bg-zinc-50/50 hover:bg-cardDark/50 text-zinc-300 dark:text-zinc-300 light:text-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${
                  isSelected 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isAudio ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">
                    {fmt.quality}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium font-mono uppercase mt-0.5">
                    {fmt.ext} - {fmt.type === 'both' ? 'Video + Audio' : 'Audio Only'}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="p-1 rounded-full bg-primary text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
        {filteredFormats.length === 0 && (
          <div className="text-xs text-zinc-500 italic p-3 text-center">
            No formats available in this category.
          </div>
        )}
      </div>
    </div>
  );
}
export default FormatSelector;

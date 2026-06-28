'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface ThumbnailProps {
  src: string;
  title: string;
  duration?: string;
}

export function Thumbnail({ src, title, duration }: ThumbnailProps) {
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 border border-borderDark/40 dark:border-borderDark/40 light:border-borderLight group flex-shrink-0">
      {error ? (
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-zinc-900 to-secondary/20 flex flex-col items-center justify-center p-4">
          <Play className="w-12 h-12 text-primary opacity-60 mb-2" />
          <span className="text-xs text-zinc-500 text-center font-medium">Preview Thumbnail</span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={title}
          onError={() => setError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Hover overlay shadow play button */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-2xl transition-transform duration-300 scale-90 group-hover:scale-100">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>

      {/* Duration Badge */}
      {duration && duration !== 'Unknown' && (
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold rounded bg-black/75 text-white border border-white/10 tracking-wide font-mono">
          {duration}
        </div>
      )}
    </div>
  );
}
export default Thumbnail;

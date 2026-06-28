'use client';

import { Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DownloadButtonProps {
  onClick: () => void;
  downloading: boolean;
  progress: number;
}

export function DownloadButton({ onClick, downloading, progress }: DownloadButtonProps) {
  return (
    <div className="w-full relative">
      <motion.button
        whileHover={!downloading ? { scale: 1.01 } : {}}
        whileTap={!downloading ? { scale: 0.99 } : {}}
        type="button"
        disabled={downloading}
        onClick={onClick}
        className={`relative overflow-hidden w-full flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-xl text-white shadow-xl transition-all duration-300 ${
          downloading
            ? 'bg-zinc-800 cursor-not-allowed shadow-none border border-zinc-700/50'
            : 'bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-primary/20 hover:shadow-2xl'
        }`}
      >
        {/* Progress Background Overlay */}
        {downloading && (
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary/20 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>
                {progress > 0 ? `Downloading: ${progress}%` : 'Processing Stream...'}
              </span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-white" />
              <span>Download Media</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  );
}
export default DownloadButton;

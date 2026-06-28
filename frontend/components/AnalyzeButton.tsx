'use client';

import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

interface AnalyzeButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

export function AnalyzeButton({ onClick, loading, disabled }: AnalyzeButtonProps) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl text-white shadow-xl bg-gradient-to-r from-primary to-secondary transition-all duration-300 ${
        disabled || loading
          ? 'opacity-60 cursor-not-allowed shadow-none'
          : 'hover:shadow-primary/30 hover:shadow-2xl'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 text-white" />
          <span>Analyze Video</span>
        </>
      )}
    </motion.button>
  );
}
export default AnalyzeButton;

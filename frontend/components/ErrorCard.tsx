'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card w-full max-w-xl mx-auto rounded-2xl p-6 md:p-8 mt-12 shadow-xl border-red-500/20 text-center relative z-10"
    >
      <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-5 border border-red-500/20">
        <AlertTriangle className="w-6 h-6 animate-pulse" />
      </div>

      <h3 className="text-lg font-bold text-white dark:text-white light:text-zinc-900 mb-2">
        Analysis Error
      </h3>
      
      <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-600 leading-relaxed mb-6 max-w-sm mx-auto">
        {message || 'An unexpected failure occurred while connecting to the extraction endpoint.'}
      </p>

      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Clear & Retry
        </motion.button>
      )}
    </motion.div>
  );
}
export default ErrorCard;

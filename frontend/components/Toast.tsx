'use client';

import { useToast } from '../hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((t) => {
          let Icon = Info;
          let colorClass = 'border-blue-500/30 bg-blue-950/20 text-blue-400';
          
          if (t.type === 'success') {
            Icon = CheckCircle2;
            colorClass = 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400';
          } else if (t.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'border-red-500/30 bg-red-950/20 text-red-400';
          }

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto w-full rounded-xl border p-4 shadow-xl backdrop-blur-md flex items-start gap-3 glass-card ${colorClass}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-sm font-semibold tracking-tight text-white dark:text-white light:text-zinc-900">
                  {t.title}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 leading-normal">
                  {t.description}
                </span>
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-zinc-500 hover:text-white dark:hover:text-white light:hover:text-zinc-950 flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
export default ToastContainer;

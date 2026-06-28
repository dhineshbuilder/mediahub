'use client';

import { ChangeEvent, KeyboardEvent, useState } from 'react';
import { Link2, X, Clipboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface URLInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function URLInput({ value, onChange, onSubmit, disabled }: URLInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    if (disabled) return;
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch {
      // Clipboard API block fallback
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="w-full relative">
      {/* Background glow when focused */}
      <div
        className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary opacity-30 blur-lg transition-all duration-300 ${
          isFocused ? 'scale-100 opacity-50' : 'scale-95 opacity-0'
        }`}
      />

      <div
        className={`relative w-full rounded-xl flex items-center glass-input transition-all duration-300 py-1.5 px-4 ${
          isFocused ? 'ring-2 ring-primary border-transparent' : 'border-zinc-800'
        }`}
      >
        <Link2 className="w-5 h-5 text-zinc-500 mr-3 flex-shrink-0" />
        
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Paste public video or audio link here (YouTube, Instagram, TikTok...)"
          className="w-full bg-transparent border-none outline-none py-2 text-base text-white dark:text-white light:text-zinc-900 placeholder-zinc-500"
        />

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => onChange('')}
              disabled={disabled}
              className="p-1 rounded-lg text-zinc-500 hover:text-white dark:hover:text-white light:hover:text-zinc-900 mr-2 flex-shrink-0"
              type="button"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePaste}
          disabled={disabled}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 light:bg-zinc-100 light:hover:bg-zinc-200 text-zinc-300 dark:text-zinc-300 light:text-zinc-600 transition-colors flex-shrink-0"
        >
          <Clipboard className="w-3.5 h-3.5" />
          Paste
        </motion.button>
      </div>
    </div>
  );
}
export default URLInput;

'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
}

export function FeatureCard({ title, description, Icon }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass-card rounded-2xl p-6 shadow-xl relative overflow-hidden group border-borderDark/20 hover:border-primary/30"
    >
      {/* Glow highlight */}
      <div className="absolute -inset-10 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

      <div className="p-3 w-fit rounded-xl bg-gradient-to-tr from-primary/10 to-secondary/10 dark:from-primary/10 dark:to-secondary/10 light:from-zinc-100 light:to-zinc-200 text-primary mb-5 flex items-center justify-center border border-primary/20">
        <Icon className="w-5 h-5" />
      </div>

      <h4 className="text-base font-bold text-white dark:text-white light:text-zinc-900 mb-2">
        {title}
      </h4>
      
      <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-550 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
export default FeatureCard;

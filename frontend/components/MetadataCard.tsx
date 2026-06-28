'use client';

import { User, Clock } from 'lucide-react';
import PlatformBadge from './PlatformBadge';

interface MetadataCardProps {
  title: string;
  uploader: string;
  duration: string;
  platform: string;
}

export function MetadataCard({ title, uploader, duration, platform }: MetadataCardProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <PlatformBadge platform={platform} />
      </div>

      <h3 className="text-xl md:text-2xl font-bold leading-snug tracking-tight text-white dark:text-white light:text-zinc-900">
        {title}
      </h3>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-1 text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500">
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4 text-primary" />
          <span className="font-semibold">{uploader}</span>
        </div>
        
        {duration && duration !== 'Unknown' && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-secondary" />
            <span>{duration}</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default MetadataCard;

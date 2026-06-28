'use client';

import { 
  Youtube, 
  Instagram, 
  Facebook, 
  Twitter, 
  Music2, 
  MessageSquareCode, 
  Bookmark, 
  Tv, 
  Video, 
  Globe 
} from 'lucide-react';

interface PlatformBadgeProps {
  platform: string;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const norm = platform.toLowerCase();

  let styles = 'bg-zinc-800 text-zinc-300 border-zinc-700/50';
  let Icon = Globe;
  let displayName = platform;

  if (norm.includes('youtube')) {
    styles = 'bg-red-500/10 text-red-400 border-red-500/30';
    Icon = Youtube;
    displayName = 'YouTube';
  } else if (norm.includes('instagram')) {
    styles = 'bg-pink-500/10 text-pink-400 border-pink-500/30';
    Icon = Instagram;
    displayName = 'Instagram';
  } else if (norm.includes('facebook')) {
    styles = 'bg-blue-600/10 text-blue-400 border-blue-600/30';
    Icon = Facebook;
    displayName = 'Facebook';
  } else if (norm.includes('twitter') || norm === 'x') {
    styles = 'bg-zinc-800 text-zinc-200 border-zinc-700';
    Icon = Twitter;
    displayName = 'Twitter / X';
  } else if (norm.includes('tiktok')) {
    styles = 'bg-teal-500/10 text-teal-400 border-teal-500/30';
    Icon = Music2;
    displayName = 'TikTok';
  } else if (norm.includes('reddit')) {
    styles = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    Icon = MessageSquareCode;
    displayName = 'Reddit';
  } else if (norm.includes('pinterest')) {
    styles = 'bg-red-600/10 text-red-500 border-red-600/30';
    Icon = Bookmark;
    displayName = 'Pinterest';
  } else if (norm.includes('threads')) {
    styles = 'bg-zinc-800 text-white border-zinc-700';
    Icon = Globe;
    displayName = 'Threads';
  } else if (norm.includes('vimeo')) {
    styles = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    Icon = Video;
    displayName = 'Vimeo';
  } else if (norm.includes('dailymotion')) {
    styles = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    Icon = Tv;
    displayName = 'Dailymotion';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles} backdrop-blur-md`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{displayName}</span>
    </div>
  );
}
export default PlatformBadge;

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, Download, Wand2 } from 'lucide-react';

export function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on path changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Platforms', href: '/#platforms' },
    { name: 'Features', href: '/#features' },
    { name: 'FAQ', href: '/#faq' },
  ];

  const tools = [
    {
      name: 'Media Downloader',
      description: 'Download video & audio from links.',
      href: '/downloader',
      icon: Download,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    },
    {
      name: 'AI Subtitle Generator',
      description: 'Transcribe audio tracks with AI.',
      href: '/caption',
      icon: Wand2,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    }
  ];

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-6 z-50 w-full max-w-3xl mx-auto px-4"
    >
      <div className="glass-card w-full rounded-full px-6 py-3 flex items-center justify-between shadow-2xl border border-white/10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent group-hover:text-white transition-colors duration-250">
            MediaHub
          </span>
        </Link>

        {/* Navigation links & Tools Dropdown */}
        <nav className="flex items-center gap-6 text-sm font-semibold text-zinc-400">
          {/* Tools Menu Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onMouseEnter={() => setIsDropdownOpen(true)}
              className="flex items-center gap-1 hover:text-white transition-colors py-1 cursor-pointer focus:outline-none"
            >
              <span>Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-250 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 mt-4 w-72 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-1">
                    {tools.map((t) => {
                      const IconComp = t.icon;
                      return (
                        <Link key={t.name} href={t.href}>
                          <span className="flex items-start gap-3 rounded-xl p-3 hover:bg-white/5 transition-colors cursor-pointer text-left group">
                            <div className={`p-2 rounded-lg border flex items-center justify-center flex-shrink-0 ${t.color}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-white group-hover:text-primary transition-colors">
                                {t.name}
                              </span>
                              <span className="block text-[10px] text-zinc-500 mt-0.5">
                                {t.description}
                              </span>
                            </div>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section Anchors */}
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <span className="hover:text-white transition-colors py-1 cursor-pointer">
                {link.name}
              </span>
            </Link>
          ))}
        </nav>

        {/* Small spacer or layout balancer for symmetric layout */}
        <div className="w-8 h-8 flex items-center justify-center opacity-0 pointer-events-none select-none">
          <Layers className="w-4 h-4" />
        </div>
      </div>
    </motion.header>
  );
}

export default Navbar;

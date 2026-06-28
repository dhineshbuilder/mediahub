'use client';

import { Layers } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-borderDark/40 dark:border-borderDark/40 light:border-borderLight bg-bgDark dark:bg-bgDark light:bg-zinc-50 py-12 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Info Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white dark:text-white light:text-zinc-900">
              MediaHub
            </span>
          </div>
          <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 leading-relaxed">
            Stateless, high-speed downloader and preview analyzer for multiple online video/audio platforms. Built for efficiency.
          </p>
        </div>

        {/* Column 2 - Supported */}
        <div>
          <h4 className="text-sm font-semibold text-white dark:text-white light:text-zinc-900 mb-4 uppercase tracking-wider">
            Platforms
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500">
            <li>YouTube & Vimeo</li>
            <li>Instagram & Threads</li>
            <li>Facebook & Twitter/X</li>
            <li>TikTok & Dailymotion</li>
          </ul>
        </div>

        {/* Column 3 - Features */}
        <div>
          <h4 className="text-sm font-semibold text-white dark:text-white light:text-zinc-900 mb-4 uppercase tracking-wider">
            Product
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500">
            <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
          </ul>
        </div>

        {/* Column 4 - Legal */}
        <div>
          <h4 className="text-sm font-semibold text-white dark:text-white light:text-zinc-900 mb-4 uppercase tracking-wider">
            Legal
          </h4>
          <ul className="flex flex-col gap-2 text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 font-medium">
            <li>Terms of Service</li>
            <li>Privacy Policy</li>
            <li>DMCA Compliance</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-borderDark/20 dark:border-borderDark/20 light:border-borderLight/60 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} MediaHub. All rights reserved.</p>
        <p>Disclaimer: This tool is intended for educational purposes only. Downloading copyrighted media without authorization is prohibited.</p>
      </div>
    </footer>
  );
}
export default Footer;

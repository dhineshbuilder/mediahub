'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Download, 
  Wand2, 
  Sparkles, 
  ArrowRight, 
  Layers,
  Flame,
  Zap,
  ShieldCheck,
  Infinity as InfinityIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import FAQ from '../components/FAQ';

export default function Home() {
  const platforms = [
    { name: 'YouTube', icon: '🔴', desc: 'Videos & Shorts' },
    { name: 'Instagram', icon: '📸', desc: 'Reels & Stories' },
    { name: 'TikTok', icon: '🎵', desc: 'Trending Videos' },
    { name: 'Reddit', icon: '🤖', desc: 'Public Media' },
    { name: 'Facebook', icon: '👥', desc: 'Watch Streams' },
    { name: 'Twitter/X', icon: '🐦', desc: 'Feed Clips' },
    { name: 'Pinterest', icon: '📌', desc: 'Video Pins' },
    { name: 'Threads', icon: '💬', desc: 'Threads Posts' },
    { name: 'Vimeo', icon: '📹', desc: 'Creative Videos' },
    { name: 'Dailymotion', icon: '📺', desc: 'Trending Content' },
    { name: 'Audio Files', icon: '🎙️', desc: 'MP3, WAV, M4A for AI' },
  ];

  const tools = [
    {
      title: 'Media Downloader',
      description: 'Scrape metadata and extract high-speed video or audio streams from popular video sites.',
      href: '/downloader',
      icon: Download,
      gradient: 'from-blue-500 to-indigo-600',
      badge: 'High Speed',
      actionText: 'Launch Downloader'
    },
    {
      title: 'AI Subtitle Generator',
      description: 'Upload audio files and transcribe speeches to generate clean captions in SRT, VTT, or TXT formats.',
      href: '/caption',
      icon: Wand2,
      gradient: 'from-purple-500 to-pink-600',
      badge: 'Powered by AI',
      actionText: 'Generate Captions'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen text-white transition-colors duration-300">
      {/* Upgraded Navigation Header */}
      <Navbar />

      {/* Main Catalog View */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full max-w-5xl mx-auto px-4 pt-16 pb-12 flex flex-col items-center text-center">
          {/* Stateless tag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 backdrop-blur-md mb-6"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Stateless Media Processing Suite</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-3xl bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent"
          >
            Choose a High-Performance <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Media Processing Tool
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-zinc-400 dark:text-zinc-400 light:text-zinc-550 max-w-xl mt-6 leading-relaxed"
          >
            Select a specialized utility below to begin scraping, formatting, transcribing, or downloading media content instantly.
          </motion.p>
        </section>

        {/* Tools Grid Section */}
        <section className="max-w-5xl mx-auto px-4 py-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tools.map((t, idx) => {
              const IconComp = t.icon;
              return (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-borderDark/30 dark:border-borderDark/30 light:border-borderLight bg-cardDark/30 dark:bg-cardDark/30 light:bg-white p-6 md:p-8 shadow-2xl backdrop-blur-xl hover:border-primary/50 transition-all duration-300"
                >
                  <div>
                    {/* Badge */}
                    <div className="absolute top-6 right-6 inline-flex items-center rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                      {t.badge}
                    </div>

                    {/* Gradient Icon Wrapper */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${t.gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
                      <IconComp className="w-5 h-5" />
                    </div>

                    <h3 className="text-xl font-bold text-white dark:text-white light:text-zinc-900 mb-3 tracking-tight">
                      {t.title}
                    </h3>
                    <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-650 leading-relaxed mb-8">
                      {t.description}
                    </p>
                  </div>

                  <Link href={t.href} className="w-full">
                    <motion.span
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-white transition-all cursor-pointer shadow-md"
                    >
                      <span>{t.actionText}</span>
                      <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </motion.span>
                  </Link>
                </motion.div>
              );
            })}

            {/* Coming Soon Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="relative flex flex-col justify-between rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/20 p-6 md:p-8 shadow-sm backdrop-blur-xl"
            >
              <div>
                {/* Badge */}
                <div className="absolute top-6 right-6 inline-flex items-center rounded-full bg-zinc-950 border border-zinc-900 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-zinc-650 uppercase">
                  Upcoming
                </div>

                {/* Neutral Icon Wrapper */}
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-500 mb-6">
                  <Sparkles className="w-5 h-5 text-zinc-500" />
                </div>

                <h3 className="text-xl font-bold text-zinc-550 mb-3 tracking-tight">
                  Request a Tool
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 light:text-zinc-400 leading-relaxed mb-8">
                  We are actively building more utilities. Submit ideas or request specialized integrations for your workflow.
                </p>
              </div>

              <div className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl bg-zinc-950/40 border border-zinc-900 text-zinc-600 cursor-not-allowed select-none">
                <span>Suggest Feature</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Supported Platforms Grid */}
        <section id="platforms" className="w-full border-y border-borderDark/40 dark:border-borderDark/40 light:border-borderLight bg-cardDark/10 dark:bg-cardDark/10 light:bg-zinc-50/50 py-16 px-4 transition-colors duration-200">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-zinc-900">
                Supported Social Platforms
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Paste any link from these popular services into our Downloader tool to extract files instantly.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {platforms.map((p, index) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-xl border border-borderDark/30 dark:border-borderDark/30 light:border-borderLight bg-cardDark/30 dark:bg-cardDark/30 light:bg-white p-4 flex items-center gap-3.5 shadow-sm hover:border-zinc-700/50 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-2xl select-none">{p.icon}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold tracking-tight text-white dark:text-white light:text-zinc-900">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500">
                      {p.desc}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-zinc-900 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Engineered for High-Speed Processing
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              High-performance backend scraping and AI transcription features packed into a clean experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              title="Stateless Direct Streaming"
              description="Our backend pipes files directly to your device. We do not store, cache, or log your media, providing full privacy."
              Icon={Zap}
            />
            <FeatureCard
              title="Secure Encryption Layer"
              description="All downloads are fully protected via SSL. Spoofed headers and client protections prevent rate blocking."
              Icon={ShieldCheck}
            />
            <FeatureCard
              title="AI Speech-to-Text"
              description="Convert spoken audio into highly accurate text using advanced Whisper speech-to-text models instantly."
              Icon={Wand2}
            />
            <FeatureCard
              title="Zero Limits & Zero Ads"
              description="No monthly transfer caps, no popup ads, and no download lockups. Run as many downloads as you want."
              Icon={InfinityIcon}
            />
          </div>
        </section>

        {/* FAQ Section */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

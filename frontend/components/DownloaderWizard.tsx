'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Sparkles, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  Link2,
  Tv,
  ArrowLeft
} from 'lucide-react';
import { useMedia } from '../hooks/use-media';
import URLInput from './URLInput';
import AnalyzeButton from './AnalyzeButton';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorCard from './ErrorCard';
import Thumbnail from './Thumbnail';
import MetadataCard from './MetadataCard';
import FormatSelector from './FormatSelector';

export function DownloaderWizard() {
  const {
    url,
    setUrl,
    loading,
    downloading,
    progress,
    metadata,
    selectedFormat,
    setSelectedFormat,
    error,
    setError,
    reset,
    handleAnalyze,
    handleDownload,
  } = useMedia();

  const [step, setStep] = useState<'input' | 'format' | 'progress' | 'success'>('input');
  const [internalProgress, setInternalProgress] = useState(0);

  // Sync internal progress with useMedia progress
  useEffect(() => {
    if (progress > 0) {
      setInternalProgress(progress);
    }
  }, [progress]);

  // Sync wizard steps with media retrieval states
  useEffect(() => {
    if (loading) {
      setStep('input'); // show skeleton on input screen
    } else if (metadata && !downloading && step !== 'success') {
      setStep('format');
    }
  }, [metadata, loading, downloading]);

  const handleClearError = () => {
    reset();
    setUrl('');
    setStep('input');
  };

  const onAnalyzeClick = async () => {
    if (!url) return;
    await handleAnalyze(url);
  };

  const onDownloadTrigger = async () => {
    setStep('progress');
    setInternalProgress(0);
    const success = await handleDownload();
    if (success) {
      setStep('success');
    } else {
      setStep('format');
    }
  };

  const handleReset = () => {
    reset();
    setUrl('');
    setStep('input');
    setInternalProgress(0);
  };

  const stepVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.25, ease: 'easeIn' as const } }
  };

  const platforms = [
    { name: 'YouTube', icon: '🔴' },
    { name: 'Instagram', icon: '📸' },
    { name: 'TikTok', icon: '🎵' },
    { name: 'Reddit', icon: '🤖' },
    { name: 'Facebook', icon: '👥' },
    { name: 'Twitter/X', icon: '🐦' },
    { name: 'Vimeo', icon: '📹' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-between max-w-md mx-auto mb-10 select-none">
        {[
          { label: 'Paste Link', num: '1', active: step === 'input' },
          { label: 'Select Format', num: '2', active: step === 'format' },
          { label: 'Download', num: '3', active: step === 'progress' || step === 'success' },
        ].map((s, idx) => (
          <div key={s.label} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                  s.active
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110'
                    : s.num === '1' || (s.num === '2' && (step === 'format' || step === 'progress' || step === 'success'))
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-650'
                }`}
              >
                {s.num}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-semibold transition-colors duration-300 ${
                  s.active ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < 2 && (
              <div
                className={`h-0.5 flex-1 mx-2 sm:mx-4 border-t transition-colors duration-300 ${
                  (idx === 0 && (step === 'format' || step === 'progress' || step === 'success')) ||
                  (idx === 1 && (step === 'progress' || step === 'success'))
                    ? 'border-primary'
                    : 'border-zinc-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main Wizard Stage */}
      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {/* Step 1: Link Input */}
          {step === 'input' && !loading && (
            <motion.div
              key="input-step"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center"
            >
              <div className="w-full glass-card rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Paste Video or Audio Link
                  </h2>
                  <p className="text-sm text-zinc-500 mt-2">
                    Supported on YouTube, TikTok, Instagram, Reddit, Facebook, Vimeo, and more.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <URLInput
                    value={url}
                    onChange={setUrl}
                    onSubmit={onAnalyzeClick}
                    disabled={loading}
                  />
                  <AnalyzeButton
                    onClick={onAnalyzeClick}
                    loading={loading}
                    disabled={!url}
                  />
                </div>

                {error && (
                  <div className="mt-6">
                    <ErrorCard message={error} onRetry={handleClearError} />
                  </div>
                )}
              </div>

              {/* Mini platforms list underneath for context */}
              <div className="flex flex-wrap justify-center items-center gap-4 mt-8 opacity-75">
                <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase mr-2">Supported:</span>
                {platforms.map(p => (
                  <div key={p.name} className="flex items-center gap-1 bg-zinc-950/45 px-2.5 py-1 rounded-lg border border-zinc-900 text-xs text-zinc-450 hover:text-white transition-colors duration-200">
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loading state within input step */}
          {loading && (
            <motion.div
              key="loading-step"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="w-full glass-card rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center">
                <LoadingSkeleton />
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Format & Metadata */}
          {step === 'format' && metadata && (
            <motion.div
              key="format-step"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="glass-card w-full rounded-3xl p-6 md:p-8 shadow-2xl relative"
            >
              {/* Back to Step 1 Button */}
              <button
                type="button"
                onClick={handleReset}
                className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Link</span>
              </button>

              <div className="flex flex-col md:flex-row gap-8 pt-8">
                {/* Left: Thumbnail & Metadata Preview */}
                <div className="w-full md:w-2/5 flex-shrink-0">
                  <Thumbnail
                    src={metadata.thumbnail}
                    title={metadata.title}
                    duration={metadata.duration}
                  />
                  <div className="mt-4">
                    <MetadataCard
                      title={metadata.title}
                      uploader={metadata.uploader}
                      duration={metadata.duration}
                      platform={metadata.platform}
                    />
                  </div>
                </div>

                {/* Right: Format Selector & Download Button */}
                <div className="flex-1 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 tracking-wide uppercase">Select Quality Format</h3>
                    <FormatSelector
                      formats={metadata.formats}
                      selected={selectedFormat}
                      onSelect={setSelectedFormat}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onDownloadTrigger}
                    disabled={!selectedFormat}
                    type="button"
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-semibold rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-primary/20 hover:shadow-2xl text-white shadow-xl transition-all duration-300"
                  >
                    <Download className="w-4 h-4" />
                    <span>Start Downloading</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Download & Streaming Progress */}
          {step === 'progress' && metadata && selectedFormat && (
            <motion.div
              key="progress-step"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="glass-card w-full rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>

              <h2 className="text-xl font-bold">Piping Media Stream</h2>
              <p className="text-sm text-zinc-500 mt-2 max-w-xs truncate font-semibold">
                {metadata.title}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-zinc-950 border border-zinc-900 h-3 rounded-full mt-8 overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: `${internalProgress}%` }}
                />
              </div>

              <div className="flex justify-between items-center w-full mt-3 text-xs font-semibold text-zinc-400">
                <span>Format: {selectedFormat.quality} ({selectedFormat.ext.toUpperCase()})</span>
                <span>{internalProgress > 0 ? `${internalProgress}%` : 'Scraping...'}</span>
              </div>

              <p className="text-xs text-zinc-500 mt-6 leading-relaxed max-w-sm">
                {internalProgress >= 100 
                  ? 'Merging audio/video tracks on the server and packaging file...' 
                  : 'Streaming raw chunks directly onto your device. Please do not close this window.'
                }
              </p>
            </motion.div>
          )}

          {/* Step 4: Success Screen */}
          {step === 'success' && metadata && selectedFormat && (
            <motion.div
              key="success-step"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="glass-card w-full rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-extrabold text-white">Download Complete!</h2>
              <p className="text-sm text-zinc-400 mt-2 max-w-sm">
                Your file has been processed and saved successfully.
              </p>

              <div className="mt-6 px-4 py-3 bg-zinc-950/50 border border-zinc-900 rounded-xl max-w-xs text-left w-full text-xs space-y-1.5">
                <div className="text-zinc-500 font-semibold truncate"><span className="text-zinc-400">File:</span> {metadata.title}</div>
                <div className="text-zinc-550"><span className="text-zinc-450 font-semibold">Quality:</span> {selectedFormat.quality}</div>
                <div className="text-zinc-550"><span className="text-zinc-450 font-semibold">Format:</span> {selectedFormat.ext.toUpperCase()}</div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                type="button"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors border border-zinc-700/50 shadow-md"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Download Another Video</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DownloaderWizard;

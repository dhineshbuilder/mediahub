'use client';

import { ChangeEvent, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileAudio2,
  Layers3,
  Wand2,
  ClipboardCopy,
  Download,
  FileText,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useCaption } from '../hooks/use-caption';

type PreviewMode = 'timestamped' | 'plain' | 'srt' | 'vtt';

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '_').trim() || 'captions';
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);
}

export function SubtitleWizard() {
  const { file, setFile, loading, result, error, setError, reset, handleGenerate } = useCaption();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('timestamped');
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync wizard step with hook state
  useEffect(() => {
    if (loading) {
      setStep('processing');
    } else if (result) {
      setStep('result');
    }
  }, [loading, result]);

  const previewText = result
    ? previewMode === 'timestamped'
      ? result.timestampedText
      : previewMode === 'plain'
        ? result.plainText
        : previewMode === 'srt'
          ? result.srt
          : result.vtt
    : '';

  const copyText = async (mode: 'timestamped' | 'plain') => {
    if (!result) return;
    const text = mode === 'timestamped' ? result.timestampedText : result.plainText;
    await navigator.clipboard.writeText(text);
  };

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] || null;
    if (picked) {
      setFile(picked);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!loading) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (loading) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
      setError(null);
    } else if (droppedFile) {
      setError('Please upload an audio file only.');
    }
  };

  const clearAll = () => {
    setFile(null);
    setError(null);
    reset();
    setStep('upload');
    setPreviewMode('timestamped');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onGenerateTrigger = async () => {
    if (!file) return;
    await handleGenerate();
  };

  const stepVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.25, ease: 'easeIn' as const } }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-between max-w-md mx-auto mb-10 select-none">
        {[
          { label: 'Upload Audio', num: '1', active: step === 'upload' },
          { label: 'Transcribing', num: '2', active: step === 'processing' },
          { label: 'Export Captions', num: '3', active: step === 'result' },
        ].map((s, idx) => (
          <div key={s.label} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                  s.active
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110'
                    : s.num === '1' || (s.num === '2' && step === 'result')
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
                  (idx === 0 && (step === 'processing' || step === 'result')) ||
                  (idx === 1 && step === 'result')
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
          {/* Step 1: Upload Audio */}
          {step === 'upload' && (
            <motion.div
              key="upload-step"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="glass-card w-full rounded-3xl p-6 md:p-8 shadow-2xl relative"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Upload Audio File
                </h2>
                <p className="text-sm text-zinc-500 mt-2">
                  Drop MP3, M4A, WAV, or any audio track to extract timestamped subtitles.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-900/10'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white">Choose an audio file or drag it here</span>
                  <span className="text-xs text-zinc-500">Supports standard audio files up to 50MB</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleFilePick}
              />

              {file && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-zinc-900 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-300">
                  <FileAudio2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 truncate">
                    Selected file: <span className="font-semibold text-white">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-zinc-500 hover:text-white underline cursor-pointer transition-colors flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-8 flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={onGenerateTrigger}
                  disabled={!file}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-primary/20 transition-all hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Generate Captions</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Processing Status */}
          {step === 'processing' && (
            <motion.div
              key="processing-step"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="glass-card w-full rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>

              <h2 className="text-xl font-bold">AI Caption Generation in Progress</h2>
              {file && (
                <p className="text-sm text-zinc-500 mt-2 max-w-xs truncate font-semibold">
                  {file.name}
                </p>
              )}

              <p className="text-xs text-zinc-500 mt-8 leading-relaxed max-w-sm">
                Our backend is slicing the audio track and transcribing speech segments using high-accuracy AI models. Please do not navigate away from this page.
              </p>
            </motion.div>
          )}

          {/* Step 3: Result & Export */}
          {step === 'result' && result && (
            <motion.div
              key="result-step"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="glass-card w-full rounded-3xl p-6 md:p-8 shadow-2xl relative"
            >
              <div className="flex flex-col gap-6 border-b border-zinc-800 pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Layers3 className="h-3.5 w-3.5" />
                    <span>Caption output</span>
                  </div>
                  <h2 className="mt-4 text-xl md:text-2xl font-bold tracking-tight">{result.title}</h2>
                  <div className="mt-1 text-xs text-zinc-500 font-medium">
                    Scraped {result.stats.speechSegments} speech blocks
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => copyText('timestamped')}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-primary/50 hover:text-white"
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    <span>Copy with timestamps</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText('plain')}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-primary/50 hover:text-white"
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    <span>Copy plain text</span>
                  </button>
                </div>
              </div>

              {/* Quick Downloads */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-zinc-500 tracking-wide uppercase mb-3">Download Format Exports</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => downloadTextFile(`${sanitizeFileName(result.title || 'captions')}.txt`, result.plainText)}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  >
                    <Download className="h-4 w-4 text-primary" />
                    <span>TXT File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(`${sanitizeFileName(result.title || 'captions')}.srt`, result.srt, 'application/x-subrip')}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  >
                    <Download className="h-4 w-4 text-accent" />
                    <span>SRT Subtitles</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTextFile(`${sanitizeFileName(result.title || 'captions')}.vtt`, result.vtt, 'text/vtt')}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  >
                    <Download className="h-4 w-4 text-secondary" />
                    <span>VTT Captions</span>
                  </button>
                </div>
              </div>

              {/* Preview with format options */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-zinc-500 tracking-wide uppercase">Live Preview Panel</h4>
                  <div className="flex flex-wrap gap-2">
                    {(['timestamped', 'plain', 'srt', 'vtt'] as PreviewMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPreviewMode(mode)}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          previewMode === mode
                            ? 'bg-primary text-white'
                            : 'border border-zinc-800 bg-zinc-950/30 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/50 p-5">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 select-none">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Formatted Text Preview</span>
                  </div>
                  <pre className="max-h-[350px] overflow-auto whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300 font-mono scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {previewText || 'Empty transcript.'}
                  </pre>
                </div>
              </div>

              {/* Reset to Step 1 Button */}
              <div className="mt-8 flex justify-center border-t border-zinc-800 pt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearAll}
                  type="button"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Transcribe Another File</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SubtitleWizard;

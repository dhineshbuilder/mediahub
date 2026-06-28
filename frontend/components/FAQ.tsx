'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-borderDark/40 dark:border-borderDark/40 light:border-borderLight py-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-left font-semibold text-white dark:text-white light:text-zinc-900 hover:text-primary transition-colors focus:outline-none"
      >
        <span className="text-base tracking-tight">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-500"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-650 leading-relaxed pt-2 pb-3">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const faqs = [
    {
      question: 'Which media platforms are supported?',
      answer: 'MediaHub provides support for YouTube, Instagram (Reels & Posts), Facebook, Twitter/X, TikTok, Reddit, Pinterest, Threads, Vimeo, and Dailymotion. You can also paste direct links to MP4, WebM, MP3, and WAV files.',
    },
    {
      question: 'How does the AI Subtitle & Caption Generator work?',
      answer: 'You can upload any standard audio file (like MP3, WAV, or M4A). Our backend processes the audio using advanced speech-to-text AI models to generate highly accurate transcripts, which you can preview, copy, or download as SRT, VTT, or TXT files.',
    },
    {
      question: 'Do I need to sign up or create an account?',
      answer: 'No, MediaHub is completely stateless and anonymous. There is no user authentication, database, or registration flow. Simply paste your link and enjoy high-speed media processing.',
    },
    {
      question: 'How does the download streaming pipeline work?',
      answer: 'When you download media, our backend requests the raw stream from the origin hosting provider and pipes it directly to your browser on-the-fly. The media files are never saved to our server disk, ensuring maximum speed and security.',
    },
    {
      question: 'Is it legal to download videos using MediaHub?',
      answer: 'MediaHub is designed for downloading public, non-copyrighted media for educational and personal use. Downloading copyrighted materials without permission from the creator violates terms of service and legal regulations.',
    },
    {
      question: 'Can I download audio streams from video links?',
      answer: 'Yes! When analyzing videos, MediaHub parses separate video-only and audio-only streams where available, allowing you to easily extract soundtracks or podcast audio.',
    },
  ];

  return (
    <section id="faq" className="w-full max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-zinc-900 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Everything you need to know about the MediaHub platform.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </section>
  );
}
export default FAQ;

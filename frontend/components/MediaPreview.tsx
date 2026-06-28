'use client';

import { motion } from 'framer-motion';
import { MediaMetadata, MediaFormat } from '../types/media';
import Thumbnail from './Thumbnail';
import MetadataCard from './MetadataCard';
import FormatSelector from './FormatSelector';
import DownloadButton from './DownloadButton';

interface MediaPreviewProps {
  metadata: MediaMetadata;
  selectedFormat: MediaFormat | null;
  onSelectFormat: (fmt: MediaFormat) => void;
  onDownload: () => void;
  downloading: boolean;
  progress: number;
}

export function MediaPreview({
  metadata,
  selectedFormat,
  onSelectFormat,
  onDownload,
  downloading,
  progress,
}: MediaPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card w-full max-w-4xl mx-auto rounded-2xl p-6 md:p-8 mt-12 shadow-2xl relative z-10"
    >
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Media Visualizer */}
        <div className="w-full md:w-2/5 flex-shrink-0">
          <Thumbnail
            src={metadata.thumbnail}
            title={metadata.title}
            duration={metadata.duration}
          />
        </div>

        {/* Right Column - Media Data & Quality Selectors */}
        <div className="flex-1 flex flex-col justify-between gap-6 py-1">
          <MetadataCard
            title={metadata.title}
            uploader={metadata.uploader}
            duration={metadata.duration}
            platform={metadata.platform}
          />

          <div className="flex flex-col gap-5">
            <FormatSelector
              formats={metadata.formats}
              selected={selectedFormat}
              onSelect={onSelectFormat}
            />

            <DownloadButton
              onClick={onDownload}
              downloading={downloading}
              progress={progress}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
export default MediaPreview;

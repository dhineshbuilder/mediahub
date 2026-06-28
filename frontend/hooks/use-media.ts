import { useState, useCallback } from 'react';
import { MediaMetadata, MediaFormat } from '../types/media';
import { analyzeMedia, downloadMedia } from '../lib/api';
import { toast } from './use-toast';

export function useMedia() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMetadata(null);
    setSelectedFormat(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleAnalyze = useCallback(async (inputUrl: string) => {
    if (!inputUrl) {
      setError('Please paste a media URL.');
      return;
    }

    setUrl(inputUrl);
    setLoading(true);
    setError(null);
    setMetadata(null);
    setSelectedFormat(null);

    try {
      const data = await analyzeMedia(inputUrl);
      setMetadata(data);
      if (data.formats && data.formats.length > 0) {
        setSelectedFormat(data.formats[0]);
      }
      toast({
        title: 'URL Analyzed Successfully',
        description: `Ready to download from ${data.platform}`,
        type: 'success',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to analyze URL.');
      toast({
        title: 'Analysis Failed',
        description: err.message || 'Could not fetch media info.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownload = useCallback(async (): Promise<boolean> => {
    if (!metadata || !selectedFormat) {
      toast({
        title: 'Download Error',
        description: 'No active media or format selected.',
        type: 'error',
      });
      return false;
    }

    setDownloading(true);
    setProgress(0);

    toast({
      title: 'Download Started',
      description: 'Streaming media file from source. Please wait...',
      type: 'info',
    });

    try {
      await downloadMedia(
        metadata.formats.find(f => f.quality === selectedFormat.quality)?.url || selectedFormat.url,
        selectedFormat.quality,
        selectedFormat.type,
        (percent) => setProgress(percent)
      );

      toast({
        title: 'Download Complete',
        description: 'File downloaded successfully.',
        type: 'success',
      });
      return true;
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message || 'Stream processing timed out or failed.',
        type: 'error',
      });
      return false;
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  }, [metadata, selectedFormat]);

  return {
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
  };
}
export default useMedia;

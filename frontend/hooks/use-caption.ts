'use client';

import { useCallback, useState } from 'react';
import { generateCaptions } from '../lib/api';
import { CaptionResult } from '../types/caption';
import { toast } from './use-toast';

export function useCaption() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file) {
      setError('Please choose an audio file.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateCaptions(file);

      setResult(data);
      toast({
        title: 'Captions ready',
        description: 'Transcript and caption exports were generated successfully.',
        type: 'success',
      });
    } catch (err: any) {
      const message = err?.message || 'Failed to generate captions.';
      setError(message);
      toast({
        title: 'Caption generation failed',
        description: message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [file]);

  return {
    file,
    setFile,
    loading,
    result,
    error,
    setError,
    reset,
    handleGenerate,
  };
}
export default useCaption;

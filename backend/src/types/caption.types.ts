export type CaptionSourceKind = 'url' | 'upload';

export interface CaptionLine {
  kind: 'speech' | 'ocr';
  start: number;
  end: number;
  text: string;
}

export interface CaptionResult {
  success: boolean;
  sourceKind: CaptionSourceKind;
  title: string;
  plainText: string;
  timestampedText: string;
  srt: string;
  vtt: string;
  lines: CaptionLine[];
  stats: {
    speechSegments: number;
    ocrSegments: number;
  };
}

import { createReadStream, createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import Groq from 'groq-sdk';
import { createWorker } from 'tesseract.js';
import { pipeline } from 'stream/promises';
import { ProviderFactory } from '../providers/provider.factory';
import { CaptionLine, CaptionResult } from '../types/caption.types';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/error.formatter';

const ffmpegPath = require('ffmpeg-static') as string | null;

const transcriptionClient = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;
const transcriptionModel = env.GROQ_TRANSCRIPTION_MODEL;

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { windowsHide: true });
    let stderr = '';

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `${path.basename(command)} exited with code ${code}`));
      }
    });

    proc.on('error', (err) => reject(new Error(`Failed to spawn ${path.basename(command)}: ${err.message}`)));
  });
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\u0000/g, '')
    .trim();
}

function formatClock(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hrs = Math.floor(totalMs / 3_600_000);
  const mins = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatShortClock(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hrs = Math.floor(totalMs / 3_600_000);
  const mins = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function buildSrt(lines: CaptionLine[]): string {
  return lines
    .map((line, index) => `${index + 1}\n${formatClock(line.start)} --> ${formatClock(line.end)}\n${line.text}`)
    .join('\n\n');
}

function buildVtt(lines: CaptionLine[]): string {
  return `WEBVTT\n\n${lines
    .map((line) => `${formatClock(line.start).replace(',', '.')} --> ${formatClock(line.end).replace(',', '.')}\n${line.text}`)
    .join('\n\n')}`;
}

function buildPlainText(lines: CaptionLine[]): string {
  return lines.map((line) => line.text).join('\n');
}

function buildTimestampedText(lines: CaptionLine[]): string {
  return lines
    .map((line) => `[${formatShortClock(line.start)}] ${line.kind === 'ocr' ? '[screen] ' : ''}${line.text}`)
    .join('\n');
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function writeStreamToFile(stream: NodeJS.ReadableStream, targetPath: string): Promise<void> {
  await pipeline(stream as any, createWriteStream(targetPath));
}

async function getDownloadedMediaFile(url: string, workDir: string): Promise<{ filePath: string; title: string; hasVideo: boolean }> {
  const provider = ProviderFactory.getProvider(url);
  const metadata = await provider.analyze(url);
  const preferredFormat =
    metadata.formats.find((format) => format.type === 'both') ||
    metadata.formats.find((format) => format.type === 'audio') ||
    metadata.formats[0];

  if (!preferredFormat) {
    throw new AppError('No downloadable format found for the provided URL.', 400);
  }

  const download = await provider.download(url, preferredFormat.quality, preferredFormat.type);
  const filePath = path.join(workDir, `source-${crypto.randomUUID()}.${preferredFormat.ext || 'bin'}`);
  await writeStreamToFile(download.stream, filePath);

  return {
    filePath,
    title: metadata.title,
    hasVideo: metadata.formats.some((format) => format.type === 'both'),
  };
}

async function extractAudioChunks(sourcePath: string, workDir: string): Promise<string[]> {
  if (!ffmpegPath) {
    throw new AppError('ffmpeg is required for caption generation.', 500);
  }

  const audioDir = path.join(workDir, 'audio');
  await ensureDir(audioDir);
  const template = path.join(audioDir, 'chunk-%03d.mp3');

  await runCommand(ffmpegPath, [
    '-y',
    '-i',
    sourcePath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-b:a',
    '64k',
    '-f',
    'segment',
    '-segment_time',
    String(env.CAPTION_AUDIO_CHUNK_SECONDS),
    '-reset_timestamps',
    '1',
    template,
  ]);

  const files = await fs.readdir(audioDir);
  return files
    .filter((file) => file.endsWith('.mp3'))
    .sort()
    .map((file) => path.join(audioDir, file));
}

async function extractOcrFrames(sourcePath: string, workDir: string): Promise<string[]> {
  if (!ffmpegPath) {
    return [];
  }

  const frameDir = path.join(workDir, 'frames');
  await ensureDir(frameDir);

  try {
    await runCommand(ffmpegPath, [
      '-y',
      '-i',
      sourcePath,
      '-vf',
      `fps=1/${env.CAPTION_OCR_SAMPLE_SECONDS}`,
      '-q:v',
      '2',
      path.join(frameDir, 'frame-%04d.jpg'),
    ]);
  } catch (error) {
    logger.debug(`OCR frame extraction skipped: ${(error as Error).message}`);
    return [];
  }

  const frames = await fs.readdir(frameDir);
  return frames
    .filter((file) => file.endsWith('.jpg'))
    .sort()
    .map((file) => path.join(frameDir, file));
}

async function transcribeChunk(chunkPath: string, offsetSeconds: number): Promise<CaptionLine[]> {
  if (!transcriptionClient) {
    throw new AppError('GROQ_API_KEY is required for caption generation.', 500);
  }

  const transcript = await transcriptionClient.audio.transcriptions.create({
    file: createReadStream(chunkPath),
    model: transcriptionModel,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  const segments = Array.isArray((transcript as any).segments) ? (transcript as any).segments : [];

  return segments
    .map((segment: any) => ({
      kind: 'speech' as const,
      start: Number(segment.start || 0) + offsetSeconds,
      end: Number(segment.end || 0) + offsetSeconds,
      text: normalizeText(String(segment.text || '')),
    }))
    .filter((segment: CaptionLine) => segment.text.length > 0);
}

async function transcribeAudio(sourcePath: string, workDir: string): Promise<CaptionLine[]> {
  const chunks = await extractAudioChunks(sourcePath, workDir);
  if (chunks.length === 0) {
    throw new AppError('No audio chunks were generated for transcription.', 500);
  }

  const lines: CaptionLine[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunkPath = chunks[index];
    const offsetSeconds = index * env.CAPTION_AUDIO_CHUNK_SECONDS;
    const chunkLines = await transcribeChunk(chunkPath, offsetSeconds);
    lines.push(...chunkLines);
  }

  return lines;
}

async function runOcr(framePaths: string[]): Promise<CaptionLine[]> {
  if (framePaths.length === 0) {
    return [];
  }

  const worker = await createWorker('eng', 1);
  const lines: CaptionLine[] = [];
  let lastNormalized = '';

  try {
    for (let index = 0; index < framePaths.length; index += 1) {
      const framePath = framePaths[index];
      const result = await worker.recognize(framePath);
      const text = normalizeText(result.data.text || '');
      const normalized = text.toLowerCase();

      if (!text || normalized === lastNormalized) {
        continue;
      }

      lastNormalized = normalized;
      const start = index * env.CAPTION_OCR_SAMPLE_SECONDS;

      lines.push({
        kind: 'ocr',
        start,
        end: start + Math.max(3, Math.min(env.CAPTION_OCR_SAMPLE_SECONDS, 6)),
        text: `[screen] ${text}`,
      });
    }
  } finally {
    await worker.terminate();
  }

  return lines;
}

function sortCaptionLines(lines: CaptionLine[]): CaptionLine[] {
  return [...lines].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.kind === b.kind) return 0;
    return a.kind === 'speech' ? -1 : 1;
  });
}

export async function generateCaptionsForUrl(url: string): Promise<CaptionResult> {
  const workDir = path.join(process.cwd(), 'temp', `caption-${crypto.randomUUID()}`);
  await ensureDir(workDir);

  try {
    const { filePath, title, hasVideo } = await getDownloadedMediaFile(url, workDir);
    const speechLines = await transcribeAudio(filePath, workDir);
    const ocrLines = hasVideo ? await runOcr(await extractOcrFrames(filePath, workDir)) : [];
    const lines = sortCaptionLines([...speechLines, ...ocrLines]);

    return {
      success: true,
      sourceKind: 'url',
      title,
      plainText: buildPlainText(lines),
      timestampedText: buildTimestampedText(lines),
      srt: buildSrt(lines),
      vtt: buildVtt(lines),
      lines,
      stats: {
        speechSegments: speechLines.length,
        ocrSegments: ocrLines.length,
      },
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function generateCaptionsForUpload(filePath: string, originalName: string, mimetype?: string): Promise<CaptionResult> {
  const workDir = path.join(process.cwd(), 'temp', `caption-${crypto.randomUUID()}`);
  await ensureDir(workDir);

  try {
    const speechLines = await transcribeAudio(filePath, workDir);
    const hasVideo = Boolean(mimetype?.startsWith('video/'));
    const ocrLines = hasVideo ? await runOcr(await extractOcrFrames(filePath, workDir)) : [];
    const lines = sortCaptionLines([...speechLines, ...ocrLines]);

    return {
      success: true,
      sourceKind: 'upload',
      title: originalName,
      plainText: buildPlainText(lines),
      timestampedText: buildTimestampedText(lines),
      srt: buildSrt(lines),
      vtt: buildVtt(lines),
      lines,
      stats: {
        speechSegments: speechLines.length,
        ocrSegments: ocrLines.length,
      },
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

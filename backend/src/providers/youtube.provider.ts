import { spawn } from 'child_process';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { GenericProvider } from './generic.provider';
import { ProviderResponse } from './provider.interface';
import { MediaMetadata, MediaFormat } from '../types/media.types';
import { formatDuration } from '../utils/duration.formatter';
import { formatBytes } from '../utils/size.formatter';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/error.formatter';
const ffmpegPath = require('ffmpeg-static') as string | null;

import { existsSync } from 'fs';

function getYtDlpCommand(): string {
  const localPath = path.join(process.cwd(), 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  if (existsSync(localPath)) {
    return localPath;
  }
  return 'yt-dlp';
}

/** Run yt-dlp with given arguments and return stdout as a string */
function ytDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const proc = spawn(getYtDlpCommand(), args, { windowsHide: true });
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      }
    });
    proc.on('error', (err) => reject(new Error(`Failed to spawn yt-dlp: ${err.message}`)));
  });
}

/** Quality tier ordering for sorting (highest first) */
function qualityRank(quality: string): number {
  const label = quality.toUpperCase();
  if (label.includes('8K')) return 0;
  if (label.includes('4K')) return 1;
  if (label.includes('2K')) return 2;

  const height = Number(label.match(/(\d{3,4})P?/)?.[1]);
  const map: Record<number, number> = {
    4320: 3,
    2160: 4,
    1440: 5,
    1080: 6,
    720: 7,
    480: 8,
    360: 9,
    240: 10,
    144: 11,
  };
  return map[height] ?? 99;
}

function formatVideoQualityLabel(height?: number, formatNote?: string): string {
  if (!height) return formatNote || 'Standard';
  if (height >= 4320) return '8K';
  if (height >= 2160) return '4K';
  if (height >= 1440) return '2K';
  return `${height}p`;
}

function resolveQualityHeight(quality: string): number | undefined {
  const normalized = quality.toUpperCase().trim();
  if (normalized.includes('8K')) return 4320;
  if (normalized.includes('4K')) return 2160;
  if (normalized.includes('2K')) return 1440;

  const match = normalized.match(/(\d{3,4})P?/);
  return match ? Number(match[1]) : undefined;
}

function buildCookieArgs(): string[] {
  const args: string[] = [];
  
  if (env.YTDLP_COOKIES_FILE?.trim()) {
    args.push('--cookies', env.YTDLP_COOKIES_FILE.trim());
  } else if (env.YTDLP_COOKIES_FROM_BROWSER?.trim()) {
    args.push('--cookies-from-browser', env.YTDLP_COOKIES_FROM_BROWSER.trim());
  }

  if (env.YTDLP_USE_OAUTH2) {
    args.push('--username', 'oauth2', '--password', '');
  }

  if (env.YTDLP_CACHE_DIR?.trim()) {
    args.push('--cache-dir', env.YTDLP_CACHE_DIR.trim());
  }

  return args;
}

function buildYtDlpArgs(args: string[]): string[] {
  return [
    ...buildCookieArgs(),
    '--extractor-args', 'youtube:player-client=android,ios',
    ...args
  ];
}

async function runYtDlp(args: string[]): Promise<string> {
  return ytDlp(buildYtDlpArgs(args));
}

interface YtDlpFormat {
  format_id: string;
  format_note?: string;
  ext: string;
  vcodec?: string;
  acodec?: string;
  height?: number;
  width?: number;
  filesize?: number;
  filesize_approx?: number;
  abr?: number;
  vbr?: number;
  url?: string;
  manifest_url?: string;
}

interface YtDlpInfo {
  id: string;
  title?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
  thumbnails?: { url: string }[];
  formats?: YtDlpFormat[];
}

export class YouTubeProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.includes('youtube.com') || hostname.includes('youtu.be');
    } catch {
      return false;
    }
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing YouTube URL via yt-dlp: ${url}`);

      const jsonStr = await ytDlp(buildYtDlpArgs([
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        url,
      ]));

      const info: YtDlpInfo = JSON.parse(jsonStr);

      // Thumbnail – prefer the highest resolution one
      let thumbnail = `https://img.youtube.com/vi/${info.id}/maxresdefault.jpg`;
      if (info.thumbnails && info.thumbnails.length > 0) {
        thumbnail = info.thumbnails[info.thumbnails.length - 1].url;
      } else if (info.thumbnail) {
        thumbnail = info.thumbnail;
      }

      const title = info.title || 'YouTube Video';
      const uploader = info.uploader || info.channel || 'YouTube Creator';
      const durationSec = info.duration || 0;

      const formats: MediaFormat[] = [];
      const addedKeys = new Set<string>();

      const rawFormats = info.formats || [];

      // --- Muxed (video+audio) formats ---
      const muxed = rawFormats
        .filter((f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none')
        .sort((a, b) => (b.height || 0) - (a.height || 0));

      for (const fmt of muxed) {
        const label = formatVideoQualityLabel(fmt.height, fmt.format_note);
        const key = `both-${fmt.height || label}`;
        if (addedKeys.has(key)) continue;
        addedKeys.add(key);

        const bytes = fmt.filesize || fmt.filesize_approx;
        formats.push({
          quality: label,
          type: 'both',
          url: url,
          ext: fmt.ext === 'webm' ? 'webm' : 'mp4',
          size: bytes ? formatBytes(bytes) : undefined,
        });
      }

      // --- Video-only adaptive formats, exposed as merged downloads ---
      const videoOnly = rawFormats
        .filter(
          (f) =>
            f.vcodec && f.vcodec !== 'none' && (!f.acodec || f.acodec === 'none') && f.height
        )
        .sort((a, b) => (b.height || 0) - (a.height || 0));

      for (const fmt of videoOnly) {
        const label = formatVideoQualityLabel(fmt.height, fmt.format_note);
        const key = `both-${fmt.height || label}`;
        if (addedKeys.has(key)) continue;
        addedKeys.add(key);

        const bytes = fmt.filesize || fmt.filesize_approx;
        formats.push({
          quality: label,
          type: 'both',
          url: url,
          ext: 'mp4',
          size: bytes ? formatBytes(bytes) : undefined,
        });
      }

      // --- Audio-only formats ---
      const audioOnly = rawFormats
        .filter(
          (f) =>
            (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none'
        )
        .sort((a, b) => (b.abr || 0) - (a.abr || 0));

      let audioCount = 0;
      const addedAbrKeys = new Set<string>();
      for (const fmt of audioOnly) {
        if (audioCount >= 3) break;
        const abr = Math.round(fmt.abr || 0);
        const abrKey = `${abr}`;
        if (addedAbrKeys.has(abrKey)) continue;
        addedAbrKeys.add(abrKey);

        const label = abr ? `Audio ${abr}kbps` : 'Audio';
        const bytes = fmt.filesize || fmt.filesize_approx;
        const ext = fmt.ext === 'webm' ? 'webm' : 'm4a';
        formats.push({
          quality: label,
          type: 'audio',
          url: url,
          ext,
          size: bytes ? formatBytes(bytes) : undefined,
        });
        audioCount++;
      }

      // Sort: muxed first (highest res), then audio
      formats.sort((a, b) => {
        const typePriority: Record<string, number> = { both: 0, audio: 1 };
        const typeDiff = (typePriority[a.type] || 0) - (typePriority[b.type] || 0);
        if (typeDiff !== 0) return typeDiff;

        return qualityRank(a.quality) - qualityRank(b.quality);
      });

      if (formats.length === 0) {
        throw new Error('No downloadable formats found');
      }

      return {
        success: true,
        platform: 'YouTube',
        title: this.cleanHtmlEntities(title),
        thumbnail,
        duration: formatDuration(durationSec),
        uploader: this.cleanHtmlEntities(uploader),
        formats,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error in YouTubeProvider.analyze: ${errMsg}`);
      throw new AppError(`Failed to fetch YouTube metadata: ${errMsg}`, 400);
    }
  }

  public override async download(
    url: string,
    quality: string,
    type: 'audio' | 'both'
  ): Promise<ProviderResponse> {
    try {
      logger.info(`Streaming YouTube download via yt-dlp: quality=${quality}, type=${type}`);

      // Select format string based on type and quality
      let formatArg: string;
      const qualityLabel = quality.replace(/\s*\(.*?\)/, '').trim();

      if (type === 'audio') {
        formatArg = 'bestaudio[ext=m4a]/bestaudio';
      } else {
        const height = resolveQualityHeight(qualityLabel);
        formatArg = height
          ? `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`
          : 'bestvideo+bestaudio/best';
      }

      // Get JSON info to determine filename and content type
      const jsonStr = await ytDlp(buildYtDlpArgs([
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        '--format', formatArg,
        url,
      ]));

      const info: YtDlpInfo & { requested_formats?: YtDlpFormat[]; requested_format?: YtDlpFormat } = JSON.parse(jsonStr);
      const safeTitle = (info.title || 'youtube-video').replace(/[^\w\s\-]/g, '').trim().substring(0, 80);
      const ext = type === 'audio' ? 'm4a' : 'mp4';
      const filename = `${safeTitle}-${qualityLabel || 'best'}.${ext}`;
      const contentType = type === 'audio' ? 'audio/mp4' : 'video/mp4';

      if (type === 'audio') {
        // Audio-only can still be streamed directly.
        const dlProc = spawn(getYtDlpCommand(), buildYtDlpArgs([
          '--no-playlist',
          '--no-warnings',
          '--format', formatArg,
          '--output', '-',
          url,
        ]), { windowsHide: true });

        const stream = dlProc.stdout;

        dlProc.stderr.on('data', (chunk: Buffer) => {
          logger.debug(`yt-dlp stderr: ${chunk.toString().trim()}`);
        });

        dlProc.on('error', (err) => {
          logger.error(`yt-dlp process error: ${err.message}`);
        });

        return {
          stream: stream as unknown as NodeJS.ReadableStream,
          filename,
          contentType,
          size: undefined,
        };
      }

      if (!ffmpegPath) {
        throw new AppError('ffmpeg is required to merge video and audio streams.', 500);
      }

      const downloadId = crypto.randomUUID();
      const tempDir = path.join(process.cwd(), 'temp', `yt-${downloadId}`);
      await fs.mkdir(tempDir, { recursive: true });

      const outputTemplate = path.join(tempDir, '%(id)s.%(ext)s');
      const mergedPathFallback = path.join(tempDir, `${info.id}.mp4`);

      try {
        const printedPath = (
          await runYtDlp([
            '--no-playlist',
            '--no-warnings',
            '--ffmpeg-location',
            ffmpegPath,
            '--merge-output-format',
            'mp4',
            '--format',
            formatArg,
            '--output',
            outputTemplate,
            '--print',
            'after_move:filepath',
            url,
          ])
        ).trim();

        const finalPath = printedPath.split(/\r?\n/).filter(Boolean).pop() || mergedPathFallback;
        const normalizedPath = path.resolve(finalPath);
        const fileStats = await fs.stat(normalizedPath);
        const stream = createReadStream(normalizedPath);

        const cleanup = async () => {
          try {
            await fs.rm(tempDir, { recursive: true, force: true });
          } catch (cleanupErr: any) {
            logger.debug(`Temp cleanup skipped for ${tempDir}: ${cleanupErr.message}`);
          }
        };

        stream.on('close', () => {
          void cleanup();
        });

        stream.on('error', (err) => {
          logger.error(`Error reading merged file ${normalizedPath}: ${err.message}`);
          void cleanup();
        });

        return {
          stream: stream as unknown as NodeJS.ReadableStream,
          filename,
          contentType,
          size: fileStats.size,
        };
      } catch (downloadError) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
        throw downloadError;
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error in YouTubeProvider.download: ${errMsg}`);
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to download YouTube video: ${errMsg}`, 502);
    }
  }
}

export default YouTubeProvider;

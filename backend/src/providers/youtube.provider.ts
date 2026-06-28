import { spawn } from 'child_process';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { GenericProvider } from './generic.provider';
import { ProviderResponse } from './provider.interface';
import { MediaMetadata, MediaFormat } from '../types/media.types';
import { formatDuration } from '../utils/duration.formatter';
import { formatBytes } from '../utils/size.formatter';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/error.formatter';
import { Innertube } from 'youtubei.js';
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

let resolvedCookiesFilePromise: Promise<string | undefined> | null = null;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveCookiesFile(): Promise<string | undefined> {
  if (resolvedCookiesFilePromise) {
    return resolvedCookiesFilePromise;
  }

  resolvedCookiesFilePromise = (async () => {
    const configuredPath = env.YTDLP_COOKIES_FILE?.trim();
    if (configuredPath) {
      const candidate = path.isAbsolute(configuredPath)
        ? configuredPath
        : path.resolve(process.cwd(), configuredPath);
      if (await fileExists(candidate)) {
        return candidate;
      }
      logger.warn(`YTDLP_COOKIES_FILE was set but the file was not found: ${candidate}`);
    }

    const encodedCookies = env.YTDLP_COOKIES_BASE64?.trim();
    if (encodedCookies) {
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });

      const cookiePath = path.join(tempDir, 'yt-dlp-cookies.txt');
      const decoded = Buffer.from(encodedCookies, 'base64').toString('utf8');
      await fs.writeFile(cookiePath, decoded, 'utf8');
      return cookiePath;
    }

    return undefined;
  })();

  return resolvedCookiesFilePromise;
}

async function buildCookieArgsAsync(): Promise<string[]> {
  const args: string[] = [];

  const cookiesFile = await resolveCookiesFile();
  if (cookiesFile) {
    args.push('--cookies', cookiesFile);
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

async function buildYtDlpArgs(args: string[]): Promise<string[]> {
  return [
    ...(await buildCookieArgsAsync()),
    '--extractor-args', 'youtube:player_client=web_embedded,android,ios,tv_embedded',
    '--add-headers', 'User-Agent:com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip',
    '--no-check-certificates',
    ...args
  ];
}

async function runYtDlp(args: string[]): Promise<string> {
  return ytDlp(await buildYtDlpArgs(args));
}

type YoutubeIFormat = {
  has_audio: boolean;
  has_video: boolean;
  mime_type: string;
  bitrate: number;
  height?: number;
  width?: number;
  quality_label?: string;
  content_length?: number;
  decipher(player?: unknown): Promise<string>;
};

type YoutubeIBasicInfo = {
  id: string;
  title?: string;
  duration?: number;
  author?: string;
  channel?: { name: string } | null;
  thumbnail?: { url: string }[];
};

type YoutubeIVideoInfo = {
  basic_info: YoutubeIBasicInfo;
  streaming_data?: {
    formats?: YoutubeIFormat[];
    adaptive_formats?: YoutubeIFormat[];
  };
  actions: {
    session: {
      player: unknown;
    };
  };
  chooseFormat(options: {
    quality?: string;
    type?: 'video' | 'audio' | 'video+audio';
    format?: string;
  }): YoutubeIFormat;
  download(options?: {
    quality?: string;
    type?: 'video' | 'audio' | 'video+audio';
    format?: string;
  }): Promise<ReadableStream<Uint8Array>>;
};

let youtubeClientPromise: Promise<Innertube> | null = null;

async function getYoutubeClient(): Promise<Innertube> {
  if (!youtubeClientPromise) {
    youtubeClientPromise = Innertube.create({
      retrieve_player: true,
    });
  }

  return youtubeClientPromise;
}

function toNodeStream(stream: ReadableStream<Uint8Array>): NodeJS.ReadableStream {
  return Readable.fromWeb(stream as unknown as globalThis.ReadableStream) as unknown as NodeJS.ReadableStream;
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(';')[0].trim().toLowerCase();
}

function inferContainerExt(mimeType: string, fallback: string): string {
  const normalized = normalizeMimeType(mimeType);
  if (normalized.includes('webm')) return 'webm';
  if (normalized.includes('audio/mp4') || normalized.includes('video/mp4') || normalized.includes('audio/m4a')) {
    return normalized.startsWith('audio/') ? 'm4a' : 'mp4';
  }
  if (normalized.includes('mpeg')) return 'mp4';
  if (normalized.includes('matroska')) return 'mkv';
  return fallback;
}

function inferContentType(mimeType: string, fallback: string): string {
  return normalizeMimeType(mimeType) || fallback;
}

function isRetryableYoutubeError(message: string): boolean {
  return /sign in to confirm you're not a bot|use --cookies|cookies-from-browser|login required|http error 403|forbidden|bot/i.test(message);
}

function sortYoutubeFormats(formats: YoutubeIFormat[]): YoutubeIFormat[] {
  return [...formats].sort((a, b) => {
    const heightDiff = (b.height || 0) - (a.height || 0);
    if (heightDiff !== 0) return heightDiff;
    return (b.bitrate || 0) - (a.bitrate || 0);
  });
}

function isMp4Family(format: YoutubeIFormat): boolean {
  const mimeType = normalizeMimeType(format.mime_type);
  return mimeType.includes('mp4') || mimeType.includes('mpeg');
}

function isWebmFamily(format: YoutubeIFormat): boolean {
  return normalizeMimeType(format.mime_type).includes('webm');
}

function getCompatibleAudioFormat(formats: YoutubeIFormat[], family: 'mp4' | 'webm'): YoutubeIFormat | undefined {
  const candidates = formats
    .filter((format) => !format.has_video && format.has_audio)
    .filter((format) => (family === 'mp4' ? isMp4Family(format) : isWebmFamily(format)))
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  return candidates[0];
}

function getBestVideoFormat(formats: YoutubeIFormat[], heightLimit?: number): YoutubeIFormat | undefined {
  const candidates = formats
    .filter((format) => format.has_video && !format.has_audio && format.height)
    .filter((format) => (heightLimit ? (format.height || 0) <= heightLimit : true));

  return sortYoutubeFormats(candidates)[0];
}

function getBestMuxedFormat(formats: YoutubeIFormat[], heightLimit?: number): YoutubeIFormat | undefined {
  const candidates = formats
    .filter((format) => format.has_video && format.has_audio && format.height)
    .filter((format) => (heightLimit ? (format.height || 0) <= heightLimit : true));

  return sortYoutubeFormats(candidates)[0];
}

async function streamFromYoutubeIWebStream(stream: ReadableStream<Uint8Array>): Promise<NodeJS.ReadableStream> {
  return toNodeStream(stream);
}

function shouldUseYoutubeIFallback(message: string): boolean {
  return isRetryableYoutubeError(message);
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

  /**
   * Analyze using YouTube Data API v3 if YOUTUBE_API_KEY is configured.
   * Falls back to yt-dlp if the API key is absent.
   */
  public override async analyze(url: string): Promise<MediaMetadata> {
    if (env.YOUTUBE_API_KEY) {
      return this.analyzeWithDataApi(url);
    }
    try {
      return await this.analyzeWithYtDlp(url);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (shouldUseYoutubeIFallback(errMsg)) {
        logger.warn(`yt-dlp metadata lookup failed for YouTube; retrying with YouTube.js: ${errMsg}`);
        return this.analyzeWithYoutubeI(url);
      }
      throw error;
    }
  }

  /** Fetch metadata using the official YouTube Data API v3 (no bot detection, scales to millions of users) */
  private async analyzeWithDataApi(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing YouTube URL via Data API v3: ${url}`);

      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error('Could not extract a valid YouTube video ID from the URL.');
      }

      const apiUrl =
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${env.YOUTUBE_API_KEY}`;

      const resp = await fetch(apiUrl);
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({})) as Record<string, unknown>;
        const apiErr = (errBody as { error?: { message?: string } }).error?.message || `YouTube API returned ${resp.status}`;
        throw new Error(apiErr);
      }

      const data = await resp.json() as {
        items?: {
          snippet: {
            title: string;
            channelTitle: string;
            thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
          };
          contentDetails: { duration: string };
        }[];
      };

      if (!data.items || data.items.length === 0) {
        throw new Error('YouTube video not found or is private.');
      }

      const item = data.items[0];
      const snippet = item.snippet;
      const thumbs = snippet.thumbnails;
      const thumbnail =
        thumbs.maxres?.url ||
        thumbs.high?.url ||
        thumbs.medium?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      // Parse ISO 8601 duration (PT4M13S → seconds)
      const durationSec = this.parseIsoDuration(item.contentDetails.duration);

      // Build a standard set of quality formats – we can't enumerate adaptive formats
      // without yt-dlp, so we expose the common quality tiers.
      const qualityTiers: MediaFormat[] = [
        { quality: '1080p', type: 'both', url, ext: 'mp4' },
        { quality: '720p', type: 'both', url, ext: 'mp4' },
        { quality: '480p', type: 'both', url, ext: 'mp4' },
        { quality: '360p', type: 'both', url, ext: 'mp4' },
        { quality: 'Audio 128kbps', type: 'audio', url, ext: 'm4a' },
      ];

      return {
        success: true,
        platform: 'YouTube',
        title: this.cleanHtmlEntities(snippet.title),
        thumbnail,
        duration: formatDuration(durationSec),
        uploader: this.cleanHtmlEntities(snippet.channelTitle),
        formats: qualityTiers,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`YouTube Data API error: ${errMsg} — falling back to yt-dlp`);
      // Gracefully fall back to yt-dlp if the API call fails
      try {
        return await this.analyzeWithYtDlp(url);
      } catch (ytDlpError: unknown) {
        const ytDlpMsg = ytDlpError instanceof Error ? ytDlpError.message : String(ytDlpError);
        if (shouldUseYoutubeIFallback(ytDlpMsg)) {
          logger.warn(`yt-dlp metadata lookup failed after Data API fallback; retrying with YouTube.js: ${ytDlpMsg}`);
          return this.analyzeWithYoutubeI(url);
        }
        throw ytDlpError;
      }
    }
  }

  /** Extract the 11-character video ID from any YouTube URL format */
  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  /** Parse an ISO 8601 duration string (e.g. PT1H4M13S) into seconds */
  private parseIsoDuration(iso: string): number {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
  }

  private async analyzeWithYoutubeI(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing YouTube URL via YouTube.js: ${url}`);

      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error('Could not extract a valid YouTube video ID from the URL.');
      }

      const yt = await getYoutubeClient();
      const info = (await yt.getBasicInfo(videoId)) as YoutubeIVideoInfo;
      const basicInfo = info.basic_info;
      const thumbnail =
        basicInfo.thumbnail?.[basicInfo.thumbnail.length - 1]?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      const title = basicInfo.title || 'YouTube Video';
      const uploader = basicInfo.channel?.name || basicInfo.author || 'YouTube Creator';
      const durationSec = basicInfo.duration || 0;

      const qualityTiers: MediaFormat[] = [
        { quality: '1080p', type: 'both', url, ext: 'mp4' },
        { quality: '720p', type: 'both', url, ext: 'mp4' },
        { quality: '480p', type: 'both', url, ext: 'mp4' },
        { quality: '360p', type: 'both', url, ext: 'mp4' },
        { quality: 'Audio 128kbps', type: 'audio', url, ext: 'm4a' },
      ];

      return {
        success: true,
        platform: 'YouTube',
        title: this.cleanHtmlEntities(title),
        thumbnail,
        duration: formatDuration(durationSec),
        uploader: this.cleanHtmlEntities(uploader),
        formats: qualityTiers,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error in YouTubeProvider.analyzeWithYoutubeI: ${errMsg}`);
      throw new AppError(`Failed to fetch YouTube metadata: ${errMsg}`, 400);
    }
  }

  /** Original yt-dlp-based analyze (used as fallback when no API key is set) */
  private async analyzeWithYtDlp(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing YouTube URL via yt-dlp: ${url}`);

      const jsonStr = await ytDlp(await buildYtDlpArgs([
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
      logger.error(`Error in YouTubeProvider.analyzeWithYtDlp: ${errMsg}`);
      throw new AppError(`Failed to fetch YouTube metadata: ${errMsg}`, 400);
    }
  }

  private async downloadWithYoutubeI(
    url: string,
    quality: string,
    type: 'audio' | 'both'
  ): Promise<ProviderResponse> {
    try {
      logger.info(`Streaming YouTube download via YouTube.js: quality=${quality}, type=${type}`);

      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error('Could not extract a valid YouTube video ID from the URL.');
      }

      const yt = await getYoutubeClient();
      const info = (await yt.getBasicInfo(videoId)) as YoutubeIVideoInfo;
      const basicInfo = info.basic_info;
      const formats = [
        ...((info.streaming_data?.formats || []) as YoutubeIFormat[]),
        ...((info.streaming_data?.adaptive_formats || []) as YoutubeIFormat[]),
      ];

      const safeTitle = (basicInfo.title || 'youtube-video').replace(/[^\w\s\-]/g, '').trim().substring(0, 80);
      const qualityLabel = quality.replace(/\s*\(.*?\)/, '').trim() || 'best';
      const heightLimit = resolveQualityHeight(qualityLabel);

      if (type === 'audio') {
        const chosen = info.chooseFormat({
          quality: 'highestaudio',
          type: 'audio',
          format: 'any',
        });

        const stream = await info.download({
          quality: 'highestaudio',
          type: 'audio',
          format: 'any',
        });

        return {
          stream: (await streamFromYoutubeIWebStream(stream)) as NodeJS.ReadableStream,
          filename: `${safeTitle}-${qualityLabel}.${inferContainerExt(chosen.mime_type, 'm4a')}`,
          contentType: inferContentType(chosen.mime_type, 'audio/mp4'),
          size: chosen.content_length,
        };
      }

      const directMuxed = getBestMuxedFormat(formats, heightLimit) || getBestMuxedFormat(formats);
      const videoFormat = getBestVideoFormat(formats, heightLimit) || getBestVideoFormat(formats);

      if (!videoFormat && !directMuxed) {
        throw new Error('No suitable YouTube video format was found.');
      }

      if (directMuxed && (!videoFormat || (videoFormat.height || 0) <= (directMuxed.height || 0))) {
        try {
          const stream = await info.download({
            quality: directMuxed.quality_label || qualityLabel,
            type: 'video+audio',
            format: 'any',
          });

          return {
            stream: (await streamFromYoutubeIWebStream(stream)) as NodeJS.ReadableStream,
            filename: `${safeTitle}-${qualityLabel}.${inferContainerExt(directMuxed.mime_type, 'mp4')}`,
            contentType: inferContentType(directMuxed.mime_type, 'video/mp4'),
            size: directMuxed.content_length,
          };
        } catch (directError) {
          const directMsg = directError instanceof Error ? directError.message : String(directError);
          logger.warn(`Direct YouTube.js muxed stream failed, falling back to merge: ${directMsg}`);
        }
      }

      if (!videoFormat) {
        throw new Error('No suitable YouTube video format was found.');
      }

      let family: 'mp4' | 'webm' | 'matroska' = isWebmFamily(videoFormat) ? 'webm' : 'mp4';
      let audioFormat = getCompatibleAudioFormat(formats, family as 'mp4' | 'webm');

      if (!audioFormat) {
        audioFormat = formats
          .filter((format) => !format.has_video && format.has_audio)
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        family = 'matroska';
      }

      if (!audioFormat) {
        throw new Error('No suitable YouTube audio format was found.');
      }

      if (!ffmpegPath) {
        throw new AppError('ffmpeg is required to merge YouTube streams.', 500);
      }

      const player = info.actions.session.player;
      const [videoUrl, audioUrl] = await Promise.all([
        videoFormat.decipher(player),
        audioFormat.decipher(player),
      ]);

      const ffmpegArgs = ['-hide_banner', '-loglevel', 'error', '-i', videoUrl, '-i', audioUrl, '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy'];
      if (family === 'mp4') {
        ffmpegArgs.push('-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4');
      } else if (family === 'webm') {
        ffmpegArgs.push('-f', 'webm');
      } else {
        ffmpegArgs.push('-f', 'matroska');
      }
      ffmpegArgs.push('pipe:1');

      const ffmpegProc = spawn(ffmpegPath, ffmpegArgs, { windowsHide: true });
      let stderr = '';
      ffmpegProc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      ffmpegProc.on('error', (err) => {
        logger.error(`ffmpeg process error for YouTube merge fallback: ${err.message}`);
      });
      ffmpegProc.on('close', (code) => {
        if (code !== 0) {
          logger.error(`ffmpeg merge fallback exited with code ${code}: ${stderr.trim()}`);
        }
      });

      const ext = family === 'matroska' ? 'mkv' : family;
      const contentType = family === 'mp4' ? 'video/mp4' : family === 'webm' ? 'video/webm' : 'video/x-matroska';

      return {
        stream: ffmpegProc.stdout as unknown as NodeJS.ReadableStream,
        filename: `${safeTitle}-${qualityLabel}.${ext}`,
        contentType,
        size: undefined,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error in YouTubeProvider.downloadWithYoutubeI: ${errMsg}`);
      throw new AppError(`Failed to download YouTube video: ${errMsg}`, 502);
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
      const jsonStr = await ytDlp(await buildYtDlpArgs([
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
        const dlProc = spawn(getYtDlpCommand(), await buildYtDlpArgs([
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
      if (shouldUseYoutubeIFallback(errMsg)) {
        logger.warn(`yt-dlp download failed for YouTube; retrying with YouTube.js: ${errMsg}`);
        return this.downloadWithYoutubeI(url, quality, type);
      }
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to download YouTube video: ${errMsg}`, 502);
    }
  }
}

export default YouTubeProvider;

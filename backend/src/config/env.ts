import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  MAX_FILE_SIZE: z.coerce.number().default(104857600), // Default 100MB
  DOWNLOAD_TIMEOUT: z.coerce.number().default(60000), // Default 60s
  YTDLP_COOKIES_FROM_BROWSER: z.string().optional(),
  YTDLP_COOKIES_FILE: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_TRANSCRIPTION_MODEL: z.string().default('whisper-large-v3'),
  CAPTION_AUDIO_CHUNK_SECONDS: z.coerce.number().default(600),
  CAPTION_OCR_SAMPLE_SECONDS: z.coerce.number().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

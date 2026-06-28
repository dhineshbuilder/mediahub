import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProviderFactory } from '../providers/provider.factory';
import { logger } from '../utils/logger';

// Zod validation schemas
export const analyzeSchema = z.object({
  body: z.object({
    url: z.string().url('Invalid URL format. Must start with http:// or https://'),
  }),
});

export const downloadSchema = z.object({
  body: z.object({
    url: z.string().url('Invalid URL format. Must start with http:// or https://'),
    quality: z.string().min(1, 'Quality is required'),
    type: z.enum(['audio', 'both']).default('both'),
  }),
});

export async function analyzeUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url } = req.body;
    logger.info(`Incoming analyze request for URL: ${url}`);

    const provider = ProviderFactory.getProvider(url);
    const metadata = await provider.analyze(url);

    res.status(200).json(metadata);
  } catch (error) {
    next(error);
  }
}

export async function downloadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url, quality, type } = req.body;
    logger.info(`Incoming download request for URL: ${url}, Quality: ${quality}, Type: ${type}`);

    const provider = ProviderFactory.getProvider(url);
    const result = await provider.download(url, quality, type);

    // Set streaming headers
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.setHeader('Content-Type', result.contentType);
    
    if (result.size) {
      res.setHeader('Content-Length', result.size.toString());
    }

    logger.info(`Streaming started: ${result.filename} (${result.contentType})`);

    result.stream.pipe(res);

    result.stream.on('error', (err) => {
      logger.error(`Error in media download stream for ${result.filename}: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Stream processing error.' });
      }
    });

    res.on('finish', () => {
      logger.info(`Streaming finished successfully for: ${result.filename}`);
    });

    req.on('close', () => {
      if (typeof (result.stream as any).destroy === 'function') {
        logger.info(`Client disconnected. Destroying input stream for: ${result.filename}`);
        (result.stream as any).destroy();
      }
    });
  } catch (error) {
    next(error);
  }
}

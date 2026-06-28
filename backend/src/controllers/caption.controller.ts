import { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import { AppError } from '../utils/error.formatter';
import { logger } from '../utils/logger';
import { generateCaptionsForUpload } from '../services/caption.service';

export async function createCaptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  const upload = req.file as Express.Multer.File | undefined;

  try {
    if (!upload) {
      throw new AppError('Please upload an audio file to generate captions.', 400);
    }

    logger.info(`Generating captions from upload: ${upload.originalname}`);
    const result = await generateCaptionsForUpload(upload.path, upload.originalname, upload.mimetype);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  } finally {
    if (upload?.path) {
      await fs.rm(upload.path, { force: true }).catch(() => undefined);
    }
  }
}

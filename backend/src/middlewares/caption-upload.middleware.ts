import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import { env } from '../config/env';

const uploadDir = path.join(process.cwd(), 'temp', 'caption-uploads');
mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

export const captionUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
});

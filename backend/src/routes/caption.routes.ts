import { Router } from 'express';
import { createCaptions } from '../controllers/caption.controller';
import { captionUploadMiddleware } from '../middlewares/caption-upload.middleware';

const router = Router();

router.post('/generate', captionUploadMiddleware.single('mediaFile'), createCaptions);

export default router;

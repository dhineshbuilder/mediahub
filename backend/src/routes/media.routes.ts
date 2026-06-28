import { Router } from 'express';
import { analyzeUrl, downloadMedia, analyzeSchema, downloadSchema } from '../controllers/media.controller';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.post('/analyze', validate(analyzeSchema), analyzeUrl);
router.post('/download', validate(downloadSchema), downloadMedia);

export default router;

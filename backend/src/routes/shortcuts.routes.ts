import { Router } from 'express';
import { getShortcuts, getShortcut, getSubjectList } from '../controllers/shortcuts.controller';

const router = Router();

router.get('/subjects', getSubjectList);
router.get('/', getShortcuts);
router.get('/:shortcutId', getShortcut);

export default router;

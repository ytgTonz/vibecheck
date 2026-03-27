import { Router } from 'express';
import adminRouter from './streams/admin';
import publicRouter from './streams/public';
import broadcastRouter from './streams/broadcast';

const router = Router();

// admin first — POST /end-all must not be shadowed by /:id patterns
router.use(adminRouter);
// public next — GET /active must be registered before GET /:id in broadcast
router.use(publicRouter);
router.use(broadcastRouter);

export default router;

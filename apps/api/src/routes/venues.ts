import { Router } from 'express';
import publicRouter from './venues/public';
import managementRouter from './venues/management';
import promoterRouter from './venues/promoters';
import attendanceRouter from './venues/attendance';

const router = Router();

router.use(publicRouter);
router.use(managementRouter);
router.use(promoterRouter);
router.use(attendanceRouter);

export default router;

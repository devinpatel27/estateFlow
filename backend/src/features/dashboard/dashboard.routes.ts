import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, authorizeOneOf } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '../../constants/permissions';

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);

dashboardRoutes.get('/stats', authorize('dashboard:read'), dashboardController.getStats);
dashboardRoutes.get(
  '/recent-activity',
  authorize('dashboard:read'),
  dashboardController.getRecentActivity
);
dashboardRoutes.get(
  '/latest-employees',
  authorize('dashboard:read'),
  dashboardController.getLatestEmployees
);
dashboardRoutes.get(
  '/lead-stats',
  authorizeOneOf(
    PERMISSIONS.LEAD_READ,
    PERMISSIONS.LEAD_READ_ASSIGNED,
    PERMISSIONS.DASHBOARD_READ
  ),
  dashboardController.getLeadStats
);

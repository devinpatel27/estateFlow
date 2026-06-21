import { Request, Response, NextFunction } from 'express';
import { employeeRepository } from '../employees/employee.repository';
import { ActivityLogModel } from '../../models/ActivityLog.model';
import { UserModel } from '../../models/User.model';
import { sendSuccess } from '../../utils/response.utils';
import { leadService } from '../leads/lead.service';

export const dashboardController = {
  getStats: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [counts, todayLogins] = await Promise.all([
        employeeRepository.countByStatus(),
        employeeRepository.countTodayLogins(),
      ]);

      sendSuccess(res, 'Dashboard stats retrieved', {
        totalEmployees: counts.total,
        activeEmployees: counts.active,
        inactiveEmployees: counts.inactive,
        todayLogins,
      });
    } catch (error) {
      next(error);
    }
  },

  getRecentActivity: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activities = await ActivityLogModel.find()
        .populate('user', 'name employeeId profileImage')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      sendSuccess(res, 'Recent activity retrieved', activities);
    } catch (error) {
      next(error);
    }
  },

  getLatestEmployees: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employees = await UserModel.find()
        .populate('role', 'roleName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      sendSuccess(res, 'Latest employees retrieved', employees);
    } catch (error) {
      next(error);
    }
  },

  getLeadStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await leadService.getLeadStats(req.user!);
      sendSuccess(res, 'Lead stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  },
};

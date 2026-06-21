export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  todayLogins: number;
}

export interface ActivityLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    employeeId: string;
    profileImage?: string;
  };
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface LatestEmployee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: {
    roleName: string;
  };
  status: 'active' | 'inactive';
  profileImage?: string;
  createdAt: string;
}

export interface LeadDashboardStats {
  totalLeads: number;
  newLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  todayFollowUps: number;
  tomorrowFollowUps: number;
  overdueFollowUps: number;
  closedWon: number;
  closedLost: number;
  isAdminView: boolean;
}

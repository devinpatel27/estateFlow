export interface MasterItem {
  _id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

export interface LeadUser {
  _id: string;
  name: string;
  employeeId?: string;
  email?: string;
}

export interface Lead {
  _id: string;
  leadId: string;
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  city?: string;
  address?: string;
  category: string;
  propertyType: MasterItem | string;
  leadSource: MasterItem | string;
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  priority: 'hot' | 'warm' | 'cold';
  status: string;
  initialRemark?: string;
  notes?: LeadNote[];
  assignedTo?: LeadUser;
  assignedAt?: string;
  nextFollowUpDate?: string;
  lastFollowUpRemark?: string;
  lastFollowUpDate?: string;
  createdBy?: LeadUser;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  _id?: string;
  text: string;
  createdBy: LeadUser;
  createdAt: string;
}

export interface LeadFollowUp {
  _id: string;
  leadId: string;
  followUpDate: string;
  followUpTime?: string;
  type: string;
  remark?: string;
  nextFollowUpDate?: string;
  createdBy: LeadUser;
  createdAt: string;
}

export interface LeadActivity {
  _id: string;
  type: string;
  title: string;
  remark?: string;
  performedBy: LeadUser;
  createdAt: string;
}

export interface LeadAssignment {
  _id: string;
  assignedTo: LeadUser;
  assignedBy: LeadUser;
  assignedAt: string;
  transferredAt?: string;
  transferRemark?: string;
  isCurrent: boolean;
  sequence: number;
}

export interface LeadListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  propertyType?: string;
  leadSource?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateLeadData {
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  city?: string;
  address?: string;
  category: string;
  propertyType: string;
  leadSource: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  assignedTo?: string;
  priority: string;
  initialRemark?: string;
}

export interface LeadStats {
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

export interface MobileCheckResult {
  exists: boolean;
  activeLead: Lead | null;
  closedLeads: Lead[];
  normalizedMobile: string;
}

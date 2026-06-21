import { FilterQuery, Types } from 'mongoose';
import { LeadModel, ILead } from '../../models/Lead.model';
import { LeadAssignmentModel } from '../../models/LeadAssignment.model';
import { LeadFollowUpModel } from '../../models/LeadFollowUp.model';
import { LeadActivityModel } from '../../models/LeadActivity.model';
import { ACTIVE_LEAD_STATUSES } from '../../constants/lead.constants';
import { normalizeMobile } from '../../utils/mobile.utils';
import { enrichLeadDetail, enrichLeads } from '../../utils/leadPopulate.utils';
import { isValidObjectId, toObjectId } from '../../utils/objectId.utils';

export interface ListLeadOptions {
  skip: number;
  limit: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  propertyType?: string;
  leadSource?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  assignedOnly?: boolean;
  assignedToUserId?: string;
  dateFrom?: string;
  dateTo?: string;
}

const populateFields =
  'customerName mobile alternateMobile email city address category propertyType leadSource budgetMin budgetMax preferredArea priority status initialRemark assignedTo currentAssignmentId assignedAt nextFollowUpDate leadId createdAt updatedAt notes';

async function attachLastFollowUps<T extends Record<string, unknown>>(
  leads: T[],
  options?: { scopeToCurrentAssignment?: boolean }
): Promise<T[]> {
  if (leads.length === 0) return leads;

  const leadIds = leads.map((lead) => lead._id);

  if (options?.scopeToCurrentAssignment) {
    const assignmentPairs = leads
      .filter((lead) => lead.currentAssignmentId)
      .map((lead) => ({
        leadId: lead._id,
        assignmentId: lead.currentAssignmentId,
      }));

    if (assignmentPairs.length === 0) return leads;

    const latest = await LeadFollowUpModel.aggregate([
      { $match: { $or: assignmentPairs } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$leadId',
          lastFollowUpRemark: { $first: '$remark' },
          lastFollowUpDate: { $first: '$followUpDate' },
        },
      },
    ]);

    const remarkMap = new Map(
      latest.map((item) => [
        String(item._id),
        {
          lastFollowUpRemark: item.lastFollowUpRemark as string | undefined,
          lastFollowUpDate: item.lastFollowUpDate as Date | undefined,
        },
      ])
    );

    return leads.map((lead) => {
      const extra = remarkMap.get(String(lead._id));
      return extra ? { ...lead, ...extra } : lead;
    });
  }

  const latest = await LeadFollowUpModel.aggregate([
    { $match: { leadId: { $in: leadIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$leadId',
        lastFollowUpRemark: { $first: '$remark' },
        lastFollowUpDate: { $first: '$followUpDate' },
      },
    },
  ]);

  const remarkMap = new Map(
    latest.map((item) => [
      String(item._id),
      {
        lastFollowUpRemark: item.lastFollowUpRemark as string | undefined,
        lastFollowUpDate: item.lastFollowUpDate as Date | undefined,
      },
    ])
  );

  return leads.map((lead) => {
    const extra = remarkMap.get(String(lead._id));
    return extra ? { ...lead, ...extra } : lead;
  });
}

export const leadRepository = {
  findAll: async (options: ListLeadOptions) => {
    const query: FilterQuery<ILead> = { deletedAt: null };

    if (options.assignedOnly && options.assignedToUserId) {
      const assignedToUserId = toObjectId(options.assignedToUserId);
      if (!assignedToUserId) {
        return { data: [], total: 0 };
      }
      query.assignedTo = assignedToUserId;
    } else if (!options.assignedOnly && options.assignedTo) {
      const assignedTo = toObjectId(options.assignedTo);
      if (assignedTo) query.assignedTo = assignedTo;
    }

    if (options.search) {
      const searchRegex = { $regex: options.search, $options: 'i' };
      query.$or = [
        { customerName: searchRegex },
        { mobile: searchRegex },
        { alternateMobile: searchRegex },
        { email: searchRegex },
        { leadId: searchRegex },
        { preferredArea: searchRegex },
        { city: searchRegex },
        { address: searchRegex },
        { initialRemark: searchRegex },
      ];
    }

    if (options.dateFrom || options.dateTo) {
      query.createdAt = {};
      if (options.dateFrom) {
        (query.createdAt as Record<string, Date>).$gte = new Date(`${options.dateFrom}T00:00:00.000Z`);
      }
      if (options.dateTo) {
        (query.createdAt as Record<string, Date>).$lte = new Date(`${options.dateTo}T23:59:59.999Z`);
      }
    }

    if (options.status) query.status = options.status;
    if (options.category) query.category = options.category;
    if (options.priority) query.priority = options.priority;
    if (options.propertyType) {
      const propertyType = toObjectId(options.propertyType);
      if (propertyType) query.propertyType = propertyType;
    }
    if (options.leadSource) {
      const leadSource = toObjectId(options.leadSource);
      if (leadSource) query.leadSource = leadSource;
    }

    const sortFieldMap: Record<string, string> = {
      customer: 'customerName',
      customerName: 'customerName',
      leadId: 'leadId',
      category: 'category',
      priority: 'priority',
      status: 'status',
      nextFollowUpDate: 'nextFollowUpDate',
      assignedAt: 'assignedAt',
      createdAt: 'createdAt',
    };
    const sortField = sortFieldMap[options.sortBy || ''] || 'createdAt';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;

    const [rawData, total] = await Promise.all([
      LeadModel.find(query)
        .select(populateFields)
        .sort({ [sortField]: sortDir })
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      LeadModel.countDocuments(query),
    ]);

    const data = await enrichLeads(rawData);
    const withFollowUps = await attachLastFollowUps(data, {
      scopeToCurrentAssignment: Boolean(options.assignedOnly),
    });

    return { data: withFollowUps, total };
  },

  findById: async (id: string): Promise<ILead | null> => {
    if (!isValidObjectId(id)) return null;

    const lead = await LeadModel.findOne({ _id: id, deletedAt: null }).lean();
    return enrichLeadDetail(lead) as Promise<ILead | null>;
  },

  findByMobile: async (mobile: string) => {
    const normalized = normalizeMobile(mobile);
    return LeadModel.find({ mobile: normalized, deletedAt: null })
      .populate('assignedTo', 'name employeeId')
      .sort({ createdAt: -1 })
      .lean();
  },

  findActiveByMobile: async (mobile: string) => {
    const normalized = normalizeMobile(mobile);
    return LeadModel.findOne({
      mobile: normalized,
      deletedAt: null,
      status: { $in: ACTIVE_LEAD_STATUSES },
    }).lean();
  },

  create: async (data: Partial<ILead>): Promise<ILead> => {
    return LeadModel.create(data);
  },

  update: async (id: string, data: Partial<ILead>): Promise<ILead | null> => {
    if (!isValidObjectId(id)) return null;

    await LeadModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return leadRepository.findById(id);
  },

  softDelete: async (id: string): Promise<ILead | null> => {
    return LeadModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
  },

  createAssignment: async (data: {
    leadId: Types.ObjectId;
    assignedTo: Types.ObjectId;
    assignedBy: Types.ObjectId;
    sequence: number;
    transferRemark?: string;
  }) => {
    return LeadAssignmentModel.create({
      ...data,
      assignedAt: new Date(),
      isCurrent: true,
    });
  },

  closeCurrentAssignment: async (leadId: string, transferRemark?: string) => {
    return LeadAssignmentModel.findOneAndUpdate(
      { leadId, isCurrent: true },
      { isCurrent: false, transferredAt: new Date(), transferRemark },
      { new: true }
    );
  },

  getAssignments: async (leadId: string, assignedToUserId?: string) => {
    const query: FilterQuery<typeof LeadAssignmentModel> = { leadId };
    if (assignedToUserId) {
      const assignedTo = toObjectId(assignedToUserId);
      if (assignedTo) query.assignedTo = assignedTo;
    }
    return LeadAssignmentModel.find(query)
      .populate('assignedTo', 'name employeeId email')
      .populate('assignedBy', 'name employeeId')
      .sort({ sequence: -1 })
      .lean();
  },

  getNextAssignmentSequence: async (leadId: string) => {
    const last = await LeadAssignmentModel.findOne({ leadId }).sort({ sequence: -1 });
    return (last?.sequence ?? 0) + 1;
  },

  getFollowUps: async (leadId: string, assignmentId?: string, options?: { strict?: boolean }) => {
    const query: FilterQuery<typeof LeadFollowUpModel> = { leadId };
    if (assignmentId) {
      const id = toObjectId(assignmentId);
      if (id) query.assignmentId = id;
    } else if (options?.strict) {
      return [];
    }
    return LeadFollowUpModel.find(query)
      .populate('createdBy', 'name employeeId')
      .sort({ followUpDate: -1, createdAt: -1 })
      .lean();
  },

  createFollowUp: async (data: Partial<typeof LeadFollowUpModel.prototype>) => {
    return LeadFollowUpModel.create(data);
  },

  getActivities: async (leadId: string, assignmentId?: string, options?: { strict?: boolean }) => {
    const query: FilterQuery<typeof LeadActivityModel> = { leadId };
    if (assignmentId) {
      const id = toObjectId(assignmentId);
      if (id) query.assignmentId = id;
    } else if (options?.strict) {
      return [];
    }
    return LeadActivityModel.find(query)
      .populate('performedBy', 'name employeeId')
      .sort({ createdAt: -1 })
      .lean();
  },

  createActivity: async (data: {
    leadId: Types.ObjectId;
    assignmentId?: Types.ObjectId;
    type: string;
    title: string;
    remark?: string;
    performedBy: Types.ObjectId;
    metadata?: Record<string, unknown>;
  }) => {
    return LeadActivityModel.create(data);
  },

  countByFilter: async (filter: FilterQuery<ILead>) => {
    return LeadModel.countDocuments({ ...filter, deletedAt: null });
  },

  countFollowUpsDue: async (filter: FilterQuery<ILead>, date: Date, type: 'today' | 'tomorrow' | 'overdue') => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tomorrowStart = new Date(startOfDay);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const baseQuery: FilterQuery<ILead> = { ...filter, deletedAt: null };

    if (type === 'today') {
      baseQuery.nextFollowUpDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (type === 'tomorrow') {
      baseQuery.nextFollowUpDate = { $gte: tomorrowStart, $lte: tomorrowEnd };
    } else {
      baseQuery.nextFollowUpDate = { $lt: startOfDay };
      baseQuery.status = { $in: ACTIVE_LEAD_STATUSES };
    }

    return LeadModel.countDocuments(baseQuery);
  },
};

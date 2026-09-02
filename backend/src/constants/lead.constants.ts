export const LEAD_CATEGORIES = ['buy_property', 'sell_property', 'rent_property'] as const;
export type LeadCategory = (typeof LEAD_CATEGORIES)[number];

export const LEAD_PRIORITIES = ['hot', 'warm', 'cold'] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const LEAD_STATUSES = ['open', 'hold', 'pending', 'booked', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ACTIVE_LEAD_STATUSES = [
  'open',
  'hold',
  'pending',
  'new',
  'contacted',
  'follow_up',
  'visit_scheduled',
  'revisit_scheduled',
  'negotiation',
] as const;

export const CLOSED_LEAD_STATUSES = ['closed', 'booked', 'closed_won', 'closed_lost'] as const;

export const LEAD_STATUS_BUCKETS: Record<LeadStatus, readonly string[]> = {
  open: ['open', 'new', 'contacted'],
  hold: ['hold'],
  pending: ['pending', 'follow_up', 'visit_scheduled', 'revisit_scheduled', 'negotiation'],
  booked: ['booked', 'closed_won'],
  closed: ['closed', 'closed_lost'],
};

export const FOLLOW_UP_TYPES = [
  'call',
  'whatsapp',
  'meeting',
  'property_visit',
  'revisit',
  'site_visit',
  'email',
  'negotiation',
] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

export const LEAD_ACTIVITY_TYPES = [
  'LEAD_CREATED',
  'LEAD_ASSIGNED',
  'LEAD_TRANSFERRED',
  'STATUS_CHANGED',
  'FOLLOW_UP_ADDED',
  'CALL_DONE',
  'VISIT_SCHEDULED',
  'VISIT_COMPLETED',
  'REVISIT_COMPLETED',
  'NEGOTIATION_STARTED',
  'LEAD_CLOSED',
  'NOTE_ADDED',
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

export const STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  open: ['hold', 'pending', 'booked', 'closed'],
  hold: ['open', 'pending', 'booked', 'closed'],
  pending: ['open', 'hold', 'booked', 'closed'],
  booked: ['open', 'hold'],
  closed: ['open', 'hold'],
};

export const CATEGORY_LABELS: Record<LeadCategory, string> = {
  buy_property: 'Buy Property',
  sell_property: 'Sell Property',
  rent_property: 'Rent Property',
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  open: 'Open',
  hold: 'Hold',
  pending: 'Pending',
  booked: 'Booked',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
};

export const LEAD_CATEGORIES = ['buy_property', 'sell_property', 'rent_property'] as const;
export type LeadCategory = (typeof LEAD_CATEGORIES)[number];

export const LEAD_PRIORITIES = ['hot', 'warm', 'cold'] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'follow_up',
  'visit_scheduled',
  'revisit_scheduled',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ACTIVE_LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'follow_up',
  'visit_scheduled',
  'revisit_scheduled',
  'negotiation',
];

export const CLOSED_LEAD_STATUSES: LeadStatus[] = ['closed_won', 'closed_lost'];

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
  new: ['contacted', 'closed_lost'],
  contacted: ['follow_up', 'closed_lost'],
  follow_up: ['visit_scheduled', 'negotiation', 'closed_lost'],
  visit_scheduled: ['revisit_scheduled', 'negotiation', 'closed_lost'],
  revisit_scheduled: ['negotiation', 'closed_lost'],
  negotiation: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
};

export const CATEGORY_LABELS: Record<LeadCategory, string> = {
  buy_property: 'Buy Property',
  sell_property: 'Sell Property',
  rent_property: 'Rent Property',
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow-Up',
  visit_scheduled: 'Visit Scheduled',
  revisit_scheduled: 'Re-Visit Scheduled',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
};

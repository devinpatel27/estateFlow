'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarPlus,
  ChevronDown,
  Flame,
  Handshake,
  Home,
  Loader2,
  MapPinned,
  MessageCircle,
  Phone,
  RotateCcw,
  Snowflake,
  ThermometerSun,
  Users,
} from 'lucide-react';
import { ModalShell } from '@/components/common/ModalShell';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/common/DatePicker';
import { followUpSchema, FollowUpFormValues } from '../schemas/lead.schema';
import { masterService } from '../services/master.service';
import { FollowUpActivity } from '../types/lead.types';
import { cn } from '@/lib/utils';

interface FollowUpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FollowUpFormValues) => Promise<void>;
}

const followUpTypeIcons: Record<string, React.ElementType> = {
  call: Phone,
  whatsapp: MessageCircle,
  meeting: Users,
  property_visit: Home,
  revisit: RotateCcw,
  site_visit: MapPinned,
  negotiation: Handshake,
};

const fallbackActivities: FollowUpActivity[] = [
  { _id: 'call', name: 'Phone Call', slug: 'phone_call', status: 'active', sortOrder: 1, children: [] },
  { _id: 'visit', name: 'Visit', slug: 'visit', status: 'active', sortOrder: 2, children: [] },
  { _id: 'meeting', name: 'Meeting', slug: 'meeting', status: 'active', sortOrder: 3, children: [] },
  { _id: 'deal', name: 'Deal', slug: 'deal', status: 'active', sortOrder: 4, children: [] },
];

const priorities = [
  { value: 'hot', label: 'Hot', icon: Flame, className: 'data-[active=true]:border-red-500 data-[active=true]:bg-red-500 data-[active=true]:text-white' },
  { value: 'warm', label: 'Warm', icon: ThermometerSun, className: 'data-[active=true]:border-amber-500 data-[active=true]:bg-amber-500 data-[active=true]:text-white' },
  { value: 'cold', label: 'Cold', icon: Snowflake, className: 'data-[active=true]:border-sky-500 data-[active=true]:bg-sky-500 data-[active=true]:text-white' },
] as const;

function inferFollowUpType(parentName = '', childName = ''): FollowUpFormValues['type'] {
  const text = `${parentName} ${childName}`.toLowerCase();
  if (text.includes('whatsapp')) return 'whatsapp';
  if (text.includes('meeting')) return 'meeting';
  if (text.includes('revisit') || text.includes('re-visit')) return 'revisit';
  if (text.includes('site visit')) return 'site_visit';
  if (text.includes('visit')) return 'property_visit';
  if (text.includes('deal') || text.includes('negotiation')) return 'negotiation';
  return 'call';
}

export function FollowUpForm({ open, onOpenChange, onSubmit }: FollowUpFormProps) {
  const [activities, setActivities] = useState<FollowUpActivity[]>(fallbackActivities);
  const [expandedParent, setExpandedParent] = useState('');
  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      followUpDate: new Date().toISOString().split('T')[0],
      type: 'call',
      priority: 'warm',
      parentActivity: '',
      childActivity: '',
      remark: '',
      nextFollowUpDate: '',
    },
  });
  const parentActivity = form.watch('parentActivity');
  const childActivity = form.watch('childActivity');

  useEffect(() => {
    if (!open) return;
    masterService.listFollowUpActivities(true)
      .then((res) => {
        const next = res.data?.length ? res.data : fallbackActivities;
        setActivities(next);
        const first = next[0];
        if (!form.getValues('parentActivity') && first) {
          form.setValue('parentActivity', first._id);
          form.setValue('type', inferFollowUpType(first.name));
          setExpandedParent(first._id);
        }
      })
      .catch(() => setActivities(fallbackActivities));
  }, [form, open]);

  const selectedParent = useMemo(
    () => activities.find((activity) => activity._id === parentActivity),
    [activities, parentActivity]
  );

  const handleSubmit = async (values: FollowUpFormValues) => {
    await onSubmit(values);
    form.reset({
      followUpDate: new Date().toISOString().split('T')[0],
      type: 'call',
      priority: 'warm',
      parentActivity: '',
      childActivity: '',
      remark: '',
      nextFollowUpDate: '',
    });
    onOpenChange(false);
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Follow-Up"
      description="Record a follow-up activity for this lead"
      icon={CalendarPlus}
      maxWidth="sm:max-w-2xl"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField control={form.control} name="followUpDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Follow-up Date <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select follow-up date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="priority" render={({ field }) => (
            <FormItem>
              <FormLabel>Lead Status <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <div role="radiogroup" aria-label="Lead status" className="grid grid-cols-3 gap-2">
                  {priorities.map((priority) => {
                    const Icon = priority.icon;
                    const active = field.value === priority.value;
                    return (
                      <button
                        key={priority.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        data-active={active}
                        onClick={() => field.onChange(priority.value)}
                        className={cn(
                          'flex h-11 items-center justify-center gap-2 rounded-xl border bg-background text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/60',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
                          priority.className
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{priority.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="parentActivity" render={({ field }) => (
            <FormItem>
              <FormLabel>Activity <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {activities.map((activity) => {
                    const Icon = followUpTypeIcons[inferFollowUpType(activity.name)] || CalendarPlus;
                    const active = field.value === activity._id;
                    const children = activity.children || [];
                    return (
                      <div key={activity._id} className={cn('overflow-hidden rounded-xl border', active ? 'border-primary/70 bg-primary/5' : 'border-border bg-background')}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                          onClick={() => {
                            field.onChange(activity._id);
                            form.setValue('childActivity', '');
                            form.setValue('type', inferFollowUpType(activity.name));
                            setExpandedParent(expandedParent === activity._id ? '' : activity._id);
                          }}
                        >
                          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 text-sm font-semibold">{activity.name}</span>
                          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expandedParent === activity._id && 'rotate-180')} />
                        </button>
                        {expandedParent === activity._id && children.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 border-t border-border/70 p-2 sm:grid-cols-2">
                            {children.map((child) => {
                              const selected = childActivity === child._id;
                              return (
                                <button
                                  key={child._id}
                                  type="button"
                                  onClick={() => {
                                    form.setValue('childActivity', child._id);
                                    form.setValue('type', inferFollowUpType(activity.name, child.name));
                                  }}
                                  className={cn(
                                    'min-h-10 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors',
                                    selected
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                  )}
                                >
                                  {child.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="remark" render={({ field }) => (
            <FormItem>
              <FormLabel>Remark{selectedParent ? <span className="ml-2 text-xs font-normal text-muted-foreground">for {selectedParent.name}</span> : null}</FormLabel>
              <FormControl><textarea className="crm-input min-h-[70px] w-full resize-y px-3 py-2" placeholder="What was discussed..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="nextFollowUpDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Next Follow-up Date</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select next follow-up date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="crm-btn-primary crm-btn-interactive flex-1 gap-2" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Follow-Up
            </Button>
            <Button type="button" variant="outline" className="crm-btn-interactive" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </ModalShell>
  );
}

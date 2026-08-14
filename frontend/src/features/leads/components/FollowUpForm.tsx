'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CalendarPlus } from 'lucide-react';
import { ModalShell } from '@/components/common/ModalShell';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/common/DatePicker';
import { FilterTabs } from '@/components/common/FilterTabs';
import { followUpSchema, FollowUpFormValues } from '../schemas/lead.schema';
import { FOLLOW_UP_TYPES } from '@/lib/constants';

interface FollowUpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FollowUpFormValues) => Promise<void>;
}

export function FollowUpForm({ open, onOpenChange, onSubmit }: FollowUpFormProps) {
  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      followUpDate: new Date().toISOString().split('T')[0],
      type: 'call',
      remark: '',
      nextFollowUpDate: '',
    },
  });

  const handleSubmit = async (values: FollowUpFormValues) => {
    await onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Follow-Up"
      description="Record a follow-up activity for this lead"
      icon={CalendarPlus}
      maxWidth="sm:max-w-xl"
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
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <FilterTabs
                  aria-label="Follow-up type"
                  value={field.value}
                  onChange={field.onChange}
                  options={FOLLOW_UP_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                  className="flex h-auto min-h-0 w-full flex-wrap gap-1 rounded-xl p-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="remark" render={({ field }) => (
            <FormItem>
              <FormLabel>Remark</FormLabel>
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

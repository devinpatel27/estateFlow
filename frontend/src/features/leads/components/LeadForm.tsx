'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, Target, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { BudgetRangeInput } from '@/components/common/BudgetRangeInput';
import { createLeadSchema, updateLeadSchema, CreateLeadFormValues } from '../schemas/lead.schema';
import { leadService } from '../services/lead.service';
import { masterService } from '../services/master.service';
import { employeeService } from '@/features/employees/services/employee.service';
import { Lead, MasterItem } from '../types/lead.types';
import { Employee } from '@/features/employees/types/employee.types';
import { LEAD_CATEGORIES, LEAD_PRIORITIES, ROUTES, PERMISSIONS } from '@/lib/constants';
import { cn, normalizeMobileInput } from '@/lib/utils';
import { DuplicateLeadAlert } from './DuplicateLeadAlert';
import { usePermissions } from '@/hooks/usePermissions';

interface LeadFormProps {
  lead?: Lead;
  mode: 'create' | 'edit';
  variant?: 'page' | 'modal';
  onSuccess?: () => void;
  onCancel?: () => void;
}

function FormSection({ icon: Icon, title, children, compact }: { icon: React.ElementType; title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn('crm-form-section', compact && 'p-4')}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function LeadForm({ lead, mode, variant = 'page', onSuccess, onCancel }: LeadFormProps) {
  const [propertyTypes, setPropertyTypes] = useState<MasterItem[]>([]);
  const [leadSources, setLeadSources] = useState<MasterItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const isModal = variant === 'modal';
  const { hasPermission, isReady } = usePermissions();
  const canAssignOnCreate = isReady && hasPermission(PERMISSIONS.LEAD_CREATE) && hasPermission(PERMISSIONS.EMPLOYEE_READ);

  const schema = mode === 'create' ? createLeadSchema : updateLeadSchema;

  const form = useForm<CreateLeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'edit' && lead ? {
      customerName: lead.customerName,
      mobile: lead.mobile,
      alternateMobile: lead.alternateMobile || '',
      email: lead.email || '',
      city: lead.city || '',
      address: lead.address || '',
      category: lead.category as CreateLeadFormValues['category'],
      propertyType: typeof lead.propertyType === 'object' ? lead.propertyType._id : lead.propertyType,
      leadSource: typeof lead.leadSource === 'object' ? lead.leadSource._id : lead.leadSource,
      budgetMin: lead.budgetMin,
      budgetMax: lead.budgetMax,
      preferredArea: lead.preferredArea || '',
      assignedTo: lead.assignedTo?._id || '',
      priority: lead.priority,
      initialRemark: lead.initialRemark || '',
    } : {
      customerName: '', mobile: '', alternateMobile: '', email: '', city: '', address: '',
      category: 'buy_property', propertyType: '', leadSource: '', preferredArea: '',
      assignedTo: '', priority: 'warm', initialRemark: '',
    },
  });

  useEffect(() => {
    const loaders: Promise<unknown>[] = [
      masterService.listPropertyTypes(true),
      masterService.listLeadSources(true),
    ];

    if (canAssignOnCreate && mode === 'create') {
      loaders.push(employeeService.list({ status: 'active', limit: 100 }));
    }

    Promise.all(loaders).then((results) => {
      const [pt, ls, emp] = results as [
        Awaited<ReturnType<typeof masterService.listPropertyTypes>>,
        Awaited<ReturnType<typeof masterService.listLeadSources>>,
        Awaited<ReturnType<typeof employeeService.list>> | undefined,
      ];
      if (pt.success) setPropertyTypes(pt.data || []);
      if (ls.success) setLeadSources(ls.data || []);
      if (emp?.success) setEmployees(emp.data || []);
    }).catch(() => {
      /* masters still load individually if employee list fails */
    });
  }, [canAssignOnCreate, mode]);

  const checkMobileDuplicate = async (mobile: string) => {
    if (mode !== 'create' || mobile.length < 10) return;
    try {
      const res = await leadService.checkMobile(mobile);
      if (res.success && res.data?.activeLead) {
        setDuplicateLead(res.data.activeLead);
      } else {
        setDuplicateLead(null);
      }
    } catch { /* ignore */ }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.back();
  };

  const onSubmit = async (values: CreateLeadFormValues) => {
    if (duplicateLead && mode === 'create') {
      toast.error('Lead already exists for this mobile number');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        mobile: normalizeMobileInput(values.mobile),
        alternateMobile: values.alternateMobile ? normalizeMobileInput(values.alternateMobile) : undefined,
        budgetMin: values.budgetMin ? Number(values.budgetMin) : undefined,
        budgetMax: values.budgetMax ? Number(values.budgetMax) : undefined,
        assignedTo: values.assignedTo || undefined,
        email: values.email || undefined,
      };
      if (mode === 'create') {
        await leadService.create(payload);
        toast.success('Lead created successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(ROUTES.LEADS);
        }
      } else {
        await leadService.update(lead!._id, payload);
        toast.success('Lead updated successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(ROUTES.LEAD_DETAIL(lead!._id));
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error?.response?.data?.message === 'Lead already exists.') {
        toast.error('Lead already exists.');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to save lead');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          isModal ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto max-w-4xl space-y-5'
        )}
      >
        <div className={cn(isModal && 'min-h-0 flex-1 space-y-5 overflow-y-auto pr-1', !isModal && 'space-y-5')}>
        {duplicateLead && <DuplicateLeadAlert activeLead={duplicateLead} onDismiss={() => setDuplicateLead(null)} />}

        <FormSection icon={Target} title="Lead Information" compact={isModal}>
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {LEAD_CATEGORIES.map((category) => (
                    <label
                      key={category.value}
                      className={cn(
                        'cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                        field.value === category.value
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border bg-background hover:border-primary/40'
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        value={category.value}
                        checked={field.value === category.value}
                        disabled={isSubmitting}
                        onChange={() => field.onChange(category.value)}
                      />
                      {category.shortLabel}
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection icon={Briefcase} title="Lead Management" compact={isModal}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField control={form.control} name="propertyType" render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={propertyTypes.map((item) => ({ value: item._id, label: item.name }))}
                    placeholder="Select property type"
                    searchPlaceholder="Search property types..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="leadSource" render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Source <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={leadSources.map((item) => ({ value: item._id, label: item.name }))}
                    placeholder="Select lead source"
                    searchPlaceholder="Search lead sources..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={LEAD_PRIORITIES.map((item) => ({ value: item.value, label: item.label }))}
                    placeholder="Select priority"
                    searchPlaceholder="Search priority..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="budgetMin" render={() => (
              <FormItem className="md:col-span-2">
                <FormLabel>Budget Range</FormLabel>
                <FormControl>
                  <BudgetRangeInput
                    minValue={form.watch('budgetMin')}
                    maxValue={form.watch('budgetMax')}
                    onMinChange={(v) => form.setValue('budgetMin', v, { shouldValidate: true })}
                    onMaxChange={(v) => form.setValue('budgetMax', v, { shouldValidate: true })}
                    disabled={isSubmitting}
                  />
                </FormControl>
                {(form.formState.errors.budgetMin?.message || form.formState.errors.budgetMax?.message) && (
                  <p className="text-sm font-medium text-destructive">
                    {String(form.formState.errors.budgetMin?.message || form.formState.errors.budgetMax?.message)}
                  </p>
                )}
              </FormItem>
            )} />
            <FormField control={form.control} name="preferredArea" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Area</FormLabel>
                <FormControl><Input className="crm-input" placeholder="Preferred location" disabled={isSubmitting} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {mode === 'create' && canAssignOnCreate && (
              <FormField control={form.control} name="assignedTo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To Employee</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={employees.map((employee) => ({
                        value: employee._id,
                        label: `${employee.name} (${employee.employeeId})`,
                      }))}
                      placeholder="Select employee"
                      searchPlaceholder="Search employees..."
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <div className="md:col-span-2">
              <FormField control={form.control} name="initialRemark" render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Remark</FormLabel>
                  <FormControl>
                    <textarea
                      className="crm-input min-h-[80px] w-full resize-y px-3 py-2"
                      placeholder="Initial notes about this lead..."
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        </FormSection>

        <FormSection icon={User} title="Customer Information" compact={isModal}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField control={form.control} name="customerName" render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input className="crm-input" placeholder="Customer name" disabled={isSubmitting} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="mobile" render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input className="crm-input" placeholder="9876543210" disabled={isSubmitting || mode === 'edit'} {...field}
                    onBlur={(e) => { field.onBlur(); checkMobileDuplicate(e.target.value); }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="alternateMobile" render={({ field }) => (
              <FormItem>
                <FormLabel>Alternate Mobile</FormLabel>
                <FormControl><Input className="crm-input" placeholder="Alternate mobile" disabled={isSubmitting} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input className="crm-input" type="email" placeholder="email@example.com" disabled={isSubmitting} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl><Input className="crm-input" placeholder="City" disabled={isSubmitting} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="md:col-span-2">
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input className="crm-input" placeholder="Street address" disabled={isSubmitting} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        </FormSection>
        </div>

        <div
          className={cn(
            'flex items-center gap-3',
            isModal && 'shrink-0 border-t border-border/60 bg-background/95 px-0 pt-4 backdrop-blur-sm',
            !isModal && 'pt-1'
          )}
        >
          <Button type="submit" disabled={isSubmitting || !!duplicateLead} className="crm-btn-primary gap-2 rounded-xl px-6">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Lead' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

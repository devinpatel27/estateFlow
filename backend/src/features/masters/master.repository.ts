import { PropertyTypeModel } from '../../models/PropertyType.model';
import { LeadSourceModel } from '../../models/LeadSource.model';

const toSlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

export const masterRepository = {
  findAllPropertyTypes: async (activeOnly = false) => {
    const query = activeOnly ? { status: 'active' } : {};
    return PropertyTypeModel.find(query).sort({ sortOrder: 1, name: 1 }).lean();
  },

  findPropertyTypeById: async (id: string) => PropertyTypeModel.findById(id),

  createPropertyType: async (data: { name: string; status?: string; sortOrder?: number }) => {
    const slug = toSlug(data.name);
    return PropertyTypeModel.create({ ...data, slug });
  },

  updatePropertyType: async (id: string, data: Partial<{ name: string; status: string; sortOrder: number }>) => {
    const update = { ...data };
    if (data.name) (update as { slug?: string }).slug = toSlug(data.name);
    return PropertyTypeModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  deletePropertyType: async (id: string) => PropertyTypeModel.findByIdAndDelete(id),

  findAllLeadSources: async (activeOnly = false) => {
    const query = activeOnly ? { status: 'active' } : {};
    return LeadSourceModel.find(query).sort({ sortOrder: 1, name: 1 }).lean();
  },

  findLeadSourceById: async (id: string) => LeadSourceModel.findById(id),

  createLeadSource: async (data: { name: string; status?: string; sortOrder?: number }) => {
    const slug = toSlug(data.name);
    return LeadSourceModel.create({ ...data, slug });
  },

  updateLeadSource: async (id: string, data: Partial<{ name: string; status: string; sortOrder: number }>) => {
    const update = { ...data };
    if (data.name) (update as { slug?: string }).slug = toSlug(data.name);
    return LeadSourceModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  deleteLeadSource: async (id: string) => LeadSourceModel.findByIdAndDelete(id),
};

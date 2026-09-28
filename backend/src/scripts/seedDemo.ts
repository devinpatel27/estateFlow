import mongoose, { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedAdmin } from './seedAdmin';
import { seedMasters } from './seedMasters';
import { hashPassword } from '../utils/bcrypt.utils';
import { RoleModel } from '../models/Role.model';
import { UserModel } from '../models/User.model';
import { PropertyTypeModel } from '../models/PropertyType.model';
import { LeadSourceModel } from '../models/LeadSource.model';
import { PropertyAmenityModel } from '../models/PropertyAmenity.model';
import { PropertyModel } from '../models/Property.model';
import { LeadModel } from '../models/Lead.model';
import { LeadAssignmentModel } from '../models/LeadAssignment.model';
import { LeadFollowUpModel } from '../models/LeadFollowUp.model';
import { LeadActivityModel } from '../models/LeadActivity.model';
import { VisitModel } from '../models/Visit.model';

const DEMO_EMAIL = 'demo@estateflow.com';
const DEMO_PASSWORD = 'Demo@12345';

const daysFromNow = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function upsertUser(data: Record<string, unknown>, roleId: Types.ObjectId) {
  const password = await hashPassword(DEMO_PASSWORD);
  return UserModel.findOneAndUpdate(
    { email: data.email },
    {
      ...data,
      password,
      role: roleId,
      status: 'active',
      forcePasswordChange: false,
      joiningDate: daysFromNow(-180),
    },
    { upsert: true, new: true }
  );
}

export const seedDemo = async () => {
  await seedAdmin();
  const mastersReady =
    (await PropertyTypeModel.countDocuments()) >= 11 &&
    (await LeadSourceModel.countDocuments()) >= 14 &&
    (await PropertyAmenityModel.countDocuments()) >= 10;
  if (!mastersReady) await seedMasters();

  const adminRole = await RoleModel.findOne({ roleName: 'master_admin' });
  const employeeRole = await RoleModel.findOne({ roleName: 'employee' });
  if (!adminRole || !employeeRole) throw new Error('Required roles were not seeded');

  const demoAdmin = await upsertUser(
    {
      employeeId: 'DEMO000',
      name: 'EstateFlow Demo Admin',
      email: DEMO_EMAIL,
      mobile: '9876500000',
      city: 'Ahmedabad',
      state: 'Gujarat',
    },
    adminRole._id
  );

  const employeeRows = [
    ['DEMO101', 'Aarav Shah', 'aarav@estateflow.com', '9876500101'],
    ['DEMO102', 'Diya Patel', 'diya@estateflow.com', '9876500102'],
    ['DEMO103', 'Kabir Mehta', 'kabir@estateflow.com', '9876500103'],
  ];
  const employees = [];
  for (const [employeeId, name, email, mobile] of employeeRows) {
    employees.push(await upsertUser({ employeeId, name, email, mobile, city: 'Ahmedabad', state: 'Gujarat' }, employeeRole._id));
  }

  const flatType = await PropertyTypeModel.findOne({ slug: 'flat' });
  const villaType = await PropertyTypeModel.findOne({ slug: 'villa' });
  const plotType = await PropertyTypeModel.findOne({ slug: 'plot' });
  const websiteSource = await LeadSourceModel.findOne({ slug: 'website' });
  const referralSource = await LeadSourceModel.findOne({ slug: 'referral' });
  const walkInSource = await LeadSourceModel.findOne({ slug: 'walkin' });
  const amenities = await PropertyAmenityModel.find({ status: 'active' }).limit(5).lean();
  if (!flatType || !villaType || !plotType || !websiteSource || !referralSource || !walkInSource) {
    throw new Error('Required master data was not seeded');
  }

  const propertyRows = [
    { propertyCode: 'DEMO-P001', title: 'Skyline 3 BHK Residence', slug: 'demo-skyline-3-bhk', purpose: 'sell', propertyType: flatType._id, status: 'available', expectedPrice: 8500000, area: 'Prahlad Nagar', bedrooms: 3, bathrooms: 3, superBuiltUpArea: 1850, furnishedStatus: 'semi_furnished' },
    { propertyCode: 'DEMO-P002', title: 'Garden View Family Villa', slug: 'demo-garden-view-villa', purpose: 'sell', propertyType: villaType._id, status: 'available', expectedPrice: 17500000, area: 'Bopal', bedrooms: 4, bathrooms: 4, superBuiltUpArea: 3200, furnishedStatus: 'unfurnished' },
    { propertyCode: 'DEMO-P003', title: 'Corner Residential Plot', slug: 'demo-corner-residential-plot', purpose: 'sell', propertyType: plotType._id, status: 'available', expectedPrice: 6200000, area: 'Shela', superBuiltUpArea: 1800 },
    { propertyCode: 'DEMO-P004', title: 'Furnished 2 BHK for Rent', slug: 'demo-furnished-2-bhk-rent', purpose: 'rent', propertyType: flatType._id, status: 'available', rentAmount: 32000, securityDeposit: 64000, area: 'Satellite', bedrooms: 2, bathrooms: 2, superBuiltUpArea: 1250, furnishedStatus: 'furnished' },
  ];

  const properties = [];
  for (const row of propertyRows) {
    properties.push(await PropertyModel.findOneAndUpdate(
      { propertyCode: row.propertyCode },
      {
        ...row,
        description: 'Curated demonstration inventory for the EstateFlow CRM.',
        country: 'India', state: 'Gujarat', city: 'Ahmedabad',
        amenities: amenities.map((item) => item._id), gallery: [], videos: [], floorPlans: [],
        publishOnWebsite: true, isFeatured: row.propertyCode === 'DEMO-P001', showPrice: true,
        hideExactLocation: true, inquiryCount: 0, viewCount: 24, createdBy: demoAdmin._id, deletedAt: null,
      },
      { upsert: true, new: true }
    ));
  }

  const customers = [
    ['DEMO-L001', 'Rohan Desai', '9000001001', '3 BHK', 'Prahlad Nagar', 'hot', 'open', flatType, websiteSource, 7000000, 9000000],
    ['DEMO-L002', 'Nisha Joshi', '9000001002', '4 BHK', 'Bopal', 'warm', 'open', villaType, referralSource, 14000000, 19000000],
    ['DEMO-L003', 'Manav Trivedi', '9000001003', '2 BHK', 'Satellite', 'warm', 'hold', flatType, walkInSource, 25000, 40000],
    ['DEMO-L004', 'Isha Rana', '9000001004', 'Plot', 'Shela', 'cold', 'open', plotType, websiteSource, 5000000, 7000000],
    ['DEMO-L005', 'Vivaan Bhatt', '9000001005', '3 BHK', 'Thaltej', 'hot', 'booked', flatType, referralSource, 8000000, 10000000],
    ['DEMO-L006', 'Myra Shah', '9000001006', 'Villa', 'Ambli', 'cold', 'closed', villaType, walkInSource, 15000000, 22000000],
    ['DEMO-L007', 'Aditya Patel', '9000001007', '2 BHK', 'South Bopal', 'warm', 'open', flatType, websiteSource, 5500000, 7500000],
    ['DEMO-L008', 'Anaya Mehta', '9000001008', '3 BHK', 'Science City', 'hot', 'open', flatType, referralSource, 9000000, 12000000],
  ] as const;

  for (let index = 0; index < customers.length; index++) {
    const [leadId, customerName, mobile, propertyConfiguration, preferredArea, priority, status, propertyType, leadSource, budgetMin, budgetMax] = customers[index];
    let lead = await LeadModel.findOne({ leadId });
    const assignedTo = employees[index % employees.length];
    if (!lead) {
      lead = await LeadModel.create({
        leadId, customerName, mobile, email: `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        city: 'Ahmedabad', category: index === 2 ? 'rent_property' : 'buy_property', propertyType: propertyType._id,
        propertyConfiguration, leadSource: leadSource._id, budgetMin, budgetMax, preferredArea, priority, status,
        initialRemark: 'Demo inquiry created for product walkthrough.', notes: [], assignedTo: assignedTo._id,
        assignedAt: daysFromNow(-12 + index), nextFollowUpDate: status === 'open' ? daysFromNow(index % 3) : undefined,
        propertyId: properties[index % properties.length]._id, createdBy: demoAdmin._id, deletedAt: null,
      });
    }

    let assignment = await LeadAssignmentModel.findOne({ leadId: lead._id, isCurrent: true });
    if (!assignment) {
      assignment = await LeadAssignmentModel.create({ leadId: lead._id, assignedTo: assignedTo._id, assignedBy: demoAdmin._id, assignedAt: daysFromNow(-12 + index), isCurrent: true, sequence: 1 });
      await LeadModel.findByIdAndUpdate(lead._id, { currentAssignmentId: assignment._id }, { new: true });
    }

    if (await LeadFollowUpModel.countDocuments({ leadId: lead._id }) === 0) {
      await LeadFollowUpModel.create({ leadId: lead._id, assignmentId: assignment._id, followUpDate: daysFromNow(-3 + (index % 4)), type: index % 2 ? 'whatsapp' : 'call', priority, remark: 'Discussed requirement and shared matching options.', nextFollowUpDate: status === 'open' ? daysFromNow(index % 3) : undefined, createdBy: assignedTo._id });
      await LeadActivityModel.create({ leadId: lead._id, assignmentId: assignment._id, type: 'FOLLOW_UP_ADDED', title: 'Follow-up added', remark: 'Discussed requirement and shared matching options.', performedBy: assignedTo._id });
    }

    if (index < 4 && await VisitModel.countDocuments({ leadId: lead._id }) === 0) {
      await VisitModel.create({ leadId: lead._id, assignmentId: assignment._id, type: index === 1 ? 'revisit' : 'property_visit', scheduledDate: daysFromNow(index - 1, 11 + index), scheduledTime: `${11 + index}:00`, status: index === 0 ? 'completed' : 'scheduled', remark: 'Demo property visit', source: 'manual', createdBy: assignedTo._id });
    }
  }

  console.log(`Demo data ready. Login: ${DEMO_EMAIL}`);
};

if (require.main === module) {
  connectDatabase()
    .then(seedDemo)
    .then(disconnectDatabase)
    .catch(async (error) => {
      console.error('Demo seed failed:', error);
      if (mongoose.connection.readyState) await disconnectDatabase();
      process.exit(1);
    });
}

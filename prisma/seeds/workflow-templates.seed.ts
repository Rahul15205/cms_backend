import 'dotenv/config'; // PHASE 2 CHANGE
import { PrismaClient, RightsRequestType, Regulation } from '@prisma/client'; // PHASE 2 CHANGE

const prisma = new PrismaClient(); // PHASE 2 CHANGE

// PHASE 2 CHANGE
const defaultTemplates = [
  {
    type: RightsRequestType.ERASURE,
    regulation: Regulation.GDPR,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Scope Assessment', order: 3, assignedRole: 'HANDLER', slaHours: 48 },
      { name: 'Data Deletion Triggered', order: 4, assignedRole: 'SYSTEM', slaHours: 72 },
      { name: 'Deletion Confirmed', order: 5, assignedRole: 'HANDLER', slaHours: 48 },
      { name: 'Response Delivered', order: 6, assignedRole: 'HANDLER', slaHours: 24 },
    ]
  },
  {
    type: RightsRequestType.ACCESS,
    regulation: Regulation.GDPR,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Data Compilation', order: 3, assignedRole: 'SYSTEM', slaHours: 72 },
      { name: 'DPO Review', order: 4, assignedRole: 'DPO', slaHours: 48 },
      { name: 'DSAR Pack Delivered', order: 5, assignedRole: 'HANDLER', slaHours: 24 },
    ]
  },
  {
    type: RightsRequestType.ACCESS,
    regulation: Regulation.DPDP,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Aadhaar Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Data Compilation', order: 3, assignedRole: 'SYSTEM', slaHours: 72 },
      { name: 'DPO Review', order: 4, assignedRole: 'DPO', slaHours: 48 },
      { name: 'DSAR Pack Delivered', order: 5, assignedRole: 'HANDLER', slaHours: 24 },
    ]
  },
  {
    type: RightsRequestType.ERASURE,
    regulation: Regulation.DPDP,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Aadhaar Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Scope Assessment', order: 3, assignedRole: 'HANDLER', slaHours: 48 },
      { name: 'Data Deletion Triggered', order: 4, assignedRole: 'SYSTEM', slaHours: 72 },
      { name: 'Deletion Confirmed', order: 5, assignedRole: 'HANDLER', slaHours: 48 },
      { name: 'Response Delivered', order: 6, assignedRole: 'HANDLER', slaHours: 24 },
    ]
  },
  {
    type: RightsRequestType.GRIEVANCE_REDRESSAL,
    regulation: Regulation.DPDP,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Grievance Team Assignment', order: 3, assignedRole: 'TEAM_LEAD', slaHours: 24 },
      { name: 'Investigation', order: 4, assignedRole: 'HANDLER', slaHours: 96 },
      { name: 'Resolution Drafted', order: 5, assignedRole: 'DPO', slaHours: 48 },
      { name: 'Response Delivered', order: 6, assignedRole: 'HANDLER', slaHours: 24 },
    ]
  },
  {
    type: RightsRequestType.FILE_COMPLAINT,
    regulation: Regulation.GDPR,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Complaint Investigation', order: 3, assignedRole: 'DPO', slaHours: 120 },
      { name: 'Legal Review', order: 4, assignedRole: 'DPO', slaHours: 72 },
      { name: 'Formal Response Issued', order: 5, assignedRole: 'DPO', slaHours: 24 },
    ]
  },
  {
    type: RightsRequestType.CORRECTION,
    regulation: Regulation.GDPR,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Data Identification', order: 3, assignedRole: 'HANDLER', slaHours: 48 },
      { name: 'Correction Applied', order: 4, assignedRole: 'HANDLER', slaHours: 72 },
      { name: 'Requester Confirmation', order: 5, assignedRole: 'HANDLER', slaHours: 48 },
      { name: 'Case Closed', order: 6, assignedRole: null, slaHours: null },
    ]
  },
  {
    type: RightsRequestType.WITHDRAW_CONSENT,
    regulation: Regulation.GDPR,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Consent Records Located', order: 3, assignedRole: 'SYSTEM', slaHours: 24 },
      { name: 'Consent Revoked', order: 4, assignedRole: 'SYSTEM', slaHours: 48 },
      { name: 'Downstream Systems Notified', order: 5, assignedRole: 'SYSTEM', slaHours: 24 },
      { name: 'Confirmation Sent', order: 6, assignedRole: 'HANDLER', slaHours: 24 },
    ]
  },
  {
    type: RightsRequestType.NOMINATE,
    regulation: Regulation.DPDP,
    steps: [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Requester Identity Verified', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'Nominee Identity Verified', order: 3, assignedRole: 'HANDLER', slaHours: 48 },
      { name: 'Nomination Linked', order: 4, assignedRole: 'SYSTEM', slaHours: 24 },
      { name: 'Confirmation Sent', order: 5, assignedRole: 'HANDLER', slaHours: 24 },
    ]
  }
];

async function main() {
  console.log('Seeding default workflow templates...');

  // Get first tenant or create default tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Acme Corp',
        domain: 'acme.com',
        status: 'ACTIVE',
        settings: {},
      },
    });
  }

  for (const templateData of defaultTemplates) {
    console.log(`Upserting template for ${templateData.type} + ${templateData.regulation}...`);
    
    // Check if template exists
    const existing = await prisma.workflowTemplate.findUnique({
      where: {
        type_regulation_tenantId: {
          type: templateData.type,
          regulation: templateData.regulation,
          tenantId: tenant.id,
        },
      },
    });

    if (existing) {
      // Clear existing steps
      await prisma.workflowTemplateStep.deleteMany({
        where: { templateId: existing.id },
      });

      // Insert new steps
      await prisma.workflowTemplateStep.createMany({
        data: templateData.steps.map(step => ({
          templateId: existing.id,
          name: step.name,
          order: step.order,
          assignedRole: step.assignedRole,
          slaHours: step.slaHours,
        })),
      });
    } else {
      // Create new template with steps
      await prisma.workflowTemplate.create({
        data: {
          tenantId: tenant.id,
          type: templateData.type,
          regulation: templateData.regulation,
          isDefault: true,
          steps: {
            create: templateData.steps.map(step => ({
              name: step.name,
              order: step.order,
              assignedRole: step.assignedRole,
              slaHours: step.slaHours,
            })),
          },
        },
      });
    }
  }

  console.log('Workflow templates seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

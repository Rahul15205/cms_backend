const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function seedUsageData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Get existing templates and deployments
    const templatesRes = await client.query('SELECT "id" FROM "ConsentTemplate" LIMIT 5');
    if (templatesRes.rows.length === 0) {
      console.log('No templates found. Please create some templates first.');
      return;
    }

    const deploymentsRes = await client.query(`
      SELECT d."id", v."templateId", d."versionId", d."applicationId", a."name" as "applicationName"
      FROM "ConsentDeployment" d
      JOIN "Application" a ON d."applicationId" = a."id"
      JOIN "ConsentVersion" v ON d."versionId" = v."id"
      WHERE d."isActive" = true
    `);

    if (deploymentsRes.rows.length === 0) {
      console.log('No active deployments found. Please deploy some templates first.');
      return;
    }

    console.log(`Found ${templatesRes.rows.length} templates and ${deploymentsRes.rows.length} deployments.`);

    // 2. Seed ApplicationUsage (Cross-App Analytics)
    const appTypes = ['CRM', 'HRMS', 'WEBSITE', 'API', 'MOBILE', 'ERP'];
    
    for (const dep of deploymentsRes.rows) {
      const appType = appTypes[Math.floor(Math.random() * appTypes.length)];
      const versionRes = await client.query('SELECT "versionNumber" FROM "ConsentVersion" WHERE "id" = $1', [dep.versionId]);
      const versionNum = versionRes.rows[0]?.versionNumber || 1;

      // Check if already exists to avoid duplicates
      const existingRes = await client.query(
        'SELECT "id" FROM "ApplicationUsage" WHERE "templateId" = $1 AND "applicationName" = $2',
        [dep.templateId, dep.applicationName]
      );

      if (existingRes.rows.length === 0) {
        await client.query(`
          INSERT INTO "ApplicationUsage" (
            "id", "templateId", "templateVersion", "applicationName", "applicationType", 
            "systemOwner", "purposeUsed", "lastValidation", "status", "usersConsented", "violations"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          require('crypto').randomUUID(),
          dep.templateId,
          `v${versionNum}.0`,
          dep.applicationName,
          appType,
          'System Admin',
          'User Identification & Analytics',
          new Date(),
          'ACTIVE',
          Math.floor(Math.random() * 5000) + 500,
          Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0
        ]);
        console.log(`Created ApplicationUsage for ${dep.applicationName}`);
      }
    }

    // 3. Seed ConsentUsageRecord (Traceability)
    for (const dep of deploymentsRes.rows) {
      const template = templatesRes.rows.find(t => t.id === dep.templateId);
      const versionRes = await client.query('SELECT "versionNumber" FROM "ConsentVersion" WHERE "id" = $1', [dep.versionId]);
      const versionNum = versionRes.rows[0]?.versionNumber || 1;

      // Create 10 sample records for each deployment
      for (let i = 0; i < 10; i++) {
        const userId = `USR-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        await client.query(`
          INSERT INTO "ConsentUsageRecord" (
            "id", "userIdentifier", "templateId", "version", "purposeMapped", 
            "systemApp", "consentDateTime", "consentStatus", "lastValidation"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          require('crypto').randomUUID(),
          userId,
          dep.templateId,
          versionNum.toString(),
          'Marketing & Analytics',
          dep.applicationName,
          new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
          'ACTIVE',
          new Date()
        ]);
      }
      console.log(`Created 10 UsageRecords for template ${template?.title || 'Unknown'} on ${dep.applicationName}`);
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.end();
  }
}

seedUsageData();

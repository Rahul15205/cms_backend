
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database!');

    // 1. Get Tenant
    const tenantRes = await client.query('SELECT id, name FROM "Tenant" LIMIT 1');
    if (tenantRes.rows.length === 0) {
      console.log('No tenants found. Creating one...');
      const newTenant = await client.query(
        'INSERT INTO "Tenant" (id, name, domain, status, settings) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [ 'tenant-' + Date.now(), 'Default Tenant', 'example.com', 'ACTIVE', '{}']
      );
      process.env.TENANT_ID = newTenant.rows[0].id;
    } else {
      process.env.TENANT_ID = tenantRes.rows[0].id;
      console.log('Found tenant:', tenantRes.rows[0].name, 'ID:', process.env.TENANT_ID);
    }

    // 2. Create Application
    const appId = 'app-default-' + Date.now();
    const appName = 'Universal Web App';
    const apiKey = 'sk_test_default_' + Math.random().toString(36).substring(7);
    
    await client.query(
      'INSERT INTO "Application" (id, name, "apiKey", "tenantId", "updatedAt") VALUES ($1, $2, $3, $4, NOW())',
      [appId, appName, apiKey, process.env.TENANT_ID]
    );

    console.log('SUCCESS: Created application:', appName, 'ID:', appId);

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}

main();

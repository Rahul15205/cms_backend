const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function checkCols() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT * FROM \"ConsentDeployment\" LIMIT 0");
  res.fields.forEach(f => console.log('COL:', f.name));
  await client.end();
}
checkCols();

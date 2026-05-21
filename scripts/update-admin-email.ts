import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as crypto from 'crypto';

const oldEmail = process.argv[2] || 'admin@acme.com';
const newEmail = process.argv[3] || 'hello@protecciodata.com';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!';
const ALGORITHM = 'aes-256-cbc';
const DERIVED_KEY = crypto.scryptSync(ENCRYPTION_KEY, 'system-salt', 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, DERIVED_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function generateHash(text: string): string {
  return crypto
    .createHash('sha256')
    .update(`${text.toLowerCase().trim()}system-salt`)
    .digest('hex');
}

async function main() {
  const oldEmailHash = generateHash(oldEmail);
  const newEmailHash = generateHash(newEmail);

  const existingTarget = await prisma.user.findUnique({
    where: { emailHash: newEmailHash },
    select: { id: true },
  });

  if (existingTarget) {
    throw new Error(`A user with ${newEmail} already exists`);
  }

  const user = await prisma.user.findUnique({
    where: { emailHash: oldEmailHash },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error(`No user found with ${oldEmail}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: encrypt(newEmail),
      emailHash: newEmailHash,
    },
  });

  console.log(`Updated ${user.name} email from ${oldEmail} to ${newEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

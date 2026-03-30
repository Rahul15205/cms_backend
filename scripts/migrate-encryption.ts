import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as crypto from 'crypto';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'super-secret-key-at-least-32-chars-long-123456789012';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  if (!text || text.includes(':')) return text; 
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error(`Encryption failed for text: ${text}`, err);
    return text;
  }
}

function generateHash(text: string): string {
  if (!text) return '';
  return crypto
    .createHash('sha256')
    .update(text.toLowerCase().trim() + 'system-salt')
    .digest('hex');
}

async function migrate() {
  try {
    console.log('Testing DB connection...');
    await prisma.$connect();
    console.log('Connected to DB.');

    // 1. Migrate Users
    console.log('Migrating Users...');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} total users.`);
    
    for (const user of users) {
      if (!user.emailHash) {
        console.log(`Migrating user: ${user.id}`);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: encrypt(user.email),
            emailHash: generateHash(user.email),
            phone: user.phone ? encrypt(user.phone) : null,
            phoneHash: user.phone ? generateHash(user.phone) : null,
            aadhaarNumber: user.aadhaarNumber ? encrypt(user.aadhaarNumber) : null,
            aadhaarHash: user.aadhaarNumber ? generateHash(user.aadhaarNumber) : null,
          }
        });
      }
    }

    // 2. Migrate Rights Requests
    console.log('Migrating Rights Requests...');
    const requests = await prisma.rightsRequest.findMany();
    for (const req of requests) {
      if (!req.requesterEmailHash) {
        console.log(`Migrating request: ${req.id}`);
        await prisma.rightsRequest.update({
          where: { id: req.id },
          data: {
            requesterEmail: encrypt(req.requesterEmail),
            requesterEmailHash: generateHash(req.requesterEmail),
            requesterPhone: req.requesterPhone ? encrypt(req.requesterPhone) : null,
            requesterPhoneHash: req.requesterPhone ? generateHash(req.requesterPhone) : null,
            aadhaarNumber: req.aadhaarNumber ? encrypt(req.aadhaarNumber) : null,
            aadhaarHash: req.aadhaarNumber ? generateHash(req.aadhaarNumber) : null,
          }
        });
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
}

migrate()
  .finally(async () => {
    await prisma.$disconnect();
  });

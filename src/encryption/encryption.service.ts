import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEncryptionConfigDto } from './dto/update-encryption-config.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('ENCRYPTION_KEY') || 'default_secret_at_least_32_chars_long!!';
    // Generate deterministic 32-byte key from secret
    this.key = crypto.scryptSync(secret, 'system-salt', 32);
  }

  /**
   * Encrypts a string using AES-256-CBC
   */
  encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts a string using AES-256-CBC
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) return encryptedText; // Not encrypted structure, return raw
      
      const [ivHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedText; // Fallback for legacy or unencrypted rows
    }
  }

  /**
   * Generates a deterministic hash for searching (Blind Index)
   */
  generateHash(text: string): string {
    if (!text) return '';
    return crypto
      .createHash('sha256')
      .update(text.toLowerCase().trim() + 'system-salt') // Fixed salt for deterministic lookup
      .digest('hex');
  }

  async getConfig(tenantId?: string) {
    const where = tenantId ? { tenantId } : { id: undefined };
    
    let config = tenantId 
      ? await this.prisma.encryptionConfig.findUnique({ where: { tenantId } })
      : await this.prisma.encryptionConfig.findFirst();

    if (!config) {
      config = await this.prisma.encryptionConfig.create({
        data: tenantId ? { tenantId } : {},
      });
    }

    return config;
  }

  async updateConfig(tenantId: string | undefined, dto: UpdateEncryptionConfigDto) {
    const existing = tenantId
      ? await this.prisma.encryptionConfig.findUnique({ where: { tenantId } })
      : await this.prisma.encryptionConfig.findFirst();

    if (existing) {
      return this.prisma.encryptionConfig.update({
        where: { id: existing.id },
        data: {
          algorithm: dto.algorithm,
          keyRotationDays: dto.keyRotationDays,
          status: dto.status,
        },
      });
    } else {
      return this.prisma.encryptionConfig.create({
        data: {
          algorithm: dto.algorithm,
          keyRotationDays: dto.keyRotationDays,
          status: dto.status,
          tenantId: tenantId,
        },
      });
    }
  }

  async rotateKey(tenantId?: string) {
    const existing = tenantId
      ? await this.prisma.encryptionConfig.findUnique({ where: { tenantId } })
      : await this.prisma.encryptionConfig.findFirst();
      
    if (!existing) return null;

    return this.prisma.encryptionConfig.update({
      where: { id: existing.id },
      data: {
        lastRotation: new Date(),
      },
    });
  }
}

import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common'; // PHASE 6 CHANGE
import { PrismaService } from '../prisma/prisma.service'; // PHASE 6 CHANGE
import { createHash, randomBytes } from 'crypto'; // PHASE 6 CHANGE
import { ApiKey } from '@prisma/client'; // PHASE 6 CHANGE

@Injectable() // PHASE 6 CHANGE
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {} // PHASE 6 CHANGE

  // Securely hash raw key string
  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  // Generate a new API key for a tenant
  // Returns the plaintext key ONCE — never retrievable again after this
  // Stores only the SHA-256 hash
  async generateKey(tenantId: string, label: string, expiresAt?: Date): Promise<{
    key: string;
    keyId: string;
  }> {
    // Format: prtc_<32 random hex bytes>
    const rawKey = `prtc_${randomBytes(32).toString('hex')}`; // PHASE 6 CHANGE
    const keyHash = this.hashKey(rawKey);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        keyHash,
        label,
        isActive: true,
        expiresAt: expiresAt || null,
      },
    });

    return {
      key: rawKey,
      keyId: apiKey.id,
    };
  }

  // Validate an incoming API key
  // Hashes the provided key and looks up by keyHash
  // Returns the tenantId if valid and active, throws UnauthorizedException otherwise
  async validateKey(rawKey: string): Promise<string> {
    const keyHash = this.hashKey(rawKey); // PHASE 6 CHANGE
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || !apiKey.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update lastUsedAt asynchronously
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return apiKey.tenantId;
  }

  // Soft-deactivate a key
  async revokeKey(keyId: string, tenantId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found or does not belong to this tenant');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  }

  // List all keys for a tenant (never return keyHash)
  async listKeys(tenantId: string): Promise<Omit<ApiKey, 'keyHash'>[]> {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        label: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }
}

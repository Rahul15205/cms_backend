import { Test, TestingModule } from '@nestjs/testing';
import { ConsentTemplatesService } from './consent-templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ConsentTemplatesService', () => {
  let service: ConsentTemplatesService;
  let prismaService: ReturnType<typeof mockPrismaService>;

  const mockPrismaService = () => ({
    consentTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentTemplatesService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile();

    service = module.get<ConsentTemplatesService>(ConsentTemplatesService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a consent template successfully', async () => {
      const dto: any = { title: 'Test Template', version: '1.0' };
      prismaService.consentTemplate.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto, 'tenant-1', 'user-1');
      expect(result.id).toBe('1');
      expect(prismaService.consentTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          createdBy: 'user-1'
        })
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if template does not exist', async () => {
      prismaService.consentTemplate.findUnique.mockResolvedValue(null);
      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });

    it('should return a template if found', async () => {
      prismaService.consentTemplate.findUnique.mockResolvedValue({ id: '1', title: 'Test' });
      const result = await service.findOne('1');
      expect(result.id).toBe('1');
    });
  });

  describe('remove (soft delete)', () => {
    it('should update status to ARCHIVED', async () => {
      prismaService.consentTemplate.findUnique.mockResolvedValue({ id: '1' });
      prismaService.consentTemplate.update.mockResolvedValue({ id: '1', status: TemplateStatus.ARCHIVED });

      const result = await service.remove('1');
      expect(result.status).toBe(TemplateStatus.ARCHIVED);
    });
  });
});

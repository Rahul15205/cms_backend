import { Test, TestingModule } from '@nestjs/testing';
import { RightsRequestsService } from './rights-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { RightsRequestStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RightsRequestsService', () => {
  let service: RightsRequestsService;
  let prismaService: ReturnType<typeof mockPrismaService>;

  const mockPrismaService = () => ({
    $transaction: jest.fn().mockImplementation((cb) => cb(prismaService)),
    rightsRequest: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    workflowStep: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    rightsAuditEntry: {
      create: jest.fn(),
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RightsRequestsService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile();

    service = module.get<RightsRequestsService>(RightsRequestsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new rights request and auto-generate workflow steps', async () => {
      prismaService.rightsRequest.count.mockResolvedValue(0);
      prismaService.rightsRequest.create.mockResolvedValue({ id: 'req-1', caseNumber: 'RR-2026-000001' });
      prismaService.rightsRequest.findUnique.mockResolvedValue({ id: 'req-1', caseNumber: 'RR-2026-000001' });
      
      const dto: any = { type: 'ACCESS', requesterEmail: 'test@example.com' };
      const result = await service.create(dto, 'user-1');

      expect(prismaService.rightsRequest.create).toHaveBeenCalled();
      expect(prismaService.workflowStep.createMany).toHaveBeenCalled();
      expect(prismaService.rightsAuditEntry.create).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException on invalid status transition', async () => {
      // Current: RECEIVED, Trying to transition to CLOSED directly
      // Valid are IDENTITY_VERIFIED, REJECTED, ON_HOLD
      prismaService.rightsRequest.findUnique.mockResolvedValue({ id: '1', status: RightsRequestStatus.RECEIVED });
      
      await expect(
        service.updateStatus('1', { status: RightsRequestStatus.CLOSED }, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should update status and progress workflow safely for valid transitions', async () => {
      prismaService.rightsRequest.findUnique.mockResolvedValue({ 
        id: '1', 
        status: RightsRequestStatus.RECEIVED,
        caseNumber: 'RR-1'
      });
      prismaService.rightsRequest.update.mockResolvedValue({ id: '1', status: RightsRequestStatus.IDENTITY_VERIFIED });

      await service.updateStatus('1', { status: RightsRequestStatus.IDENTITY_VERIFIED }, 'user-1');

      expect(prismaService.rightsRequest.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: RightsRequestStatus.IDENTITY_VERIFIED })
      }));
      expect(prismaService.workflowStep.updateMany).toHaveBeenCalledTimes(2); // complete current, start next
      expect(prismaService.rightsAuditEntry.create).toHaveBeenCalled();
    });
  });

  describe('enrichWithSla', () => {
    it('should correctly mark slaBreached if due date has passed', async () => {
      const pastDate = new Date(Date.now() - 100000);
      prismaService.rightsRequest.findUnique.mockResolvedValue({ 
        id: '1', 
        status: RightsRequestStatus.IN_REVIEW,
        dueDate: pastDate 
      });

      const result = await service.findOne('1');
      expect(result.slaBreached).toBe(true);
      expect(result.daysRemaining).toBeLessThanOrEqual(0);
    });
  });
});

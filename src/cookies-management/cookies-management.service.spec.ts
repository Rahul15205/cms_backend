import { Test, TestingModule } from '@nestjs/testing';
import { CookiesManagementService } from './cookies-management.service';

describe('CookiesManagementService', () => {
  let service: CookiesManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookiesManagementService],
    }).compile();

    service = module.get<CookiesManagementService>(CookiesManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

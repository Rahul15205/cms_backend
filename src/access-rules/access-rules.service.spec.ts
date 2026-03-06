import { Test, TestingModule } from '@nestjs/testing';
import { AccessRulesService } from './access-rules.service';

describe('AccessRulesService', () => {
  let service: AccessRulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessRulesService],
    }).compile();

    service = module.get<AccessRulesService>(AccessRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

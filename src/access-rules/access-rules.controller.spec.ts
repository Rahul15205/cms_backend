import { Test, TestingModule } from '@nestjs/testing';
import { AccessRulesController } from './access-rules.controller';

describe('AccessRulesController', () => {
  let controller: AccessRulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessRulesController],
    }).compile();

    controller = module.get<AccessRulesController>(AccessRulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

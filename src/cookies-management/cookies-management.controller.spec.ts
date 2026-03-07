import { Test, TestingModule } from '@nestjs/testing';
import { CookiesManagementController } from './cookies-management.controller';

describe('CookiesManagementController', () => {
  let controller: CookiesManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CookiesManagementController],
    }).compile();

    controller = module.get<CookiesManagementController>(CookiesManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { NotFoundException } from '@nestjs/common';

describe('ActivityController', () => {
  let controller: ActivityController;
  let service: jest.Mocked<ActivityService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      generateSecuritySummary: jest.fn(),
      verifyIntegrity: jest.fn(),
      exportCsv: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [
        { provide: ActivityService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ActivityController>(ActivityController);
    service = module.get(ActivityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with correct args', async () => {
      service.findAll.mockResolvedValueOnce({ items: [], total: 0 } as any);
      const req = { user: { userId: 'u1', role: 'USER' } } as any;
      await controller.findAll({}, req);
      expect(service.findAll).toHaveBeenCalledWith({}, 'u1', false);
    });

    it('should pass isAdmin true if user role is ADMIN', async () => {
      service.findAll.mockResolvedValueOnce({ items: [], total: 0 } as any);
      const req = { user: { userId: 'u1', role: 'ADMIN' } } as any;
      await controller.findAll({}, req);
      expect(service.findAll).toHaveBeenCalledWith({}, 'u1', true);
    });
  });

  describe('getSecuritySummary', () => {
    it('should call service.generateSecuritySummary', async () => {
      service.generateSecuritySummary.mockResolvedValueOnce('summary' as any);
      const req = { user: { userId: 'u1' } } as any;
      await controller.getSecuritySummary(req);
      expect(service.generateSecuritySummary).toHaveBeenCalledWith('u1');
    });
  });

  describe('verifyIntegrity', () => {
    it('should call service.verifyIntegrity', async () => {
      service.verifyIntegrity.mockResolvedValueOnce({ valid: true } as any);
      const req = { user: { userId: 'u1' } } as any;
      await controller.verifyIntegrity(req);
      expect(service.verifyIntegrity).toHaveBeenCalledWith('u1');
    });
  });

  describe('export', () => {
    it('should export csv', async () => {
      service.exportCsv.mockResolvedValueOnce('csv,data');
      const req = { user: { userId: 'u1', role: 'USER' } } as any;
      const res = { setHeader: jest.fn(), send: jest.fn() } as any;
      await controller.export({ dateFrom: 'd1', dateTo: 'd2' }, req, res);
      expect(service.exportCsv).toHaveBeenCalledWith('u1', false, 'd1', 'd2');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.send).toHaveBeenCalledWith('csv,data');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return activity', async () => {
      service.findOne.mockResolvedValueOnce({ id: 'a1' } as any);
      const req = { user: { userId: 'u1', role: 'USER' } } as any;
      const res = await controller.findOne('a1', req);
      expect(res).toBeDefined();
    });

    it('should throw NotFoundException if activity not found', async () => {
      service.findOne.mockResolvedValueOnce(null as any);
      const req = { user: { userId: 'u1', role: 'USER' } } as any;
      await expect(controller.findOne('a1', req)).rejects.toThrow(NotFoundException);
    });
  });
});

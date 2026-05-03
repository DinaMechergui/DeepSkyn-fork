import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Activity, ActivityType, RiskLevel } from './activity.entity';
import { GeminiService } from '../ai/gemini.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let mockRepo: any;
  let mockGemini: any;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockGemini = {
      classifyActivityRisk: jest.fn(),
      generateContent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: getRepositoryToken(Activity), useValue: mockRepo },
        { provide: GeminiService, useValue: mockGemini },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an activity and classify risk via Gemini', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null); // No last activity
      mockRepo.create.mockReturnValue({ id: 'a1' });
      mockRepo.save.mockResolvedValueOnce({ id: 'a1' }); // Initial save
      
      mockGemini.classifyActivityRisk.mockResolvedValueOnce({
        riskLevel: 'medium',
        explanation: 'Test',
        recommendedAction: 'none'
      });

      mockRepo.save.mockResolvedValueOnce({ id: 'a1', riskLevel: 'medium' }); // Second save

      const res = await service.create({ userId: 'u1', type: ActivityType.LOGIN_SUCCESS, ipAddress: '127.0.0.1' });
      expect(res).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalled();
      
      // Wait for async classification
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockGemini.classifyActivityRisk).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should fallback to heuristic if Gemini fails', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ currentHash: 'hash1' });
      mockRepo.create.mockReturnValue({ id: 'a1', type: ActivityType.LOGIN_FAILED });
      mockRepo.save.mockResolvedValueOnce({ id: 'a1', type: ActivityType.LOGIN_FAILED });
      
      mockGemini.classifyActivityRisk.mockResolvedValueOnce(null);

      const res = await service.create({ userId: 'u1', type: ActivityType.LOGIN_FAILED });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      // Fallback classification should trigger second save
      expect(mockRepo.save).toHaveBeenCalledTimes(2);
      const secondSaveCall = mockRepo.save.mock.calls[1][0];
      expect(secondSaveCall.riskLevel).toBe('high');
    });

    it('should fallback to medium heuristic', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      mockRepo.create.mockReturnValue({ id: 'a1', type: ActivityType.PASSWORD_CHANGED });
      mockRepo.save.mockResolvedValueOnce({ id: 'a1', type: ActivityType.PASSWORD_CHANGED });
      
      mockGemini.classifyActivityRisk.mockResolvedValueOnce(null);

      await service.create({ userId: 'u1', type: ActivityType.PASSWORD_CHANGED });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockRepo.save.mock.calls[1][0].riskLevel).toBe('medium');
    });

    it('should fallback to low heuristic', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      mockRepo.create.mockReturnValue({ id: 'a1', type: ActivityType.LOGIN_SUCCESS });
      mockRepo.save.mockResolvedValueOnce({ id: 'a1', type: ActivityType.LOGIN_SUCCESS });
      
      mockGemini.classifyActivityRisk.mockResolvedValueOnce(null);

      await service.create({ userId: 'u1', type: ActivityType.LOGIN_SUCCESS });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockRepo.save.mock.calls[1][0].riskLevel).toBe('low');
    });
  });

  describe('findAll', () => {
    it('should filter correctly for admin', async () => {
      mockRepo.findAndCount.mockResolvedValueOnce([[{ id: 'a1' }], 1]);
      const res = await service.findAll({ userId: 'u2', type: ActivityType.LOGIN_SUCCESS, dateFrom: '2023-01-01' }, 'u1', true);
      expect(res.items).toHaveLength(1);
      expect(mockRepo.findAndCount).toHaveBeenCalled();
    });

    it('should filter correctly for user', async () => {
      mockRepo.findAndCount.mockResolvedValueOnce([[], 0]);
      await service.findAll({ dateTo: '2023-12-31', limit: 10, page: 2 }, 'u1', false);
      expect(mockRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('generateSecuritySummary', () => {
    it('should return empty summary if no activities', async () => {
      mockRepo.find.mockResolvedValueOnce([]);
      const res = await service.generateSecuritySummary('u1');
      expect(res.summary).toContain('No activity recorded');
    });

    it('should generate summary using gemini', async () => {
      process.env.GEMINI_API_KEY = 'test_key';
      mockRepo.find.mockResolvedValueOnce([
        { type: ActivityType.LOGIN_SUCCESS, riskLevel: RiskLevel.LOW, createdAt: new Date() }
      ]);
      mockGemini.generateContent.mockResolvedValueOnce('Great summary');

      const res = await service.generateSecuritySummary('u1');
      expect(res.summary).toBe('Great summary');
    });

    it('should handle gemini error and return fallback', async () => {
      process.env.GEMINI_API_KEY = 'test_key';
      mockRepo.find.mockResolvedValueOnce([
        { type: ActivityType.LOGIN_SUCCESS, riskLevel: RiskLevel.LOW, createdAt: new Date() }
      ]);
      mockGemini.generateContent.mockRejectedValueOnce(new Error('API failed'));

      const res = await service.generateSecuritySummary('u1');
      expect(res.summary).toContain('events were recorded');
    });
  });

  describe('findOne', () => {
    it('should return activity for admin', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'a1', userId: 'u2' });
      const res = await service.findOne('a1', 'u1', true);
      expect(res).toBeDefined();
    });

    it('should return null for user if not their activity', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'a1', userId: 'u2' });
      const res = await service.findOne('a1', 'u1', false);
      expect(res).toBeNull();
    });

    it('should return null if not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      const res = await service.findOne('a1', 'u1', false);
      expect(res).toBeNull();
    });
  });

  describe('exportCsv', () => {
    it('should export csv data', async () => {
      mockRepo.find.mockResolvedValueOnce([
        { id: 'a1', userId: 'u1', type: ActivityType.LOGIN_SUCCESS, riskLevel: RiskLevel.LOW, createdAt: new Date('2023-01-01') }
      ]);
      const res = await service.exportCsv('u1', false, '2022-01-01', '2024-01-01');
      expect(res).toContain('a1,u1');
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify chain correctly', async () => {
      mockRepo.find.mockResolvedValueOnce([
        { id: '1', previousHash: '0000000000000000000000000000000000000000000000000000000000000000', currentHash: 'hash1' },
        { id: '2', previousHash: 'hash1', currentHash: 'hash2' }
      ]);
      const res = await service.verifyIntegrity('u1');
      expect(res.valid).toBe(true);
    });

    it('should fail if chain is broken', async () => {
      mockRepo.find.mockResolvedValueOnce([
        { id: '1', previousHash: '0000000000000000000000000000000000000000000000000000000000000000', currentHash: 'hash1' },
        { id: '2', previousHash: 'invalid_hash', currentHash: 'hash2' }
      ]);
      const res = await service.verifyIntegrity('u1');
      expect(res.valid).toBe(false);
      expect(res.brokenAt).toBe('2');
    });
  });
});

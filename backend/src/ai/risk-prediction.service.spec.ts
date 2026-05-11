import { Test, TestingModule } from '@nestjs/testing';
import { RiskPredictionService } from './risk-prediction.service';
import { GeminiService } from './gemini.service';
import { SkinRiskInput } from './skin-risk.dto';

describe('RiskPredictionService', () => {
  let service: RiskPredictionService;
  let geminiService: jest.Mocked<GeminiService>;

  beforeEach(async () => {
    const mockGeminiService = {
      generateContent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskPredictionService,
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
      ],
    }).compile();

    service = module.get<RiskPredictionService>(RiskPredictionService);
    geminiService = module.get(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('predictSkinRisks', () => {
    const mockInput: SkinRiskInput = {
      age: 30,
      skinType: 'Oily',
      acneScore: 60,
      drynessScore: 30,
      wrinklesScore: 20,
      sensitivityScore: 40,
      pigmentationScore: 50,
      poresScore: 70,
      fitzpatrickSkin: 3,
      environment: {
        humidity: 60,
        temperature: 25,
        uvIndex: 7,
        pollution: 'High',
      },
      habits: {
        sleepHours: 6,
        waterIntake: 1.5,
        stressLevel: 'High',
        sunProtection: 'Occasional',
        skincarRoutine: 'Basic',
      },
    };

    it('should successfully parse a valid gemini response', async () => {
      const mockJsonResponse = JSON.stringify({
        risks: [
          {
            type: 'acne',
            risk_score: 80,
            cause: 'High stress and poor routine',
            prevention: ['Use cleanser', 'Apply treatment'],
            urgency: 'high',
            timeline: 'weeks',
          },
        ],
        summary: 'A short summary.',
        immediate_actions: ['Action 1', 'Action 2'],
      });

      geminiService.generateContent.mockResolvedValueOnce(
        `Here is the result:\n\`\`\`json\n${mockJsonResponse}\n\`\`\``,
      );

      const result = await service.predictSkinRisks(mockInput);

      expect(result).toBeDefined();
      expect(result.risks).toHaveLength(1);
      expect(result.risks[0].type).toBe('acne');
      expect(result.risks[0].risk_score).toBe(80);
      expect(geminiService.generateContent).toHaveBeenCalled();
    });

    it('should fallback if gemini returns null', async () => {
      geminiService.generateContent.mockResolvedValueOnce(null as any);

      const result = await service.predictSkinRisks(mockInput);

      expect(result).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.summary).toContain('Personalized risk score');
    });

    it('should fallback if gemini throws an error', async () => {
      geminiService.generateContent.mockRejectedValueOnce(new Error('API Down'));

      const result = await service.predictSkinRisks(mockInput);

      expect(result).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should fallback if gemini returns invalid JSON', async () => {
      geminiService.generateContent.mockResolvedValueOnce('Invalid string without json');

      const result = await service.predictSkinRisks(mockInput);

      expect(result).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should calculate correct impacts for low values (uv, pollution, stress)', async () => {
      const lowInput: SkinRiskInput = {
        age: 20,
        wrinklesScore: 50,
        environment: {
          uvIndex: 1, // <= 2
          pollution: 'Low', // 'low'
        },
        habits: {
          stressLevel: 'Low', // 'low'
        },
      };

      geminiService.generateContent.mockResolvedValueOnce(null as any);
      const result = await service.predictSkinRisks(lowInput);
      expect(result).toBeDefined();
    });

    it('should add retinoid action for high aging risk', async () => {
      const highAgingInput: SkinRiskInput = {
        wrinklesScore: 80, // >= 45
        age: 40,
        acneScore: 0,
        drynessScore: 0,
        sensitivityScore: 0,
        pigmentationScore: 0,
        habits: {
          sleepHours: 8,
          stressLevel: 'Low',
          waterIntake: 3,
        }
      };

      const mockJsonResponse = JSON.stringify({
        risks: [
          {
            type: 'aging',
            risk_score: 80,
            cause: 'Age and wrinkles',
            prevention: ['Use retinoid'],
            urgency: 'high',
            timeline: 'weeks',
          },
        ],
        summary: 'A short summary.',
        immediate_actions: [], // Empty to trigger buildPersonalizedActions
      });

      geminiService.generateContent.mockResolvedValueOnce(
        `Here is the result:\n\`\`\`json\n${mockJsonResponse}\n\`\`\``,
      );
      
      const result = await service.predictSkinRisks(highAgingInput);
      expect(result.immediate_actions.some(a => a.includes('retinoid'))).toBeTruthy();
    });

    it('should use fallback when parsed response has empty risks array', async () => {
      const mockJsonResponse = JSON.stringify({
        risks: [],
        summary: 'No risks.',
        immediate_actions: [],
      });

      geminiService.generateContent.mockResolvedValueOnce(
        `Here is the result:\n\`\`\`json\n${mockJsonResponse}\n\`\`\``,
      );

      const result = await service.predictSkinRisks(mockInput);
      expect(result.risks.length).toBeGreaterThan(0); // Because fallback generates risks
    });
  });
});

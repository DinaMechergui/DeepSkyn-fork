import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from '../subscription/subscription.entity';
import { BadRequestException } from '@nestjs/common';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;
  let stripeService: jest.Mocked<StripeService>;
  let subscriptionRepo: any;

  beforeEach(async () => {
    paymentService = {
      subscribe: jest.fn(),
      getHistory: jest.fn(),
    } as any;

    stripeService = {
      constructEvent: jest.fn(),
      createCheckoutSession: jest.fn(),
      retrieveSession: jest.fn(),
    } as any;

    subscriptionRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: paymentService },
        { provide: StripeService, useValue: stripeService },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('subscribe', () => {
    it('should call paymentService.subscribe', async () => {
      paymentService.subscribe.mockResolvedValueOnce({ id: '1' } as any);
      const dto = { userId: 'u1', plan: 'PRO' as const, cardHolder: 'Test', cardLast4: '1234' };
      const res = await controller.subscribe(dto);
      expect(paymentService.subscribe).toHaveBeenCalledWith(dto);
      expect(res).toEqual({ id: '1' });
    });
  });

  describe('getHistory', () => {
    it('should call paymentService.getHistory', async () => {
      paymentService.getHistory.mockResolvedValueOnce([]);
      const res = await controller.getHistory('u1');
      expect(paymentService.getHistory).toHaveBeenCalledWith('u1');
      expect(res).toEqual([]);
    });
  });

  describe('handleWebhook', () => {
    it('should handle checkout.session.completed', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'u1', plan: 'PRO' }
          }
        }
      };
      stripeService.constructEvent.mockResolvedValueOnce(event as any);
      
      const req = { rawBody: 'raw' };
      const res = await controller.handleWebhook({}, 'sig', req);
      
      expect(stripeService.constructEvent).toHaveBeenCalledWith('raw', 'sig');
      expect(paymentService.subscribe).toHaveBeenCalledWith({
        userId: 'u1',
        plan: 'PRO',
        cardHolder: 'Stripe Payment',
        cardLast4: 'XXXX',
      });
      expect(res).toEqual({ received: true });
    });

    it('should ignore other events', async () => {
      const event = { type: 'other.event' };
      stripeService.constructEvent.mockResolvedValueOnce(event as any);
      
      const res = await controller.handleWebhook({}, 'sig', {});
      expect(paymentService.subscribe).not.toHaveBeenCalled();
      expect(res).toEqual({ received: true });
    });
  });

  describe('createSession', () => {
    it('should call stripeService.createCheckoutSession', async () => {
      stripeService.createCheckoutSession.mockResolvedValueOnce({ id: 's1' } as any);
      const dto = { userId: 'u1', plan: 'PRO' };
      const res = await controller.createSession(dto);
      expect(stripeService.createCheckoutSession).toHaveBeenCalledWith('u1', 'PRO', 20, undefined);
      expect(res).toEqual({ id: 's1' });
    });
  });

  describe('getSession', () => {
    it('should process payment if session is paid', async () => {
      stripeService.retrieveSession.mockResolvedValueOnce({
        payment_status: 'paid',
        metadata: { userId: 'u1', plan: 'PRO' }
      } as any);

      const res = await controller.getSession('s1');
      expect(paymentService.subscribe).toHaveBeenCalledWith({
        userId: 'u1',
        plan: 'PRO',
        cardHolder: 'Stripe Payment',
        cardLast4: 'XXXX',
      });
      expect(res.success).toBe(true);
    });

    it('should not process if session is not paid', async () => {
      stripeService.retrieveSession.mockResolvedValueOnce({
        payment_status: 'unpaid'
      } as any);

      const res = await controller.getSession('s1');
      expect(paymentService.subscribe).not.toHaveBeenCalled();
      expect(res.success).toBe(false);
    });

    it('should throw BadRequestException on error', async () => {
      stripeService.retrieveSession.mockRejectedValueOnce(new Error('fail'));
      await expect(controller.getSession('s1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('downgradeSubscription', () => {
    it('should successfully downgrade subscription', async () => {
      const sub = { id: '1', plan: 'PRO' };
      subscriptionRepo.findOne.mockResolvedValueOnce(sub);
      subscriptionRepo.save.mockResolvedValueOnce(sub);

      const res = await controller.downgradeSubscription('u1', { plan: 'FREE' });
      expect(res.success).toBe(true);
      expect(subscriptionRepo.save).toHaveBeenCalled();
    });

    it('should throw if subscription not found', async () => {
      subscriptionRepo.findOne.mockResolvedValueOnce(null);
      await expect(controller.downgradeSubscription('u1', { plan: 'FREE' })).rejects.toThrow(BadRequestException);
    });

    it('should throw if target plan is not a downgrade', async () => {
      const sub = { id: '1', plan: 'PRO' };
      subscriptionRepo.findOne.mockResolvedValueOnce(sub);
      await expect(controller.downgradeSubscription('u1', { plan: 'PREMIUM' })).rejects.toThrow(BadRequestException);
    });

    it('should throw if repo save fails', async () => {
      const sub = { id: '1', plan: 'PRO' };
      subscriptionRepo.findOne.mockResolvedValueOnce(sub);
      subscriptionRepo.save.mockRejectedValueOnce(new Error('fail'));
      await expect(controller.downgradeSubscription('u1', { plan: 'FREE' })).rejects.toThrow(BadRequestException);
    });
  });
});

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  constructor(@Inject('STRIPE_CLIENT') private readonly stripe: Stripe) {}

  async createPaymentIntent(amount: number, currency: string) {
    if (amount < 0) {
      throw new BadRequestException('Incorrect amount');
    }

    return this.stripe.paymentIntents.create({
      amount,
      currency,
    });
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    if (!paymentIntentId) {
      throw new BadRequestException('Payment intentId required');
    }

    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }
}

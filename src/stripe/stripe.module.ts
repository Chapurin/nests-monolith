import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Module({
  imports: [],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Stripe(
          configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
          {
            apiVersion: '2026-06-24.dahlia',
          },
        );
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  exports: [],
  controllers: [StripeController],
})
export class StripeModule {}

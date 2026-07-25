import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  PrismaModule,
  providePrismaClientExceptionFilter,
} from 'nestjs-prisma';
import { UserModule } from './user/user.module';
import { LoggerModule } from 'nestjs-pino';
import { OrderModule } from './order/order.module';
import { BrandModule } from './brand/brand.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { ElasticModule } from './elastic/elastic.module';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      },
    }),
    OrderModule,
    ProductModule,
    BrandModule,
    AuthModule,
    RedisModule,
    ElasticModule,
    StripeModule,
  ],
  controllers: [],
  providers: [providePrismaClientExceptionFilter()],
})
export class AppModule {}

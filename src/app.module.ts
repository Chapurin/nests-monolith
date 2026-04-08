import { Module } from '@nestjs/common';
import { loggingMiddleware, PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [loggingMiddleware()], // Улучшение: добавляем логирование запросов
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

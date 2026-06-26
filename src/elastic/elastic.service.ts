import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ElasticService {
  constructor(
    private readonly elasticsearchService: ElasticService,
    private readonly prismaService: PrismaService,
  ) {}
}

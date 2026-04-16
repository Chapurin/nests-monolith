import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { BaseResourcesService } from '../common/base-resources/base-resources.service';

@Injectable()
export class UserService extends BaseResourcesService {
  constructor(prisma: PrismaService) {
    super(prisma, 'User');
  }
}

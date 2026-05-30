import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  BaseResourcesService,
  PrismaModel,
} from '../common/base-resources/base-resources.service';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService extends BaseResourcesService<
  User,
  CreateUserDto,
  UpdateUserDto,
  Prisma.UserFindUniqueArgs,
  Prisma.UserUpdateArgs,
  Prisma.UserDeleteArgs
> {
  constructor(prisma: PrismaService) {
    super(
      prisma.user as unknown as PrismaModel<
        User,
        CreateUserDto,
        Prisma.UserFindUniqueArgs,
        Prisma.UserUpdateArgs,
        Prisma.UserDeleteArgs
      >,
    );
  }
}

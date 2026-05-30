import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { BaseResourcesService } from '../common/base-resources/base-resources.service';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

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
    super(prisma.user);
  }

  async createUser(dto: CreateUserDto) {
    const { password, email } = dto;

    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    return this.model.create({ data: { ...dto, password: hashedPassword } });
  }

  async findByEmail(email: string) {
    return this.model.findUnique({ where: { email } });
  }
}

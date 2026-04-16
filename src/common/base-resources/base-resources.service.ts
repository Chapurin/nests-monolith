import { PrismaService } from 'nestjs-prisma';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly model: string,
  ) {}

  createUser(dto: CreateUserDto) {
    return this.prisma[this.model].create({ data: dto });
  }

  findAll() {
    return this.prisma[this.model].findMany();
  }

  findOne(id: number) {
    return this.prisma[this.model].findUnique({
      where: { id },
    });
  }

  update(id: number, data: UpdateUserDto) {
    return this.prisma[this.model].update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma[this.model].delete({
      where: { id },
    });
  }
}

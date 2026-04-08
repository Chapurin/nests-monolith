import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  createUser(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  async findAllUsers() {
    // return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    // return this.prisma.user.findUnique({
    //   where: { id },
    // });
  }

  async update(id: number, data: Partial<any>) {
    // return this.prisma.user.update({
    //   where: { id },
    //   data,
    // });
  }

  async remove(id: number) {}
}

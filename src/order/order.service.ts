import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const { productIds, ...orderData } = createOrderDto;

    return this.prisma.order.create({
      data: {
        ...orderData,
        orderProduct: productIds
          ? {
              create: productIds.map((productId) => ({
                Product: { connect: { id: productId } },
              })),
            }
          : undefined,
      },
      include: {
        orderProduct: {
          include: { Product: true },
        },
      },
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      include: {
        orderProduct: {
          include: { Product: true },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        orderProduct: {
          include: { Product: true },
        },
      },
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const { productIds, ...orderData } = updateOrderDto;

    return this.prisma.order.update({
      where: { id },
      data: {
        ...orderData,
        orderProduct: productIds
          ? {
              deleteMany: {},
              create: productIds.map((productId) => ({
                Product: { connect: { id: productId } },
              })),
            }
          : undefined,
      },
      include: {
        orderProduct: {
          include: { Product: true },
        },
      },
    });
  }

  remove(id: number) {
    return this.prisma.order.delete({
      where: { id },
    });
  }
}

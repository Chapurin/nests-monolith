import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, PrismaClient } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redisClient: PrismaClient,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const { productIds, ...orderData } = createOrderDto;

    await this.redisClient.del('orders_all');

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

  async findAll(): Promise<Order[]> {
    const cacheKey = 'orders_all';

    const cachedOrders = await this.redisClient.get(cacheKey);
    if (cachedOrders) {
      return JSON.parse(cachedOrders);
    }

    const orders = this.prisma.order.findMany({
      include: {
        orderProduct: {
          include: { Product: true },
        },
      },
    });

    await this.redisClient.setex(cacheKey, 36000, JSON.stringify(orders));

    return orders;
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

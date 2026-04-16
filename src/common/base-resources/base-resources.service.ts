import { Injectable } from '@nestjs/common';

export interface PrismaModel<
  TEntity,
  TCreateInput,
  TFindUniqueArgs,
  TUpdateArgs,
  TDeleteArgs,
> {
  create(args: { data: TCreateInput }): Promise<TEntity>;
  findMany(args?: unknown): Promise<TEntity[]>;
  findUnique(args: TFindUniqueArgs): Promise<TEntity | null>;
  update(args: TUpdateArgs): Promise<TEntity>;
  delete(args: TDeleteArgs): Promise<TEntity>;
}

@Injectable()
export class BaseResourcesService<
  TEntity,
  TCreateDto,
  TUpdateDto,
  TFindUniqueArgs,
  TUpdateArgs,
  TDeleteArgs,
> {
  constructor(
    protected readonly model: PrismaModel<
      TEntity,
      TCreateDto,
      TFindUniqueArgs,
      TUpdateArgs,
      TDeleteArgs
    >,
  ) {}

  createUser(dto: TCreateDto): Promise<TEntity> {
    return this.model.create({ data: dto });
  }

  findAll(): Promise<TEntity[]> {
    return this.model.findMany();
  }

  findOne(id: number): Promise<TEntity | null> {
    return this.model.findUnique({
      where: { id },
    } as TFindUniqueArgs);
  }

  update(id: number, data: TUpdateDto): Promise<TEntity> {
    return this.model.update({
      where: { id },
      data,
    } as TUpdateArgs);
  }

  remove(id: number): Promise<TEntity> {
    return this.model.delete({
      where: { id },
    } as TDeleteArgs);
  }
}

import { IsArray, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsArray()
  @IsOptional()
  productIds?: number[];

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
}

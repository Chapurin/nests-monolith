import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsArray()
  @ArrayNotEmpty()
  orderProduct: { productId: number }[];

  @IsArray()
  @IsOptional()
  productIds?: number[];

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @IsInt()
  totalAmount: number;
}
